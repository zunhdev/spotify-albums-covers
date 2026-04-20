import { AppError } from "./errors";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";
const SPOTIFY_ACCOUNTS_BASE = "https://accounts.spotify.com";
const ARTIST_ALBUMS_PAGE_SIZE = 10;

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

export type SimplifiedArtist = {
  id: string;
  name: string;
};

export type SimplifiedAlbum = {
  id: string;
  name: string;
  album_type: string;
  album_group?: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  images: SpotifyImage[];
  artists: SimplifiedArtist[];
  external_urls?: {
    spotify?: string;
  };
};

type PagingResponse<T> = {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
};

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export type SpotifyCredentials = {
  clientId: string;
  clientSecret: string;
};

export async function getAccessToken(credentials: SpotifyCredentials): Promise<string> {
  const basic = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString(
    "base64",
  );

  const token = await fetchJson<SpotifyTokenResponse>(
    `${SPOTIFY_ACCOUNTS_BASE}/api/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }).toString(),
    },
    "requesting Spotify access token",
  );

  if (!token.access_token) {
    throw new AppError("Spotify returned no access token.");
  }

  return token.access_token;
}

export async function getArtist(artistId: string, token: string): Promise<{ name: string }> {
  return await fetchJson<{ name: string }>(
    `${SPOTIFY_API_BASE}/artists/${artistId}`,
    {
      headers: getAuthHeaders(token),
    },
    "fetching artist metadata",
  );
}

export async function getAllArtistAlbums(
  artistId: string,
  token: string,
): Promise<SimplifiedAlbum[]> {
  const albums: SimplifiedAlbum[] = [];
  let nextUrl: string | null =
    `${SPOTIFY_API_BASE}/artists/${artistId}/albums` +
    `?include_groups=album&limit=${ARTIST_ALBUMS_PAGE_SIZE}`;

  while (nextUrl) {
    const page: PagingResponse<SimplifiedAlbum> = await fetchJson<PagingResponse<SimplifiedAlbum>>(
      nextUrl,
      {
        headers: getAuthHeaders(token),
      },
      "fetching artist albums",
    );

    albums.push(...page.items);
    nextUrl = page.next;
  }

  return albums;
}

function getAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

async function fetchJson<T>(url: string, init: RequestOptions, context: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(`Network error while ${context}: ${message}`);
  }

  if (!response.ok) {
    const text = await readResponseTextSafe(response);
    throw new AppError(
      `HTTP ${response.status} while ${context}` + (text ? `\nResponse: ${text}` : ""),
    );
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(`Failed to parse JSON while ${context}: ${message}`);
  }
}

async function readResponseTextSafe(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
