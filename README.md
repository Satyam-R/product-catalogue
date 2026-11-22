<<<<<<< HEAD
# Product catalogue

A small web catalogue for browsing, searching, and sending product enquiries. The demo uses 12 bundled products and a local email inbox.

## Run locally

Use Node.js 22.8 or newer and npm. From the repository root, run:

```sh
npm ci
npm start
```

Open the [catalogue](http://127.0.0.1:3000) and the [MailDev inbox](http://127.0.0.1:1080). Search for `stainless steel`, open the kettle, click **Enquire**, and submit `Demo Customer` and `customer@example.test`. The app shows **Thank you** when the local SMTP server accepts the message. The inbox shows the destination, reply-to address, and the product and contact details. Use `Ctrl+C` to stop both processes.

On Windows, `npm.cmd` can be used if PowerShell blocks `npm.ps1`. The first `npm ci` needs access to the npm registry. After installation, the bundled catalogue and inbox work offline.

## Configuration

The demo uses its built-in settings. To change the server port or configure a different SMTP provider, copy `.env.example` to `.env` and edit the relevant values. `SMTP_SECURE` enables TLS from connection start. Set `SMTP_USER` and `SMTP_PASSWORD` together if the server requires credentials. The sending address is `MAIL_FROM`, and `SALES_EMAIL` is the destination. Keep `.env` local.

The local inbox uses SMTP port `1025` and web port `1080`. If either is busy, build with `npm run build`, start `npm run inbox -- --smtp 2625 --web 1081` in one terminal, and run `npm run server` with `SMTP_PORT=2625` configured in `.env` in another. Then open the inbox at `http://127.0.0.1:1081`.

## Stack and checks

React and TypeScript let the application share product tiles and response types across its pages. Node.js and Express keep product selection, search, validation, and email delivery behind one API. esbuild bundles the browser app, which Express serves from the same origin. Nodemailer sends the enquiry over SMTP, and MailDev captures it locally for review.

```sh
npm run typecheck
npm test
npm run build
```

The HTTP tests run against a local Express instance with controlled mail delivery. To verify the SMTP integration, follow the browser walkthrough and check the inbox. See [decisions and assumptions](DECISIONS.md) and [AI usage](AI_USAGE.md) for the reasoning and review notes.
=======
# product-catalogue
React and Node.js simple catalogue
>>>>>>> origin/main
