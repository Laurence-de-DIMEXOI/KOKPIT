import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      nom: string;
      prenom: string;
      role: string;
      showroomId: string | null;
      moduleAccessOverrides: Record<string, boolean> | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    showroomId: string | null;
    nom: string;
    prenom: string;
    moduleAccessOverrides: Record<string, boolean> | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            nom: true,
            prenom: true,
            role: true,
            showroomId: true,
            actif: true,
            moduleAccessOverrides: true,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        if (!user.actif) {
          throw new Error("User account is disabled");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          showroomId: user.showroomId,
          moduleAccessOverrides: user.moduleAccessOverrides as Record<string, boolean> | null,
        };
      },
    }),
  ],
  // strategy: "jwt", // Removed - not a valid NextAuthOptions property
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.showroomId = (user as any).showroomId || null;
        token.nom = (user as any).nom;
        token.prenom = (user as any).prenom;
        token.moduleAccessOverrides = ((user as any).moduleAccessOverrides as Record<string, boolean>) || null;
      }
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { nom: true, prenom: true, role: true, showroomId: true, moduleAccessOverrides: true },
        });
        if (dbUser) {
          token.nom = dbUser.nom;
          token.prenom = dbUser.prenom;
          token.role = dbUser.role;
          token.showroomId = dbUser.showroomId;
          token.moduleAccessOverrides = (dbUser.moduleAccessOverrides as Record<string, boolean>) || null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.showroomId = token.showroomId;
        session.user.nom = token.nom;
        session.user.prenom = token.prenom;
        session.user.moduleAccessOverrides = (token.moduleAccessOverrides as Record<string, boolean>) || null;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
