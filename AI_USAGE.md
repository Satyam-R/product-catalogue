# AI usage

## Tools and plan

Codex (GPT-6) helped read the challenge, draft the implementation plan, write the application, and review the result. Codex agents split up the React client, Express backend, and HTTP tests. The plan and agent directions were supplied in the Codex conversation.

The plan was to agree on the product and enquiry API first, implement the UI and backend in parallel, then use the standard startup steps to verify the complete enquiry flow against a local SMTP inbox. The [decisions](DECISIONS.md) record the choices that came out of planning.

## Moments that shaped the result

1. Extracted the five acceptance criteria and submission checklist from the challenge before deciding on architecture.
2. Used the request for a minimal React and Node.js implementation with object-oriented design where useful to put interfaces at the catalogue and mail boundaries, and keep ranking and search as functions.
3. Confirmed the bundled catalogue with the project owner. Representative sample data made the test cases deterministic and kept the demo independent of a product API.
4. Asked for independent API tests built from the shared contract. The tests use the bundled catalogue to exercise rating ties and description-only search. The injected mailer covers failure, and the browser run checks real SMTP delivery.
5. Used the installed Node.js version and a full dependency audit to check the proposed toolchain. Both checks changed the final setup.

## Corrections after review

- The initial process-runner install brought in dependencies whose supported Node.js patch version was newer than the local one. npm reported engine warnings. An updated compatible 9.x release resolved that mismatch and passed the advisory check.
- The first clean `npm start` exposed a CommonJS-to-ES-module compatibility error inside MailDev on Node.js 22.8. The inbox command enables Node's compatibility flag. A clean install and browser-to-inbox check verify the resulting setup.
- The initial development dependency tree contained transitive advisories. Reviewing the dependency chains led to targeted overrides for the mail tooling and a second `npm audit` after the final install.

## Time spent

Rounded estimates for the Codex-assisted session were 3 minutes planning, 4 minutes building, 4 minutes testing, and 3 minutes reviewing and preparing the submission. Coding and testing overlapped where agents worked independently. These estimates include time resolving local startup issues.
