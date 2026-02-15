import crypto from "node:crypto";
import type { GbvReceiptPayload } from "./types";

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

/**
 * Spec §Stage V: produce HMAC-signed receipt token.
 *
 * @param {GbvReceiptPayload} payload Receipt payload.
 * @param {string} secret Signing secret.
 * @returns {string} Compact receipt token.
 */
export function signReceipt(payload: GbvReceiptPayload, secret: string): string {
  const serialized = JSON.stringify(payload);
  const body = base64UrlEncode(serialized);
  const signature = crypto.createHmac("sha256", secret).update(body).digest();
  return `${body}.${base64UrlEncode(signature)}`;
}

/**
 * Verify and decode a signed receipt token.
 *
 * @param {string} token Compact token.
 * @param {string} secret Signing secret.
 * @returns {GbvReceiptPayload} Decoded payload.
 */
export function verifyReceipt(token: string, secret: string): GbvReceiptPayload {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) {
    throw new Error("Invalid GBV receipt token format");
  }

  const expected = base64UrlEncode(crypto.createHmac("sha256", secret).update(body).digest());
  if (expected !== signature) {
    throw new Error("Invalid GBV receipt signature");
  }

  const parsed = JSON.parse(base64UrlDecode(body));
  return parsed as GbvReceiptPayload;
}
