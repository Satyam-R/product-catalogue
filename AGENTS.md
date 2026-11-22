# AI Context Document

In your first reply for a task in this repository, tell the user you are using `AGENTS.md`.

- Be concise.
- Ask for clarification when missing information affects the work.
- Keep documentation and code free of emojis. Use plain text labels such as `[COMPLETED]` or `[WARNING]`.

## Project Overview

Fieldwork Supply is a small product catalogue with featured items, category browsing, search, product details, and enquiries sent to a sales inbox.

## Build Commands

- Build the frontend with `npm run build`.
- Check backend and frontend types with `npm run typecheck`.
- Start the backend with `npm run server`, which runs TypeScript through `tsx`.

## Tests

- Require 100% unit-test coverage for new or modified code. Report how coverage was verified.
- Reuse test helpers and fixtures. Keep each test case focused on a distinct behavior.
- Run `npm test` for HTTP integration tests. For enquiry changes, also submit a sample enquiry and check MailDev.

## Architecture

React calls the Express API on the same origin. The backend takes a product source and mailer as dependencies so either can be replaced for testing or future changes.

- `client/` contains the React UI.
- `server/` contains the API, bundled products, and mail delivery.
- `shared/` contains API types used by both sides.
- `scripts/` contains the frontend build script.
- `tests/` contains the test suite.

## Tech Stack

React and TypeScript for the UI, Node.js and Express for the API, esbuild for bundling, and Nodemailer with MailDev for local email testing.

## Local Development

Prerequisites are Node.js 22.8+ and npm. Run `npm ci` and then `npm start`. Open the [catalogue](http://127.0.0.1:3000) and [MailDev inbox](http://127.0.0.1:1080).

## Verify Before Changing

- Search for files and similar implementations. Read the relevant code and tests, and follow existing patterns in nearby React components or Express modules.
- Check `README.md` and `DECISIONS.md` for requirements and design decisions. Verify features and API contracts in the implementation before writing tests or documentation.
- Check actual configuration files and environment variable names and defaults. Verify dependency versions in `package.json` and `package-lock.json`.
- State implementation assumptions in your final response so the user can review them.

## Code Changes

- Implement only requested behavior. Make the smallest change that meets the request, keep the diff easy to audit, and optimize only for a verified need.
- Preserve existing behavior and compatibility unless the user explicitly requests a breaking change.
- Apply object-oriented principles where they clarify responsibilities. Use small interfaces, encapsulation, and dependency injection at boundaries.
- Reuse existing React components and helpers. Remove unused imports, variables, and code made obsolete by the change.

## Critical Constraints

- Serve all product data through the backend. Keep the default demo runnable without external accounts.
- Keep real customer data and secrets out of logs, tests, and tracked files. Store secrets in a local `.env` and use placeholders in `.env.example`.
- Confirm enquiries only after SMTP accepts them. Preserve form values if delivery fails.
- Leave Git setup and publishing to the project owner.
