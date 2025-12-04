import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";
const key = new TextEncoder().encode(SECRET_KEY);

export interface SessionUser {
  id: string;
  role: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export interface Session {
  user: SessionUser;
}

export async function getSession(): Promise<Session | null> {
  // 1. Try Legacy NextAuth
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession) {
    // Ensure id and role are present (NextAuth session callback adds them)
    return nextAuthSession as unknown as Session;
  }

  // 2. Try Custom Privy-Sync Cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("padlink_session")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key);
    
    return {
      user: {
        id: (payload.sub as string) || (payload.userId as string),
        role: payload.role as string,
        email: payload.email as string,
        name: payload.name as string,
        image: payload.image as string
      }
    };
  } catch (error) {
    // Token invalid or expired
    return null;
  }
}
