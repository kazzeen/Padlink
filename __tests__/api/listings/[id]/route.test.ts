/**
 * @jest-environment node
 */
import { GET } from "@/app/api/listings/[id]/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Mock session to avoid auth adapter issues
jest.mock("@/lib/session", () => ({
  getSession: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      findUnique: jest.fn(),
    },
  },
}));

describe("GET /api/listings/[id]", () => {
  const mockListing = {
    id: "1",
    title: "Test Listing",
    amenities: JSON.stringify(["Wifi"]),
    images: JSON.stringify(["/img.jpg"]),
    user: {
      id: "user1",
      name: "Host",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns listing data for valid ID", async () => {
    (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);

    const req = new NextRequest("http://localhost:3000/api/listings/1");
    const params = Promise.resolve({ id: "1" });
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("Test Listing");
    expect(data.amenities).toEqual(["Wifi"]);
  });

  it("returns 404 and logs warning for invalid ID", async () => {
    (prisma.listing.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/listings/999");
    const params = Promise.resolve({ id: "999" });
    const res = await GET(req, { params });

    expect(res.status).toBe(404);
    expect(console.warn).toHaveBeenCalledWith("Listing not found for ID: 999");
  });

  it("returns 500 and logs error for DB failure", async () => {
    (prisma.listing.findUnique as jest.Mock).mockRejectedValue(new Error("DB Error"));

    const req = new NextRequest("http://localhost:3000/api/listings/1");
    const params = Promise.resolve({ id: "1" });
    const res = await GET(req, { params });

    expect(res.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith(
      "Listing GET error for ID 1:",
      expect.any(Error)
    );
  });
});
