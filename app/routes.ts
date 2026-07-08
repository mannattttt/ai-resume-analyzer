import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Main app
  index("routes/home.tsx"),

  // Auth routes
  route("sign-in", "routes/sign-in.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
  route("sign-out", "routes/sign-out.tsx"),
  route("upload", "routes/upload.tsx"),
  // Google OAuth — dot notation maps to /auth/google
  route("auth/google", "routes/auth.google.tsx"),
  route("auth/google/callback", "routes/auth.google.callback.tsx"),
] satisfies RouteConfig;
