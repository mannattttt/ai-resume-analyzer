import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import { resumes } from "../../constants";
import ResumeCard from "~/components/ResumeCard";
import { redirect } from "react-router";
import { getSession } from "../../server/auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumeMind" },
    { name: "description", content: "Smart Feedback for your dream job!" },
  ];
}

// ─── Loader ───────────────────────────────────────────────────────────────────
// Runs on the server before the page renders.
// If no valid session cookie → redirect to /sign-in.
// Otherwise, return the user info so we can display it in the Navbar.

export async function loader({ request }: Route.LoaderArgs) {
  const user = getSession(request);
  if (!user) throw redirect("/sign-in");
  return { user };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar user={user} />
      <section className="main-section">
        <div className="page-heading py-10">
          <h1>Track Your Applications & Resume Ratings</h1>
          <h2>Review your submissions and check AI-powered feedback</h2>
        </div>
        {resumes.length > 0 && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

