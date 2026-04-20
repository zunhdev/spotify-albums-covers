import { describe, expect, test } from "bun:test";

import {
  dedupeAndClassifyAlbums,
  isLikelyLiveAlbum,
  parseArtistId,
  pickBestCoverUrl,
} from "../src/albums";
import { AppError } from "../src/errors";
import type { SimplifiedAlbum, SpotifyImage } from "../src/spotify";

describe("parseArtistId", () => {
  test("extracts an artist id from a Spotify artist URL with query params", () => {
    expect(parseArtistId("https://open.spotify.com/artist/7kWnE981vITXDnAD2cZmCV?si=abc123")).toBe(
      "7kWnE981vITXDnAD2cZmCV",
    );
  });

  test("rejects invalid artist URLs", () => {
    expect(() => parseArtistId("not a url")).toThrow(AppError);
    expect(() => parseArtistId("https://example.com/artist/7kWnE981vITXDnAD2cZmCV")).toThrow(
      AppError,
    );
    expect(() => parseArtistId("https://open.spotify.com/album/7kWnE981vITXDnAD2cZmCV")).toThrow(
      AppError,
    );
    expect(() => parseArtistId("https://open.spotify.com/artist/not-valid_underscore")).toThrow(
      AppError,
    );
  });
});

describe("pickBestCoverUrl", () => {
  test("prefers exact 640x640 artwork", () => {
    expect(pickBestCoverUrl([image("large", 1200, 1200), image("preferred", 640, 640)])).toBe(
      "preferred",
    );
  });

  test("falls back to the largest available image", () => {
    expect(
      pickBestCoverUrl([
        image("small", 64, 64),
        image("large", 1024, 1024),
        image("unknown", null, null),
      ]),
    ).toBe("large");
  });

  test("returns null when no images are available", () => {
    expect(pickBestCoverUrl([])).toBeNull();
  });
});

describe("isLikelyLiveAlbum", () => {
  test("classifies common live album names", () => {
    expect(isLikelyLiveAlbum("Live at Wembley")).toBe(true);
    expect(isLikelyLiveAlbum("MTV Unplugged")).toBe(true);
    expect(isLikelyLiveAlbum("In Concert")).toBe(true);
  });

  test("does not classify ordinary studio names as live albums", () => {
    expect(isLikelyLiveAlbum("Abbey Road")).toBe(false);
  });
});

describe("dedupeAndClassifyAlbums", () => {
  test("filters, classifies, dedupes, and sorts albums", () => {
    const albums = dedupeAndClassifyAlbums(
      [
        album({
          name: "Second Album",
          releaseDate: "2021-01-01",
          coverUrl: "second",
        }),
        album({
          name: "First Album (Deluxe)",
          releaseDate: "2020-01-01",
          coverUrl: "first",
        }),
        album({
          name: "First Album [Remastered]",
          releaseDate: "2020-01-01",
          coverUrl: "duplicate",
        }),
        album({
          name: "Live at Home",
          releaseDate: "2022-01-01",
          coverUrl: "live",
        }),
        album({
          name: "Guest Release",
          releaseDate: "2019-01-01",
          coverUrl: "guest",
          artistId: "other-artist",
        }),
        album({
          name: "No Artwork",
          releaseDate: "2018-01-01",
          coverUrl: null,
        }),
      ],
      "artist-1",
    );

    expect(albums).toEqual([
      {
        name: "First Album (Deluxe)",
        releaseDate: "2020-01-01",
        coverUrl: "first",
        kind: "Studio",
      },
      {
        name: "Second Album",
        releaseDate: "2021-01-01",
        coverUrl: "second",
        kind: "Studio",
      },
      {
        name: "Live at Home",
        releaseDate: "2022-01-01",
        coverUrl: "live",
        kind: "Live",
      },
    ]);
  });
});

function image(url: string, width: number | null, height: number | null): SpotifyImage {
  return {
    url,
    width,
    height,
  };
}

function album(input: {
  name: string;
  releaseDate: string;
  coverUrl: string | null;
  artistId?: string;
}): SimplifiedAlbum {
  const images = input.coverUrl ? [image(input.coverUrl, 640, 640)] : [];

  return {
    id: `${input.name}-${input.releaseDate}`,
    name: input.name,
    album_type: "album",
    release_date: input.releaseDate,
    release_date_precision: "day",
    total_tracks: 10,
    images,
    artists: [
      {
        id: input.artistId ?? "artist-1",
        name: "Artist",
      },
    ],
  };
}
