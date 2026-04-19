# AGENTS.md

## Purpose

This repository is a local-first development workspace for a shared backend and web client.

- `api`: Express + TypeScript + Swagger UI + local SQLite-compatible storage via `@libsql/client`
- `web`: React + Vite client
- Root workspace: npm workspaces with shared scripts

The current goal is to support local development on Windows without requiring a global Node.js installation.

## Local Runtime Rules

- Do not assume `node` or `npm` are installed globally.
- Use `setup.bat` at the repository root to provision and use the local runtime.
- Local Node.js is installed into `.tools/node/current`.
- Cached downloads live under `.cache`.
- The API env file is `api/.env` and is created automatically from `api/.env.example`.

## Standard Commands

- Initial setup: `setup.bat`
- Start full stack: `setup.bat dev`
- Start API only: `setup.bat dev:api`
- Start web only: `setup.bat dev:web`
- Build all: `setup.bat build`
- Forward an npm command to the local runtime: `setup.bat npm <args>`

## VS Code Workflow

- Tasks are defined in `.vscode/tasks.json`.
- Use `Setup Local Environment` before first run if the local runtime has not been provisioned.
- Use `Start Development Environment`, `Start API Only`, and `Start Web Only` for task-based startup.
- Run and Debug is defined in `.vscode/launch.json`.
- Use `Run Full Stack` to execute `Setup Local Environment` as a `preLaunchTask`, then launch both API and web.
- The default integrated terminal profile is configured in `.vscode/settings.json` to prefer the workspace-local Node.js runtime.

## Important Implementation Notes

- The API database client in `api/src/db.ts` is created lazily. Do not move client creation back to module top-level unless startup ordering is reconsidered.
- The Vite debug launch must run with `cwd=web` and load `vite.config.ts` from that directory. Passing `--root web` to the current Vite CLI fails with `Unknown option --root`.
- On PowerShell, use the workspace terminal profile so `npm.cmd` is used instead of `npm.ps1`.
- `Task Explorer` was removed from recommendations because it failed extension validation in this environment. Prefer standard VS Code tasks.

## Code Organization Rules

- Prefer `1 file = 1 primary responsibility` over keeping related logic in one large file.
- Use `200-300` lines as the normal target size for implementation files.
- When a file grows past roughly `400` lines, review whether it should be split by responsibility.
- When a file grows past roughly `500` lines, treat it as an exception that needs an explicit reason in review.
- Allowed exceptions include focused type-definition files, UI markup-heavy screen components, and schema/query definition files, but only when their responsibility boundary stays clear.
- For the web app, split by `screens`, `hooks`, `services`, and `formatters` before adding more logic to `AppShell.tsx`.
- For the API, keep lazy DB client creation intact and prefer separating `types`, `initialization`, and feature-specific queries instead of growing `db.ts` further.

## Verified Local URLs

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`
- Health check: `http://localhost:3000/health`

## Troubleshooting

- If `node --version` works but `npm` fails in the integrated terminal, open a new terminal after reloading the window so the workspace PowerShell profile is applied.
- If the web server fails to start in Run and Debug with `Unknown option --root`, verify the `Web` configuration still starts from `cwd=web` and uses `vite.config.ts` from that directory.
- If Vite switches to another port like `5174`, something is already using `5173`.
- If the API fails to open `./data/app.db`, check whether startup ordering in `api/src/db.ts` was changed.

## Documentation Maintenance

- Keep `README.md` user-oriented.
- Keep `AGENTS.md` focused on implementation workflow, tooling assumptions, and repository-specific gotchas.
- When changing setup, tasks, debug config, or terminal behavior, update both files together.