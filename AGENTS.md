---
description: Project conventions for the Spotify cover links CLI.
globs: "*.ts, package.json, tsconfig.json, README.md"
alwaysApply: true
---

This is a small local Bun CLI for printing Spotify album cover links.

- Use Bun commands only: `bun install`, `bun run <script>`, `bun test`, and `bunx` when needed.
- Keep TypeScript strict and server-side. Do not add React, JSX, browser app tooling, Vite, or frontend-only libraries.
- Use `.env` for local Spotify credentials, but never commit real secrets.
- Keep behavior deterministic in unit tests. Do not call the Spotify API from tests.
- Use `oxlint` for linting and `oxfmt` for formatting.
- Prefer small focused modules under `src/` over growing the CLI entrypoint.

## Common Commands

```sh
bun run start "<spotify artist url>"
bun run typecheck
bun run lint
bun run format:check
bun test
bun run check
```
