import { redirect, data } from "react-router";
import type { Route } from "./+types/sign-in";
import { getSession, signJWT, verifyPassword, createAuthCookie } from "../../server/auth";
import { findUserByEmail } from "../../server/users";
import { Link, Form, useActionData, useNavigation } from "react-router";
import { getGoogleAuthURL } from "../../server/google";

// ─── Meta ─────────────────────────────────────────────────────────────────────

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In — ResumeMind" },
    { name: "description", content: "Sign in to your ResumeMind account." },
  ];
}

// ─── Loader ───────────────────────────────────────────────────────────────────
// Runs on the SERVER when the page loads.
// If the user is already logged in, skip the login page and go to home.

export async function loader({ request }: Route.LoaderArgs) {
  const user = getSession(request);
  if (user) throw redirect("/");
  return {};
}

// ─── Action ───────────────────────────────────────────────────────────────────
// Runs on the SERVER when the form is submitted (POST).
// 1. Read email + password from the form
// 2. Find the user in our store
// 3. Verify the password hash
// 4. Sign a JWT and set it as an httpOnly cookie

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Basic validation
  if (!email || !password) {
    return data({ error: "Email and password are required." }, { status: 400 });
  }

  // Look up the user
  const user = findUserByEmail(email);
  if (!user) {
    return data({ error: "Invalid email or password." }, { status: 401 });
  }

  // Google-only users can't use password login
  if (!user.passwordHash) {
    return data(
      { error: "This account uses Google Sign-In. Please use that instead." },
      { status: 401 }
    );
  }

  // Verify the password against the stored bcrypt hash
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return data({ error: "Invalid email or password." }, { status: 401 });
  }

  // All good! Create a JWT and set it as a cookie
  const token = signJWT({ userId: user.id, email: user.email, name: user.name });

  return redirect("/", {
    headers: { "Set-Cookie": createAuthCookie(token) },
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignIn() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Build Google OAuth URL (server-side so env vars are available)
  let googleURL = "/auth/google";

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Heading */}
        <div className="auth-heading">
          <h1 className="auth-title">
            Wel<span className="text-gradient">come Back</span>
          </h1>
          <p className="auth-subtitle">Log In to Continue Your Job Journey</p>
        </div>

        {/* Form Card */}
        <div className="auth-form-card">
          {/* Error Message */}
          {actionData?.error && (
            <div className="auth-error" role="alert">
              {actionData.error}
            </div>
          )}

          {/* Email / Password Form */}
          <Form method="post" className="auth-form">
            <div className="form-div">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-div">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              id="sign-in-btn"
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Log In"}
            </button>
          </Form>

          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Google OAuth Button */}
          <a href={googleURL} id="google-sign-in-btn" className="google-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </a>
        </div>

        {/* Footer Link */}
        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/sign-up" className="auth-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
