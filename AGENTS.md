# Repository Guidelines

A template app: React + MUI (`src/`), a Hono server on Node (`server/`), deployed with
Kamal (`config/`). Read [CLAUDE.md](./CLAUDE.md) first, including its "AI development" section.

## Commands
`make install` once, `make dev` (Hono + Vite), `make check` before pushing (lint, tests, build),
`make start` / `make image` to try the production build, `make test` (Playwright).

## Style
2-space indentation; `PascalCase` components, `useCamelCase` hooks, `camelCase` utilities.
Keep changes small and consistent with nearby code. Prefer the simplest thing that works.

## Tests, commits, PRs
Tests sit beside the code (`*.test.*`). Add the smallest relevant test, run the narrowest
command that proves it. Short commit subjects (`server: …`, `deploy: …`). Never commit
secrets.
