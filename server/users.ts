import { hashPassword } from "./auth";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null; // null for Google OAuth users (no password)
  googleId: string | null;     // null for email/password users
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password?: string;   // Optional: Google users have no password
  googleId?: string;   // Optional: only for Google OAuth users
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────
// This acts as our "database" for now.
// In production, swap this with real DB calls (Supabase, Prisma, MongoDB, etc.)
// The interface (findUserByEmail, createUser) stays exactly the same.

const users: User[] = [];

// ─── User Queries ─────────────────────────────────────────────────────────────

/**
 * Find a user by their email address (case-insensitive).
 * Used during login to look up the account.
 */
export function findUserByEmail(email: string): User | null {
  return users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  ) ?? null;
}

/**
 * Find a user by their unique ID.
 * Used to look up the current user from the JWT payload.
 */
export function findUserById(id: string): User | null {
  return users.find((u) => u.id === id) ?? null;
}

/**
 * Find a user by their Google account ID.
 * Used during Google OAuth callback to check if this Google account
 * is already linked to a user in our system.
 */
export function findUserByGoogleId(googleId: string): User | null {
  return users.find((u) => u.googleId === googleId) ?? null;
}

/**
 * Creates a new user and stores them.
 *
 * For email/password users: hashes the password before storing.
 * For Google OAuth users: stores the googleId, passwordHash = null.
 *
 * Returns the created user (without exposing the hash externally).
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  const existingUser = findUserByEmail(input.email);
  if (existingUser) {
    throw new Error("A user with this email already exists.");
  }

  const passwordHash = input.password
    ? await hashPassword(input.password)
    : null;

  const newUser: User = {
    id: crypto.randomUUID(), // Built-in Node.js UUID generator
    email: input.email,
    name: input.name,
    passwordHash,
    googleId: input.googleId ?? null,
    createdAt: new Date(),
  };

  users.push(newUser);
  return newUser;
}
