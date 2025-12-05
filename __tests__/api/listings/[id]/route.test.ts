/**
 * @jest-environment node
 */
import { GET, PUT, DELETE } from "@/app/api/listings/[id]/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest } from "next/server";

// Mock session
jest.mock("@/lib/session", () => ({
  getSession: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe("/api/listings/[id]", () => {
  const mockListing = {
    id: "1",
    title: "Test Listing",
    userId: "user1",
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

  describe("GET", () => {
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

    it("returns 404 for invalid ID", async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/listings/999");
      const params = Promise.resolve({ id: "999" });
      const res = await GET(req, { params });

      expect(res.status).toBe(404);
    });
  });

  describe("PUT", () => {
    const updateData = {
      title: "Updated Title",
      propertyType: "Apartment",
      roomType: "private",
      bedrooms: 2,
      bathrooms: 1,
      rentAmount: 1200,
      moveInDate: "2023-01-01",
      leaseTerm: 12,
      address: "123 St",
      city: "City",
      state: "ST",
      zipCode: "12345",
    };

    it("updates listing if owner", async () => {
      (getSession as jest.Mock).mockResolvedValue({ user: { id: "user1", role: "USER" } });
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);
      (prisma.listing.update as jest.Mock).mockResolvedValue({ ...mockListing, title: "Updated Title" });

      const req = new NextRequest("http://localhost:3000/api/listings/1", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: "1" });
      const res = await PUT(req, { params });

      expect(res.status).toBe(200);
      expect(prisma.listing.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it("returns 403 if not owner", async () => {
      (getSession as jest.Mock).mockResolvedValue({ user: { id: "user2", role: "USER" } });
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);

      const req = new NextRequest("http://localhost:3000/api/listings/1", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: "1" });
      const res = await PUT(req, { params });

      expect(res.status).toBe(403);
      expect(prisma.listing.update).not.toHaveBeenCalled();
    });

    it("returns 401 if not authenticated", async () => {
      (getSession as jest.Mock).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/listings/1", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      const params = Promise.resolve({ id: "1" });
      const res = await PUT(req, { params });

      expect(res.status).toBe(401);
    });
  });

  describe("DELETE", () => {
    it("deletes listing if owner", async () => {
      (getSession as jest.Mock).mockResolvedValue({ user: { id: "user1", role: "USER" } });
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);

      const req = new NextRequest("http://localhost:3000/api/listings/1", { method: "DELETE" });
      const params = Promise.resolve({ id: "1" });
      const res = await DELETE(req, { params });

      expect(res.status).toBe(200);
      expect(prisma.listing.delete).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it("returns 403 if not owner", async () => {
      (getSession as jest.Mock).mockResolvedValue({ user: { id: "user2", role: "USER" } });
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);

      const req = new NextRequest("http://localhost:3000/api/listings/1", { method: "DELETE" });
      const params = Promise.resolve({ id: "1" });
      const res = await DELETE(req, { params });

      expect(res.status).toBe(403);
      expect(prisma.listing.delete).not.toHaveBeenCalled();
    });
  });
});
