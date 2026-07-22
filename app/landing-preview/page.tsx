import LandingPage from "@/landing-page";

// Throwaway route for previewing the new landing design at /landing-preview.
// It renders the standalone component at the repo root without touching `/`,
// which still serves the current landing page. Delete this route once the
// design is either adopted or dropped.
export default function LandingPreviewPage() {
  return <LandingPage />;
}
