import { redirect } from "next/navigation";

// Redirection legacy : /dashboard → /marketing (renommage mai 2026)
export default function DashboardLegacy() {
  redirect("/marketing");
}
