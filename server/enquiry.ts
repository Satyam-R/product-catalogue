import nodemailer from "nodemailer";
import type { ApiErrorResponse, EnquiryInput, Product } from "../shared/contracts.js";

export type EnquiryFieldErrors = NonNullable<ApiErrorResponse["error"]["fields"]>;

type ContactValidation =
  | { contact: EnquiryInput }
  | { fields: EnquiryFieldErrors };

export type Enquiry = EnquiryInput & { product: Product };

export interface EnquiryMailer {
  send(enquiry: Enquiry): Promise<void>;
}

type SmtpOptions = {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
  to: string;
};

export class SmtpEnquiryMailer implements EnquiryMailer {
  private readonly transport;

  constructor(private readonly options: SmtpOptions) {
    const { host, port, secure, auth } = options;

    this.transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth,
      dnsTimeout: 3_000,
      connectionTimeout: 3_000,
      greetingTimeout: 3_000,
      socketTimeout: 5_000,
    });
  }

  async send({ name, email, product }: Enquiry): Promise<void> {
    const result = await this.transport.sendMail({
      from: this.options.from,
      to: this.options.to,
      replyTo: { name, address: email },
      subject: `Product enquiry: ${product.title}`,
      text: [
        `Product: ${product.title} (${product.id})`,
        `Customer: ${name}`,
        `Email: ${email}`,
      ].join("\n"),
    });

    if (!result.accepted.length) {
      throw new Error("The SMTP server did not accept the enquiry.");
    }
  }
}

const emailAtom = "[a-z0-9!#$%&'*+/=?^_`{|}~-]+";
const domainLabel = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
const emailPattern = new RegExp(`^${emailAtom}(?:\\.${emailAtom})*@${domainLabel}(?:\\.${domainLabel})+$`, "i");

export function isEmailAddress(value: string): boolean {
  return value.length <= 254 && value.indexOf("@") <= 64 && emailPattern.test(value);
}

export function validateContact(body: unknown): ContactValidation {
  const name = readContactField(body, "name");
  const email = readContactField(body, "email");
  const fields: EnquiryFieldErrors = {};

  if (!name || name.length > 100 || /[\r\n]/.test(name)) {
    fields.name = "Enter a name of up to 100 characters.";
  }

  if (!isEmailAddress(email)) {
    fields.email = "Enter a valid email address.";
  }

  if (fields.name || fields.email) {
    return { fields };
  }

  return { contact: { name, email } };
}

function readContactField(body: unknown, field: keyof EnquiryInput): string {
  if (typeof body !== "object" || !body || !Object.hasOwn(body, field)) {
    return "";
  }

  const value = (body as Record<string, unknown>)[field];
  return typeof value === "string" ? value.trim() : "";
}
