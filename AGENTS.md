# Repository Guidelines

## Project Structure & Module Organization
Runtime entry points live in `src/index.js` (stdio) and `src/http-server.js` (Streamable HTTP). `src/server.js` wires tool registrations, while each Zendesk surface ships its own module under `src/tools/` (tickets, users, automations, etc.). Shared API logic belongs in `src/zendesk-client.js`. Deployment collateral sits in `docker/` plus the `Dockerfile`, and the integration harness `test-mcp.js` at the repo root exercises both transports. Keep credentials in a local `.env`; never commit them.

## Build, Test, and Development Commands
Use `npm install` once, then `npm start` for stdio transport or `npm run start:http` for HTTP. Use `npm run dev` / `npm run dev:http` for `node --watch` reloads. `make build` and `make start` wrap the Docker workflow. `npm run inspect` opens the MCP Inspector against stdio, and `node test-mcp.js` (or `node test-mcp.js http`) validates that all 49 tools stay discoverable.

## Coding Style & Naming Conventions
The codebase targets modern ESM Node (top-level `import`, `export`, async/await). Follow the prevailing 2-space indentation, single quotes, and trailing commas in multi-line literals. Tool modules export arrays of `{ name, description, schema, handler }`; keep handlers pure and log via the centralized client when touching Zendesk. Name files kebab-case (`help-center.js`), environment variables screaming snake case, and document any new tool in `README.md`.

## Testing Guidelines
`test-mcp.js` doubles as both regression and smoke coverage—extend it whenever tool behavior changes so every transport still reports the expected tool count and sample invocations. For manual validation, pair `npm run start:http` with `node test-mcp.js http` so HTTP-only changes do not regress stdio. Keep sample payloads small and redact ticket data in logs. If you add a formal suite later, place it under `test/` and ensure CI runs it before deployment.

## Commit & Pull Request Guidelines
History shows short, imperative subjects (`Add Docker entrypoint script…`, `Implement per-session server isolation…`). Match that style, reference issue IDs when relevant, and split unrelated changes. Pull requests should describe the surface touched, list new tools or endpoints, document configuration changes, and include test evidence (command output or screenshots of MCP Inspector). Flag breaking API changes and request review from another maintainer before merging.

## Security & Configuration Tips
Every environment boot needs `ZENDESK_SUBDOMAIN`, `ZENDESK_EMAIL`, `ZENDESK_API_TOKEN`, and optionally `MCP_AUTH_TOKEN`, `PORT`, `ENV`, or `LOCAL`. Treat those secrets as write-only in CI, rotate tokens after testing, and default to least privilege. Before exposing HTTP transport, spot-check `/health`, `/metrics`, `/connections` and keep logs free of PII.
