import crypto from "node:crypto"

const SHORT_CODE_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const SHORT_CODE_LEN = 8

/**
 * Generate an 8-character cryptographically-random short code for tracking links.
 * Uses ~62^8 ≈ 2.18e14 possible values; collision is handled at insert (retry).
 */
export function generateShortCode(len = SHORT_CODE_LEN): string {
  const bytes = crypto.randomBytes(len)
  let out = ""
  for (let i = 0; i < len; i++) {
    out += SHORT_CODE_CHARS[bytes[i] % SHORT_CODE_CHARS.length]
  }
  return out
}

function getSigningSecret(): string {
  const s = process.env.UNSUBSCRIBE_SIGNING_SECRET
  if (!s) {
    // Fall back to a throwaway secret in dev so links don't crash, but warn.
    if (process.env.NODE_ENV === "production") {
      throw new Error("UNSUBSCRIBE_SIGNING_SECRET must be set in production")
    }
    return "dev-only-insecure-secret-change-me"
  }
  return s
}

const UNSUB_EXPIRES_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

/**
 * Sign an unsubscribe payload (business_id + email) into a URL-safe token.
 * Token format: base64url(payload).base64url(signature).expiry
 */
export function signToken(payload: Record<string, string | number>): string {
  const secret = getSigningSecret()
  const exp = Date.now() + UNSUB_EXPIRES_MS
  const body = Buffer.from(JSON.stringify({ ...payload, exp }), "utf8")
  const sig = crypto.createHmac("sha256", secret).update(body).digest()
  return `${toUrlBase64(body)}.${toUrlBase64(sig)}.${exp}`
}

/** Verify an unsubscribe token and return its payload, or null if invalid/expired. */
export function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const [bodyB64, sigB64, expStr] = token.split(".")
    if (!bodyB64 || !sigB64 || !expStr) return null
    const exp = Number(expStr)
    if (!Number.isFinite(exp) || Date.now() > exp) return null
    const body = Buffer.from(fromUrlBase64(bodyB64), "base64")
    const expected = crypto
      .createHmac("sha256", getSigningSecret())
      .update(body)
      .digest()
    const given = Buffer.from(fromUrlBase64(sigB64), "base64")
    if (expected.length !== given.length) return null
    if (!crypto.timingSafeEqual(expected, given)) return null
    return JSON.parse(body.toString("utf8"))
  } catch {
    return null
  }
}

function toUrlBase64(buf: Buffer): string {
  return buf.toString("base64url")
}
function fromUrlBase64(s: string): string {
  return Buffer.from(s, "base64url").toString("base64")
}
