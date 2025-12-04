/**
 * @jest-environment node
 */
import { GET } from "@/app/api/listings/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest } from "next/server";

jest.mock("@/lib/session", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("GET /api/listings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns active listings by default", async () => {
    (prisma.listing.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.listing.count as jest.Mock).mockResolvedValue(0);

    const req = new NextRequest("http://localhost:3000/api/listings");
    await GET(req);

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });

  it("filters by userId if provided", async () => {
    (prisma.listing.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.listing.count as jest.Mock).mockResolvedValue(0);

    const req = new NextRequest("http://localhost:3000/api/listings?userId=user123");
    await GET(req);

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user123", isActive: true }),
      })
    );
  });

  it("allows seeing inactive listings if user is owner", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: { id: "user123", role: "USER" },
    });
    (prisma.listing.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.listing.count as jest.Mock).mockResolvedValue(0);

    const req = new NextRequest("http://localhost:3000/api/listings?userId=user123&status=inactive");
    await GET(req);

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user123", isActive: false }),
      })
    );
  });

  it("allows seeing all listings (active/inactive) if user is owner", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: { id: "user123", role: "USER" },
    });
    (prisma.listing.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.listing.count as jest.Mock).mockResolvedValue(0);

    const req = new NextRequest("http://localhost:3000/api/listings?userId=user123&status=all");
    await GET(req);

    // When status is 'all', isActive should NOT be in where clause
    // However, checking that it's NOT there is tricky with expect.objectContaining.
    // We can check the specific call.
    const calls = (prisma.listing.findMany as jest.Mock).mock.calls;
    const where = calls[0][0].where;
    expect(where.userId).toBe("user123");
    expect(where.isActive).toBeUndefined();
  });

  it("forbids seeing inactive listings if not owner", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: { id: "otherUser", role: "USER" },
    });

    const req = new NextRequest("http://localhost:3000/api/listings?userId=user123&status=inactive");
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it("allows admin to see any inactive listings", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: { id: "adminUser", role: "ADMIN" },
    });
    (prisma.listing.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.listing.count as jest.Mock).mockResolvedValue(0);

    const req = new NextRequest("http://localhost:3000/api/listings?userId=user123&status=inactive");
    const res = await GET(req);

    expect(res.status).toBe(200);
  });
});
