import { resolve } from "node:path";
import { createApp } from "./app.js";
import { BundledProductSource } from "./catalogue.js";
import { isEmailAddress, SmtpEnquiryMailer } from "./enquiry.js";

function loadLocalEnvironment(): void {
  try {
    process.loadEnvFile();
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw new Error("Could not read the local .env file.", { cause: error });
    }
  }
}

function portFromEnv(name: string, fallback: number): number {
  const value = process.env[name] || String(fallback);
  const port = Number(value);

  if (!/^\d+$/.test(value) || port < 1 || port > 65_535) {
    throw new Error(`${name} must be an integer from 1 to 65535.`);
  }

  return port;
}

function addressFromEnv(name: string, fallback: string): string {
  const address = process.env[name]?.trim() || fallback;

  if (!isEmailAddress(address)) {
    throw new Error(`${name} must contain a valid email address.`);
  }

  return address;
}

function createEnquiryMailer(): SmtpEnquiryMailer {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secureSetting = process.env.SMTP_SECURE || "false";

  if (Boolean(user) !== Boolean(pass)) {
    throw new Error("Set SMTP_USER and SMTP_PASSWORD together.");
  }

  if (secureSetting !== "true" && secureSetting !== "false") {
    throw new Error("SMTP_SECURE must be true or false.");
  }

  return new SmtpEnquiryMailer({
    host: process.env.SMTP_HOST || "127.0.0.1",
    port: portFromEnv("SMTP_PORT", 1025),
    secure: secureSetting === "true",
    auth: user && pass ? { user, pass } : undefined,
    from: addressFromEnv("MAIL_FROM", "catalogue@example.test"),
    to: addressFromEnv("SALES_EMAIL", "sales@example.test"),
  });
}

function start(): void {
  loadLocalEnvironment();

  const host = process.env.HOST || "127.0.0.1";
  const port = portFromEnv("PORT", 3000);
  const app = createApp({
    productSource: new BundledProductSource(),
    enquiryMailer: createEnquiryMailer(),
    staticPath: resolve("dist/client"),
  });

  const server = app.listen(port, host);
  server.once("listening", () => console.log(`Catalogue listening on http://${host}:${port}`));
  server.once("error", (error: NodeJS.ErrnoException) => {
    const message = error.code === "EADDRINUSE"
      ? `Port ${port} is already in use. Change PORT or stop the process using it.`
      : `Could not listen on ${host}:${port} (${error.code ?? "unknown error"}).`;
    console.error(message);
    process.exitCode = 1;
  });
}

try {
  start();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not start the catalogue.");
  process.exitCode = 1;
}
