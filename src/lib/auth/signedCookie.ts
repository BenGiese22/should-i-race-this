import crypto from "crypto";

export const TRANSIENT_COOKIE = "sirtr_oauth"; // short-lived cookie for PKCE/state
export const SESSION_COOKIE = "sirtr_session";

function hmac(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function signJson(value: unknown, secret: string) {
  const json = JSON.stringify(value);
  const sig = hmac(json, secret);
  return Buffer.from(`${json}.${sig}`).toString("base64url");
}

export function verifyJson<T>(token: string, secret: string): T | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot < 0) return null;

    const json = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    const expected = hmac(json, secret);

    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
