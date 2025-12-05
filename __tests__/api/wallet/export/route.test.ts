/**
 * @jest-environment node
 */
import { POST } from "@/app/api/wallet/export/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("@privy-io/server-auth", () => ({
  PrivyClient: class {
    verifyAuthToken(token: string) {
      return Promise.resolve({ userId: "user-test" });
    }
  },
}));

describe("/api/wallet/export (no rate limit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 for multiple export initiations without rate limit", async () => {
    for (let i = 0; i < 10; i++) {
      const req = new NextRequest("http://localhost:3000/api/wallet/export", {
        method: "POST",
        headers: {
          authorization: "Bearer test-token",
        } as unknown as HeadersInit,
        body: JSON.stringify({ walletAddress: "solAddr123", chainType: "solana" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    }
    expect(prisma.auditLog.create).toHaveBeenCalled();
    expect(prisma.auditLog.count).not.toHaveBeenCalled();
  });
});
