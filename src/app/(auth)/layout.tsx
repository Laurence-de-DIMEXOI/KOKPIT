export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cockpit flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl border-4 border-yellow-cockpit flex items-center justify-center">
              <span className="text-yellow-cockpit font-bold text-4xl">K</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">KÒKPIT</h1>
          <p className="text-yellow-cockpit text-lg">Le SaaS Peï</p>
        </div>

        {/* Content Card */}
        <div className="bg-card rounded-2xl shadow-2xl p-8">{children}</div>
      </div>
    </div>
  );
}
