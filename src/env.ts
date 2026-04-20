import "dotenv/config";

import { cleanEnv, str, type CleanedEnvAccessors, type ReporterOptions } from "envalid";

import { AppError } from "./errors";

export type SpotifyEnv = Readonly<{
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
}> &
  CleanedEnvAccessors;

export function parseEnv(environment: NodeJS.ProcessEnv): SpotifyEnv {
  return cleanEnv(
    environment,
    {
      SPOTIFY_CLIENT_ID: str({
        desc: "Spotify Web API client ID",
      }),
      SPOTIFY_CLIENT_SECRET: str({
        desc: "Spotify Web API client secret",
      }),
    },
    {
      reporter: throwEnvError,
    },
  );
}

export function loadEnv(): SpotifyEnv {
  return parseEnv(process.env);
}

function throwEnvError<T>(options: ReporterOptions<T>): void {
  const missingNames = Object.keys(options.errors);

  if (missingNames.length === 0) {
    return;
  }

  throw new AppError(
    "Missing or invalid environment variables:\n" +
      missingNames.map((name) => `  ${name}`).join("\n") +
      "\n\nCreate a .env file from .env.example and fill in your Spotify credentials.",
  );
}
