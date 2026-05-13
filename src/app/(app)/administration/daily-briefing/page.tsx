import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DailyBriefingEligibles } from "@/components/admin/daily-briefing-eligibles";

export const dynamic = "force-dynamic";

export default async function AdminDailyBriefingPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !["ADMIN", "DIRECTION"].includes(role || "")) {
    redirect("/");
  }
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" data-espace="admin">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-cockpit-heading">
          Daily Briefing — Administration
        </h1>
        <p className="text-sm text-cockpit-secondary mt-1">
          Configurer qui voit la page <code>/aujourd-hui</code>.
        </p>
      </header>
      <DailyBriefingEligibles />
    </div>
  );
}
