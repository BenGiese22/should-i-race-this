import crypto from "crypto";

function base64url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function randomUrlSafeString(bytes = 32) {
  return base64url(crypto.randomBytes(bytes));
}

export function pkceChallengeFromVerifier(verifier: string) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64url(hash);
}
