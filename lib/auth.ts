import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // No PrismaAdapter — we use JWT strategy and handle user creation manually
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) {
          throw new Error("User not found");
        }
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }
        return user;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/auth",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // For OAuth providers (Google, GitHub) — upsert user into DB manually
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const existing = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!existing) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name ?? null,
                emailVerified: new Date(),
                // no password — OAuth user
              },
            });
          } else if (!existing.name && user.name) {
            // backfill name if missing
            await prisma.user.update({
              where: { email: user.email },
              data: { name: user.name },
            });
          }
        } catch (err) {
          console.error("OAuth user upsert failed:", err);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, profile }) {
      if (user) {
        // On sign in, fetch the DB user to get the real id
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.sub = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = (user as any).image ?? null;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
};