import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  /** Must match `proxy.ts` getToken({ secret }) so sessions verify after sign-in. */
  secret: authSecret,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const emailRaw = credentials?.email;
          const password = credentials?.password;
          if (typeof emailRaw !== "string" || typeof password !== "string") {
            return null;
          }
          const email = emailRaw.trim().toLowerCase();
          if (!email) return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;
          const valid = await compare(password, user.passwordHash);
          if (!valid) return null;
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            role: user.role,
          };
        } catch (e) {
          console.error("[auth] credentials authorize error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role: Role }).role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
