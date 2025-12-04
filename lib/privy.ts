import { PrivyClient } from "@privy-io/server-auth";

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID || !process.env.PRIVY_APP_SECRET) {
  throw new Error("Missing Privy credentials");
}

export const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

export async function verifyPrivyToken(token: string) {
  try {
    const verifiedClaims = await privyClient.verifyAuthToken(token);
    return verifiedClaims;
  } catch (error) {
    console.error("Privy token verification failed:", error);
    return null;
  }
}