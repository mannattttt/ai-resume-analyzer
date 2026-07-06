import { redirect } from "react-router";
import type { Route } from "./+types/sign-out";
import { clearAuthCookie } from "../../server/auth";

// ─── Action ───────────────────────────────────────────────────────────────────
// Handles the sign-out form submission.
//
// How signing out works:
//  1. We can't "delete" an httpOnly cookie from JavaScript
//  2. Instead, we overwrite the auth cookie with one that expires immediately
//  3. The browser then discards it on the next request
//  4. Redirect to /sign-in

export async function action(_: Route.ActionArgs) {
  return redirect("/sign-in", {
    headers: { "Set-Cookie": clearAuthCookie() },
  });
}

// Also handle GET requests to /sign-out (e.g. user types the URL directly)
export async function loader(_: Route.LoaderArgs) {
  return redirect("/sign-in", {
    headers: { "Set-Cookie": clearAuthCookie() },
  });
}

export default function SignOut() {
  return null;
}
