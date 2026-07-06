// ─── Google OAuth Helper ──────────────────────────────────────────────────────
//
// How Google OAuth 2.0 works (3 steps):
//
// 1. REDIRECT → We send the user to Google's accounts page with our Client ID
//               and the "scopes" (permissions) we want: profile + email
//
// 2. CALLBACK → After the user approves, Google redirects back to our app
//               with a short-lived `code` in the URL query string
//
// 3. EXCHANGE → We POST to Google with that `code` to get an access_token,
//               then use the access_token to fetch the user's profile
//
// ─────────────────────────────────────────────────────────────────────────────

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
}

// ─── Step 1: Build the Google Authorization URL ───────────────────────────────

/**
 * Builds the URL we redirect the user to when they click "Sign in with Google".
 *
 * Parameters explained:
 *  - client_id:     Our app's Google Client ID (from Google Cloud Console)
 *  - redirect_uri:  Where Google sends the user BACK after they approve
 *  - response_type: "code" means we want an auth code (not a token directly)
 *  - scope:         What info we're requesting — openid, profile, email
 *  - access_type:   "offline" allows refresh tokens (optional but useful)
 */
export function getGoogleAuthURL(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI in environment variables."
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
    access_type: "offline",
    prompt: "select_account", // Always show account picker
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// ─── Step 2 → 3: Exchange Code for Tokens ────────────────────────────────────

/**
 * After Google redirects back to our app with ?code=..., we call this
 * to exchange the temporary code for a real access_token.
 *
 * This is a server-to-server POST request (not visible to the user).
 */
export async function getGoogleTokens(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth environment variables.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange Google auth code: ${error}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

// ─── Step 3: Fetch Google User Profile ───────────────────────────────────────

/**
 * Uses the access_token to call Google's userinfo endpoint.
 * Returns the user's Google ID, email, name, and profile picture.
 */
export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google user profile.");
  }

  return response.json() as Promise<GoogleUser>;
}
