import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { Adapter } from "next-auth/adapters";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
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
          await prisma.loginLog.create({
            data: {
              email: credentials.email,
              success: false,
              reason: "User not found",
            }
          });
          return null;
        }

        // Check Lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          await prisma.loginLog.create({
            data: {
              userId: user.id,
              email: user.email,
              success: false,
              reason: "Account locked",
            }
          });
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
              email: user.email,
              success: false,
              reason: "Invalid password",
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
            email: user.email,
            success: true,
            reason: "Login successful",
          }
        });

        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
