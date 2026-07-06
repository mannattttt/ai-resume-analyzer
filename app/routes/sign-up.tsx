import { redirect, data } from "react-router";
import type { Route } from "./+types/sign-up";
import { getSession, signJWT, createAuthCookie } from "../../server/auth";
import { findUserByEmail, createUser } from "../../server/users";
import { Link, Form, useActionData, useNavigation } from "react-router";

// ─── Meta ─────────────────────────────────────────────────────────────────────

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up — ResumeMind" },
    { name: "description", content: "Create your ResumeMind account." },
  ];
}

// ─── Loader ───────────────────────────────────────────────────────────────────
// If already logged in, skip sign-up and go home.

export async function loader({ request }: Route.LoaderArgs) {
  const user = getSession(request);
  if (user) throw redirect("/");
  return {};
}

// ─── Action ───────────────────────────────────────────────────────────────────
// Handles form submission (POST):
// 1. Validate all fields
// 2. Check email not already taken
// 3. Hash password + create user
// 4. Sign JWT and set cookie → redirect to home

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    return data({ error: "All fields are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return data(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return data({ error: "Passwords do not match." }, { status: 400 });
  }

  // Check if email is taken
  const existing = findUserByEmail(email);
  if (existing) {
    return data(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  // Create the user (password gets hashed inside createUser)
  const newUser = await createUser({ name, email, password });

  // Sign JWT and redirect to home
  const token = signJWT({
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
  });

  return redirect("/", {
    headers: { "Set-Cookie": createAuthCookie(token) },
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignUp() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Heading */}
        <div className="auth-heading">
          <h1 className="auth-title">
            Get <span className="text-gradient">Started</span>
          </h1>
          <p className="auth-subtitle">Create Your Account to Begin</p>
        </div>

        {/* Form Card */}
        <div className="auth-form-card">
          {/* Error Message */}
          {actionData?.error && (
            <div className="auth-error" role="alert">
              {actionData.error}
            </div>
          )}

          <Form method="post" className="auth-form">
            <div className="form-div">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </div>

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
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-div">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              id="sign-up-btn"
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>
          </Form>
        </div>

        {/* Footer Link */}
        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/sign-in" className="auth-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
