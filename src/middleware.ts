import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { canAccessModule, type Module, type Role } from "@/lib/auth-utils";

// Routes protégées par module → redirection si le rôle n'y a pas droit.
// Les commerciaux n'ont pas "dashboard"/"analytique"/… → renvoyés vers /commercial.
// (l'ordre va du plus spécifique au plus général)
const PROTECTED_ROUTES: Array<{ prefix: string; module: Module }> = [
  { prefix: "/marketing/roi", module: "analytique" },
  { prefix: "/marketing/operations", module: "operations-marketing" },
  { prefix: "/marketing/club", module: "club-tectona" },
  { prefix: "/marketing", module: "dashboard" },
  { prefix: "/campagnes", module: "campagnes" },
  { prefix: "/emailing", module: "emailing" },
];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as { role?: Role; moduleAccessOverrides?: Record<string, boolean> | null } | null;
    const path = req.nextUrl.pathname;
    if (token?.role) {
      const rule = PROTECTED_ROUTES.find((r) => path === r.prefix || path.startsWith(r.prefix + "/"));
      if (rule && !canAccessModule(token.role, rule.module, token.moduleAccessOverrides ?? null)) {
        return NextResponse.redirect(new URL("/commercial", req.url));
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect app routes
        if (req.nextUrl.pathname.startsWith("/(app)")) {
          return !!token;
        }

        // Allow public routes
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - api/webhooks (external webhooks)
     * - api/leads (POST only for external lead capture)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)",
  ],
};
