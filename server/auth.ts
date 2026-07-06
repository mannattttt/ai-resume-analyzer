import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

// ─── Environment ──────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d"; // Token lasts 7 days
const COOKIE_NAME = "auth_token";

// ─── Password Utilities ───────────────────────────────────────────────────────

/**
 * Hashes a plain-text password using bcrypt (10 salt rounds).
 * We NEVER store plain passwords — only the hash.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compares a plain-text password against a stored bcrypt hash.
 * Returns true if they match.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Utilities ────────────────────────────────────────────────────────────

/**
 * Signs a JWT token containing the user's id, email, and name.
 * The token is valid for JWT_EXPIRES_IN (7 days).
 *
 * How it works:
 *   1. Takes a payload (userId, email, name)
 *   2. Creates a cryptographically signed string
 *   3. The signature uses JWT_SECRET — only our server can verify it
 */
export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 * Returns null if the token is invalid or expired.
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Cookie Utilities ─────────────────────────────────────────────────────────

/**
 * Builds a Set-Cookie header string that:
 *  - Is httpOnly (JS can't read it → safe from XSS attacks)
 *  - Is Secure in production (only sent over HTTPS)
 *  - Uses SameSite=Lax (protects against CSRF)
 *  - Expires in 7 days
 */
export function createAuthCookie(token: string): string {
  const maxAge = 60 * 60 * 24 * 7; // 7 days in seconds
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Path=/${secure}`;
}

/**
 * Returns a Set-Cookie header that immediately expires the auth cookie.
 * Used on sign-out to clear the session.
 */
export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}

/**
 * Reads the auth cookie from the incoming Request, verifies the JWT,
 * and returns the decoded user payload.
 *
 * Returns null if:
 *  - No cookie is present (user not logged in)
 *  - Cookie is present but JWT is invalid/expired
 */
export function getSession(request: Request): JWTPayload | null {
  const cookieHeader = request.headers.get("Cookie") || "";

  // Parse cookies: "name=value; name2=value2" → find our token
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key.trim(), rest.join("=")];
    })
  );

  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  return verifyJWT(token);
}
