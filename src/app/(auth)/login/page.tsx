"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Email ou mot de passe incorrect"
            : result.error || "Une erreur est survenue"
        );
      } else if (result?.ok) {
        // Redirect based on user role
        try {
          const sessionRes = await fetch("/api/auth/session");
          const session = await sessionRes.json();
          const role = session?.user?.role;
          const redirectMap: Record<string, string> = {
            ADMIN: "/commercial",
            DIRECTION: "/commercial",
            COMMERCIAL: "/commercial",
            MARKETING: "/dashboard",
            ACHAT: "/commercial",
          };
          router.push(redirectMap[role] || "/commercial");
        } catch {
          router.push("/commercial");
        }
      }
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      {/* Heading */}
      <div className="text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-bold text-cockpit-heading mb-1">
          Connexion
        </h2>
        <p className="text-cockpit-secondary text-sm">
          Accédez à votre espace KÒKPIT
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Email field */}
      <div>
        <label className="block text-sm font-medium text-cockpit-primary mb-1.5">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <input
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-cockpit-dark border border-cockpit rounded-lg pl-10 pr-4 py-3 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-cockpit-yellow/40 focus:border-cockpit-yellow/50 transition-all"
          />
        </div>
      </div>

      {/* Password field */}
      <div>
        <label className="block text-sm font-medium text-cockpit-primary mb-1.5">
          Mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cockpit-secondary" />
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-cockpit-dark border border-cockpit rounded-lg pl-10 pr-4 py-3 text-sm text-cockpit-primary placeholder:text-cockpit-secondary focus:outline-none focus:ring-2 focus:ring-cockpit-yellow/40 focus:border-cockpit-yellow/50 transition-all"
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-cockpit-yellow text-cockpit-dark font-bold py-3 px-4 rounded-lg hover:bg-cockpit-yellow/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <LogIn className="w-5 h-5" />
        )}
        {loading ? "Connexion..." : "Se connecter"}
      </button>

      {/* Footer link */}
      <div className="pt-4 border-t border-cockpit text-center">
        <p className="text-cockpit-secondary text-xs sm:text-sm">
          Besoin d&apos;aide ?{" "}
          <a
            href="mailto:support@dimexoi.fr"
            className="text-cockpit-yellow font-semibold hover:underline"
          >
            Contacter le support
          </a>
        </p>
      </div>
    </form>
  );
}
