import { describe, expect, test } from "bun:test";

import { parseEnv } from "../src/env";

describe("parseEnv", () => {
  test("returns typed Spotify credentials", () => {
    const env = parseEnv({
      SPOTIFY_CLIENT_ID: "client-id",
      SPOTIFY_CLIENT_SECRET: "client-secret",
    });

    expect(env.SPOTIFY_CLIENT_ID).toBe("client-id");
    expect(env.SPOTIFY_CLIENT_SECRET).toBe("client-secret");
  });

  test("throws when Spotify credentials are missing", () => {
    expect(() => parseEnv({})).toThrow();
  });
});
