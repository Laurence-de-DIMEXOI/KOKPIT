import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cockpit-dark flex flex-col lg:flex-row">
      {/* Left panel — branding (hidden on mobile, shown on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden flex-col items-center justify-center bg-gradient-to-br from-cockpit-dark via-cockpit-card to-cockpit-dark">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cockpit-yellow/5" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-cockpit-yellow/5" />
        <div className="absolute top-1/3 right-12 w-48 h-48 rounded-full bg-cockpit-info/5" />

        <div className="relative z-10 flex flex-col items-center px-12 text-center max-w-lg">
          {/* Logo SVG */}
          <img
            src="/logo-kokpit.svg"
            alt="KÒKPIT"
            className="w-48 h-auto mb-8"
          />

          <p className="text-cockpit-secondary text-base leading-relaxed mb-8">
            Pilotez votre activité Marketing et Commerciale depuis un cockpit
            unique. Campagnes, leads, devis, commandes — tout est centralisé.
          </p>

          <div className="flex items-center gap-6 text-cockpit-secondary text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cockpit-success" />
              <span>Meta Ads</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cockpit-info" />
              <span>Sellsy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cockpit-warning" />
              <span>Glide</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-12">
        {/* Mobile logo — only on small screens */}
        <div className="lg:hidden mb-8 flex flex-col items-center">
          <img
            src="/logo-kokpit.svg"
            alt="KÒKPIT"
            className="w-36 sm:w-40 h-auto mb-2"
          />
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="bg-cockpit-card rounded-2xl shadow-cockpit-lg border border-cockpit p-6 sm:p-8 lg:p-10">
            {children}
          </div>

          {/* Footer */}
          <p className="text-center text-cockpit-secondary text-xs mt-6">
            &copy; {new Date().getFullYear()} KÒKPIT — Le SaaS Peï
          </p>
        </div>
      </div>
    </div>
  );
}
