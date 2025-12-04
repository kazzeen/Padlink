import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { Adapter } from "next-auth/adapters";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "consent",
          access_type: "offline",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        isGuest: { label: "Guest", type: "text" }, // Flag for guest login
      },
      async authorize(credentials) {
        if (!credentials) return null;

        // Handle Guest Login
        if (credentials.isGuest === "true") {
          // Create a temporary guest account
          // For better UX, we might want to clean these up periodically or reuse a generic one
          // But creating a new one ensures isolation.
          const guestId = uuidv4().slice(0, 8);
          const guestEmail = `guest-${guestId}@padlink.local`;
          const guestPassword = await bcrypt.hash(`guest-${guestId}`, 10);

          try {
             const user = await prisma.user.create({
              data: {
                email: guestEmail,
                name: `Guest User ${guestId}`,
                password: guestPassword,
                role: "USER",
              },
            });
            return user;
          } catch (error) {
            console.error("Error creating guest user", error);
            return null;
          }
        }

        // Regular Email/Password Login
        if (!credentials.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          // await prisma.loginLog.create({
          //   data: {
          //     email: credentials.email,
          //     success: false,
          //     reason: "User not found",
          //   }
          // });
          return null;
        }

        // Check Lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          // await prisma.loginLog.create({
          //   data: {
          //     userId: user.id,
          //     email: user.email,
          //     success: false,
          //     reason: "Account locked",
          //   }
          // });
          throw new Error("Account is temporarily locked. Please try again later.");
        }

        if (!user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
          let lockoutUntil = null;
           
          if (newFailedAttempts >= 5) {
            lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
          }
           
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: newFailedAttempts,
              lockoutUntil: lockoutUntil
            }
          });

          await prisma.loginLog.create({
            data: {
              userId: user.id,
              success: false,
              ipAddress: "unknown",
              userAgent: "unknown",
            }
          });
           
          return null;
        }

        // Success - Reset security counters
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockoutUntil: null
          }
        });

        await prisma.loginLog.create({
          data: {
            userId: user.id,
            success: true,
            ipAddress: "unknown",
            userAgent: "unknown",
          }
        });

        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    signIn: async ({ account }) => {
      try {
        if (account?.provider === "google" && account.id_token) {
          const res = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${account.id_token}`
          );
          if (!res.ok) return false;
          const data = await res.json();
          const aud = data.aud as string | undefined;
          if (!aud || aud !== (process.env.GOOGLE_CLIENT_ID || "")) {
            return false;
          }
        }
        return true;
      } catch {
        return false;
      }
    },
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (account?.provider === "google") {
        token.provider = "google";
        if (account.id_token) token.id_token = account.id_token;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      if ("provider" in token) {
        (session as { provider?: unknown } & typeof session).provider = token.provider;
      }
      return session;
    },
  },
  events: {},
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
