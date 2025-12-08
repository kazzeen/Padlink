import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { Adapter } from "next-auth/adapters";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

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
    signIn: async () => {
      console.log("NextAuth.callbacks.signIn");
      return true;
    },
    jwt: async ({ token, user }) => {
      console.log("NextAuth.callbacks.jwt", { hasUser: Boolean(user) });
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      console.log("NextAuth.callbacks.session", { userId: token.id, role: token.role });
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
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
