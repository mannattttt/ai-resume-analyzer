import { redirect } from "react-router";
import type { Route } from "./+types/auth.google";
import { getGoogleAuthURL } from "../../server/google";

// ─── Loader ───────────────────────────────────────────────────────────────────
// This route has NO component/UI — it's purely a server-side redirect.
//
// When the user clicks "Continue with Google":
//   1. They hit GET /auth/google
//   2. This loader builds the Google OAuth URL
//   3. We redirect the browser to accounts.google.com
//   4. The user sees Google's login/permission screen

export async function loader({ request: _request }: Route.LoaderArgs) {
  try {
    const googleURL = getGoogleAuthURL();
    throw redirect(googleURL);
  } catch (error) {
    // If env vars are missing, redirect to sign-in with an error message
    if (error instanceof Response) throw error; // Re-throw actual redirects
    throw redirect("/sign-in?error=google_not_configured");
  }
}

// No default export needed — this route is redirect-only
export default function AuthGoogle() {
  return null;
}
