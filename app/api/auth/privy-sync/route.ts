import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrivyClient } from "@privy-io/server-auth";
import { SignJWT } from "jose";

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";
const key = new TextEncoder().encode(SECRET_KEY);

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token
    const verifiedClaims = await privy.verifyAuthToken(token);
    const privyUserId = verifiedClaims.userId;

    // Fetch user details from Privy to get profile info
    const privyUser = await privy.getUser(privyUserId);

    // Determine email (Privy user might have multiple linked accounts)
    // Prefer verified email; if absent, synthesize a local email
    const email = privyUser.email?.address || `privy-${privyUserId}@padlink.local`;
    
    console.log(`[PrivySync] Syncing user: ${privyUserId}, Email: ${email}`);

    // Find or Create User
    // Strategy:
    // 1. Try to find by privyId (Most reliable)
    // 2. If not found, try to find by email (Legacy/Account Linking)
    // 3. If found by email but no privyId, update user with privyId
    // 4. If not found by either, create new user
    
    let user = await prisma.user.findUnique({
      where: { privyId: privyUserId },
    });

    if (!user) {
      // Not found by privyId, try email
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        // Link account: Update existing user with privyId
        user = await prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: { privyId: privyUserId },
        });
      } else {
        // Create new user
        // Attempt to get a name from connected accounts
        const name = privyUser.google?.name || 
                     (email ? email.split("@")[0] : "New User");
                     
        const avatar = null;

        try {
          user = await prisma.user.create({
            data: {
              email,
              privyId: privyUserId,
              name,
              avatar,
              role: "USER",
            },
          });
        } catch (dbError) {
          console.error("Database error creating user:", dbError);
          // Double check for race condition
          const existing = await prisma.user.findUnique({ where: { email } });
          if (existing) {
            user = existing;
             // Try to update privyId if it was missing (race condition edge case)
             if (!user.privyId) {
               await prisma.user.update({
                 where: { id: user.id },
                 data: { privyId: privyUserId }
               }).catch(() => {}); // Ignore error if update fails
             }
          } else {
            throw dbError;
          }
        }
      }
    }

    // Generate JWT for padlink_session
    const tokenPayload = {
      sub: user.id,
      userId: user.id, // For backward compatibility if needed
      email: user.email,
      role: user.role,
      name: user.name,
      image: user.avatar,
    };

    const jwt = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(key);

    const response = NextResponse.json(user);
    response.cookies.set("padlink_session", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: unknown) {
    console.error("Error syncing Privy user:", error);
    try {
      const verifiedClaims = await privy.verifyAuthToken(token);
      const privyUserId = verifiedClaims.userId;
      const privyUser = await privy.getUser(privyUserId);
      const email = privyUser.email?.address || `privy-${privyUserId}@padlink.local`;
      const name = privyUser.google?.name || (email ? email.split("@")[0] : "New User");
      const image = privyUser.google?.picture || null;

      const payload = {
        sub: `privy:${privyUserId}`,
        userId: `privy:${privyUserId}`,
        email,
        role: "USER",
        name,
        image,
      };

      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(key);

      const response = NextResponse.json({ id: payload.userId, email: payload.email, name: payload.name, avatar: payload.image, role: payload.role });
      response.cookies.set("padlink_session", jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      console.warn("Privy sync fallback: set session without DB");
      return response;
    } catch (fallbackError) {
      console.error("Privy sync fallback failed:", fallbackError);
      return NextResponse.json({ 
        error: "Internal Server Error", 
        details: fallbackError instanceof Error ? fallbackError.message : "Unknown error" 
      }, { status: 500 });
    }
  }
}
