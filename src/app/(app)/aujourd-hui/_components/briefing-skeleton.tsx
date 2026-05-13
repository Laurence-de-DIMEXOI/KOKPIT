export function BriefingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-cockpit-card rounded-xl border border-cockpit shadow-cockpit-lg overflow-hidden"
        >
          <div className="h-1.5 bg-cockpit-dark animate-pulse" />
          <div className="p-4 sm:p-5 space-y-3">
            <div className="h-5 w-1/2 rounded bg-cockpit-dark animate-pulse" />
            <div className="space-y-2 mt-4">
              <div className="h-12 rounded bg-cockpit-dark/60 animate-pulse" />
              <div className="h-12 rounded bg-cockpit-dark/60 animate-pulse" />
              <div className="h-12 rounded bg-cockpit-dark/60 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
