import { AppError } from "./errors";
import type { SimplifiedAlbum, SpotifyImage } from "./spotify";

export type AlbumKind = "Studio" | "Live";

export type OutputAlbum = {
  name: string;
  releaseDate: string;
  coverUrl: string;
  kind: AlbumKind;
};

export function parseArtistId(input: string): string {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new AppError(`Invalid URL: ${input}`);
  }

  if (url.hostname !== "open.spotify.com") {
    throw new AppError(`Expected a Spotify URL, got: ${url.hostname}`);
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const [resourceType, artistId] = parts;

  if (resourceType !== "artist" || !artistId) {
    throw new AppError("Expected a Spotify artist URL like https://open.spotify.com/artist/<id>");
  }

  if (!/^[A-Za-z0-9]+$/.test(artistId)) {
    throw new AppError("Could not extract a valid Spotify artist ID from URL.");
  }

  return artistId;
}

export function normalizeAlbumName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function isLikelyLiveAlbum(name: string): boolean {
  const normalizedName = normalizeAlbumName(name);
  const livePatterns: RegExp[] = [
    /\blive\b/,
    /\blive at\b/,
    /\blive in\b/,
    /\blive from\b/,
    /\bunplugged\b/,
    /\bmtv unplugged\b/,
    /\bin concert\b/,
    /\bon stage\b/,
    /\bsessions?\b/,
    /\bconcert\b/,
  ];

  return livePatterns.some((pattern) => pattern.test(normalizedName));
}

export function pickBestCoverUrl(images: SpotifyImage[]): string | null {
  if (images.length === 0) {
    return null;
  }

  const exact640 = images.find((image) => image.width === 640 && image.height === 640);
  if (exact640) {
    return exact640.url;
  }

  const sorted = [...images].sort((a, b) => {
    const areaA = (a.width ?? 0) * (a.height ?? 0);
    const areaB = (b.width ?? 0) * (b.height ?? 0);
    return areaB - areaA;
  });

  return sorted[0]?.url ?? null;
}

export function dedupeAndClassifyAlbums(
  rawAlbums: SimplifiedAlbum[],
  artistId: string,
): OutputAlbum[] {
  const seen = new Set<string>();
  const result: OutputAlbum[] = [];

  for (const album of rawAlbums) {
    if (!isPrimaryArtistAlbum(album, artistId)) {
      continue;
    }

    const coverUrl = pickBestCoverUrl(album.images);
    if (!coverUrl) {
      continue;
    }

    const kind: AlbumKind = isLikelyLiveAlbum(album.name) ? "Live" : "Studio";
    const key = [normalizeAlbumName(album.name), album.release_date, kind].join("::");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push({
      name: album.name,
      releaseDate: album.release_date,
      coverUrl,
      kind,
    });
  }

  result.sort((a, b) => {
    const byDate = a.releaseDate.localeCompare(b.releaseDate);
    if (byDate !== 0) {
      return byDate;
    }

    return a.name.localeCompare(b.name);
  });

  return result;
}

function isPrimaryArtistAlbum(album: SimplifiedAlbum, artistId: string): boolean {
  return album.artists.some((artist) => artist.id === artistId);
}
