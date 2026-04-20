# Spotify Covers

[![CI](https://github.com/Droidion/spotify-albums-covers/actions/workflows/ci.yml/badge.svg)](https://github.com/Droidion/spotify-albums-covers/actions/workflows/ci.yml)

A local Bun CLI that prints Spotify album cover image URLs for a Spotify artist.
It fetches the artist's albums, keeps primary-artist album releases, deduplicates
common duplicate listings, classifies likely live albums, and prints studio and
live album cover links.

## Setup

This project uses [mise](https://mise.jdx.dev/) to pin the Bun runtime. From the
project root, install the configured tool version if needed:

```sh
mise install
```

Install dependencies:

```sh
bun install
```

Create a local `.env` file:

```sh
SPOTIFY_CLIENT_ID=your-client-id
SPOTIFY_CLIENT_SECRET=your-client-secret
```

You can get these credentials from a Spotify app in the Spotify Developer
Dashboard. Real `.env` files are ignored by git.

## Run

```sh
bun run start "https://open.spotify.com/artist/7kWnE981vITXDnAD2cZmCV"
```

Output is grouped by album kind. Each album prints its name followed by the
selected cover URL.

## Development

Tooling is configured in the repo:

- Bun is pinned in `mise.toml`.
- TypeScript is configured for a strict server-side Bun CLI in `tsconfig.json`.
- Oxlint is configured in `.oxlintrc.json` and lints the TypeScript source and
  tests.
- Oxfmt is configured in `.oxfmtrc.json` and formats TypeScript plus JSON files,
  including Zed project settings.
- Zed project settings live in `.zed/settings.json`. They disable ESLint for
  this project, use Oxc tooling for TypeScript, and use Oxfmt for JSON/JSONC
  formatting while keeping Zed's JSON language server for schema validation.
- Taze is installed as a dev dependency for checking and updating pinned package
  versions.
- GitHub Actions are configured in `.github/workflows/ci.yml` to install the
  mise-pinned Bun version, install dependencies from the lockfile, then run
  typechecking, linting, formatting checks, and tests.
- Dependabot is configured in `.github/dependabot.yml` for GitHub Actions and
  npm package update checks.

Package scripts:

- `bun run start "<spotify artist url>"`: run the CLI.
- `bun run typecheck`: run TypeScript with `noEmit`.
- `bun test`: run unit tests with Bun's test runner.
- `bun run lint`: lint TypeScript source and tests with Oxlint.
- `bun run lint:fix`: apply safe Oxlint fixes.
- `bun run format`: format TypeScript and JSON files with Oxfmt.
- `bun run format:check`: verify TypeScript and JSON formatting.
- `bun run check`: run typecheck, lint, format check, and tests.
- `bun run taze:check`: report available major updates, including locked
  dependencies.
- `bun run taze:upgrade:safe`: update package ranges within Taze's default safe
  mode.
- `bun run taze:upgrade:all`: update package ranges across major versions,
  including locked dependencies.

Common checks:

```sh
bun run typecheck
bun run lint
bun run format:check
bun test
bun run check
```

Use `bun run format` to apply formatting with Oxfmt, or `bun run lint:fix` to
apply safe Oxlint fixes.
