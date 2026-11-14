// Minimal signed-cookie admin session. Uses Web Crypto so it works in middleware (edge) and Node.

export const ADMIN_COOKIE = "admin_session";
export const SESSION_SECONDS = 60 * 60 * 8;

const encoder = new TextEncoder();

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "";
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign"
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && secret());
}

export function checkCredentials(username: string, password: string) {
  if (!adminConfigured()) return false;
  const userOk = safeEqual(username, process.env.ADMIN_USERNAME as string);
  const passOk = safeEqual(password, process.env.ADMIN_PASSWORD as string);
  return userOk && passOk;
}

export async function createSessionToken() {
  const expires = String(Date.now() + SESSION_SECONDS * 1000);
  return `${expires}.${await sign(expires)}`;
}

export async function verifySessionToken(token?: string) {
  if (!token || !secret()) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (Number(expires) < Date.now()) return false;
  return safeEqual(signature, await sign(expires));
}
