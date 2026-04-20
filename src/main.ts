#!/usr/bin/env bun

import { dedupeAndClassifyAlbums, parseArtistId, type OutputAlbum } from "./albums";
import { loadEnv } from "./env";
import { AppError } from "./errors";
import { getAccessToken, getAllArtistAlbums, getArtist } from "./spotify";

async function main(): Promise<void> {
  const env = loadEnv();
  const artistUrl = Bun.argv[2]?.trim();

  if (!artistUrl) {
    throw new AppError(
      "Missing Spotify artist URL.\n" + "Usage:\n" + '  bun run start "<spotify artist url>"',
    );
  }

  const artistId = parseArtistId(artistUrl);
  const token = await getAccessToken({
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
  });
  const artist = await getArtist(artistId, token);
  const rawAlbums = await getAllArtistAlbums(artistId, token);
  const albums = dedupeAndClassifyAlbums(rawAlbums, artistId);

  if (albums.length === 0) {
    throw new AppError(`No studio/live albums with cover images found for "${artist.name}".`);
  }

  const studioAlbums = albums.filter((album) => album.kind === "Studio");
  const liveAlbums = albums.filter((album) => album.kind === "Live");

  console.error(`Artist: ${artist.name}`);
  console.error(`Total albums found: ${albums.length}`);
  console.error(`Studio: ${studioAlbums.length}`);
  console.error(`Live: ${liveAlbums.length}`);
  console.error("");

  printAlbums("Studio", studioAlbums);
  printAlbums("Live", liveAlbums);
}

function printAlbums(label: string, albums: OutputAlbum[]): void {
  console.log(`${label} albums: ${albums.length}`);
  console.log("");

  for (const album of albums) {
    console.log(album.name);
    console.log(album.coverUrl);
    console.log("");
  }
}

main().catch((error: unknown) => {
  if (error instanceof AppError) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }

  const message = error instanceof Error ? error.stack || error.message : String(error);

  console.error(`Unexpected error:\n${message}`);
  process.exit(1);
});
