import { redirect } from "react-router";
import type { Route } from "./+types/auth.google.callback";
import { getGoogleTokens, getGoogleUser } from "../../server/google";
import {
  findUserByEmail,
  findUserByGoogleId,
  createUser,
} from "../../server/users";
import { signJWT, createAuthCookie } from "../../server/auth";

// ─── Loader ───────────────────────────────────────────────────────────────────
// Google calls this URL after the user approves:
//   GET /auth/google/callback?code=XXXXX
//
// What happens here:
//  1. Extract the `code` from the URL query string
//  2. Exchange the code for a Google access_token (server-to-server)
//  3. Use the access_token to fetch the user's Google profile (id, email, name)
//  4. Check if a user with this googleId already exists
//  5. If not, check if the email exists (link the Google account to it)
//  6. If still not, create a brand-new user
//  7. Sign a JWT and set the cookie → redirect to home

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // User denied Google access or something went wrong on Google's side
  if (error || !code) {
    throw redirect("/sign-in?error=google_cancelled");
  }

  try {
    // Step 1: Exchange code → access token
    const tokens = await getGoogleTokens(code);

    // Step 2: Fetch Google profile
    const googleUser = await getGoogleUser(tokens.access_token);

    // Step 3: Find or create our user
    let user = findUserByGoogleId(googleUser.id);

    if (!user) {
      // Check if there's already an account with this email (email/password user)
      const existingByEmail = findUserByEmail(googleUser.email);

      if (existingByEmail) {
        // Link the Google ID to the existing account
        // (In a real DB, you'd do an UPDATE here)
        user = existingByEmail;
      } else {
        // Brand new user — create account
        user = await createUser({
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
        });
      }
    }

    // Step 4: Issue JWT cookie and redirect home
    const token = signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return redirect("/", {
      headers: { "Set-Cookie": createAuthCookie(token) },
    });
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    throw redirect("/sign-in?error=google_failed");
  }
}

export default function AuthGoogleCallback() {
  return (
    <div className="auth-page">
      <p style={{ color: "#606beb" }}>Completing sign in...</p>
    </div>
  );
}
