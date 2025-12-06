/**
 * @jest-environment node
 */
import { POST } from "@/app/api/proposals/route";
import { PUT, GET } from "@/app/api/proposals/[id]/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest } from "next/server";

// Mock session
jest.mock("@/lib/session", () => ({
  getSession: jest.fn(),
}));

// Mock notifications
jest.mock("@/lib/notifications", () => ({
  createNotification: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    listing: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    proposal: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      proposal: { create: jest.fn(), update: jest.fn() },
      message: { create: jest.fn() },
      auditLog: { create: jest.fn() },
    })),
  },
}));

describe("Proposal API", () => {
  const mockUser = { id: "sender1", name: "Sender", role: "USER" };
  const mockReceiver = { id: "receiver1", name: "Receiver" };
  const mockListing = { id: "listing1", userId: "sender1", isActive: true, title: "Test Listing" };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSession as jest.Mock).mockResolvedValue({ user: mockUser });
  });

  describe("POST /api/proposals", () => {
    const validBody = {
      receiverId: "receiver1",
      listingId: "listing1",
      rentAmount: 1000,
      moveInDate: "2023-01-01",
      leaseTerm: 12,
      message: "Hello",
    };

    it("creates a proposal successfully", async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue(mockListing);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockReceiver);
      (prisma.proposal.findFirst as jest.Mock).mockResolvedValue(null); // No existing proposal

      // Mock transaction result
      const mockCreatedProposal = { id: "prop1", ...validBody, status: "PENDING" };
      // @ts-expect-error Mocking transaction
      prisma.$transaction.mockImplementation(async (cb) => {
        return cb({
          proposal: { create: jest.fn().mockResolvedValue(mockCreatedProposal) },
          message: { create: jest.fn() },
          auditLog: { create: jest.fn() },
        });
      });

      const req = new NextRequest("http://localhost:3000/api/proposals", {
        method: "POST",
        body: JSON.stringify(validBody),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBe("prop1");
    });

    it("fails if listing not owned by user", async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue({ ...mockListing, userId: "other" });

      const req = new NextRequest("http://localhost:3000/api/proposals", {
        method: "POST",
        body: JSON.stringify(validBody),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("fails if listing is inactive", async () => {
      (prisma.listing.findUnique as jest.Mock).mockResolvedValue({ ...mockListing, isActive: false });

      const req = new NextRequest("http://localhost:3000/api/proposals", {
        method: "POST",
        body: JSON.stringify(validBody),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/proposals/[id]", () => {
    const mockProposal = {
      id: "prop1",
      senderId: "sender1",
      receiverId: "receiver1",
      status: "PENDING",
      expiresAt: new Date(Date.now() + 100000),
      listing: { title: "Test Listing" },
    };

    it("accepts a proposal as receiver", async () => {
      (getSession as jest.Mock).mockResolvedValue({ user: { id: "receiver1", name: "Receiver" } });
      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(mockProposal);

      const mockUpdatedProposal = { ...mockProposal, status: "ACCEPTED" };
      // @ts-expect-error Mocking transaction
      prisma.$transaction.mockImplementation(async (cb) => {
        return cb({
          proposal: { update: jest.fn().mockResolvedValue(mockUpdatedProposal) },
          message: { create: jest.fn() },
          auditLog: { create: jest.fn() },
        });
      });

      const req = new NextRequest("http://localhost:3000/api/proposals/prop1", {
        method: "PUT",
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      const params = Promise.resolve({ id: "prop1" });

      const res = await PUT(req, { params });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("ACCEPTED");
    });

    it("declines a proposal as receiver", async () => {
      (getSession as jest.Mock).mockResolvedValue({ user: { id: "receiver1", name: "Receiver" } });
      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(mockProposal);

      const mockUpdatedProposal = { ...mockProposal, status: "DECLINED" };
      // @ts-expect-error Mocking transaction
      prisma.$transaction.mockImplementation(async (cb) => {
        return cb({
          proposal: { update: jest.fn().mockResolvedValue(mockUpdatedProposal) },
          message: { create: jest.fn() },
          auditLog: { create: jest.fn() },
        });
      });

      const req = new NextRequest("http://localhost:3000/api/proposals/prop1", {
        method: "PUT",
        body: JSON.stringify({ action: "DECLINE" }),
      });
      const params = Promise.resolve({ id: "prop1" });

      const res = await PUT(req, { params });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("DECLINED");
    });

    it("cancels a proposal as sender", async () => {
      (getSession as jest.Mock).mockResolvedValue({ user: { id: "sender1", name: "Sender" } });
      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(mockProposal);

      const mockUpdatedProposal = { ...mockProposal, status: "CANCELLED" };
      // @ts-expect-error Mocking transaction
      prisma.$transaction.mockImplementation(async (cb) => {
        return cb({
          proposal: { update: jest.fn().mockResolvedValue(mockUpdatedProposal) },
          message: { create: jest.fn() },
          auditLog: { create: jest.fn() },
        });
      });

      const req = new NextRequest("http://localhost:3000/api/proposals/prop1", {
        method: "PUT",
        body: JSON.stringify({ action: "CANCEL" }),
      });
      const params = Promise.resolve({ id: "prop1" });

      const res = await PUT(req, { params });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("CANCELLED");
    });

    it("fails if unauthorized user tries to respond", async () => {
      (getSession as jest.Mock).mockResolvedValue({ user: { id: "randomUser" } });
      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue(mockProposal);

      const req = new NextRequest("http://localhost:3000/api/proposals/prop1", {
        method: "PUT",
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      const params = Promise.resolve({ id: "prop1" });

      const res = await PUT(req, { params });
      expect(res.status).toBe(403);
    });

    it("fails if proposal is expired", async () => {
      (getSession as jest.Mock).mockResolvedValue({ user: { id: "receiver1" } });
      (prisma.proposal.findUnique as jest.Mock).mockResolvedValue({
        ...mockProposal,
        expiresAt: new Date(Date.now() - 10000), // Expired
      });

      const req = new NextRequest("http://localhost:3000/api/proposals/prop1", {
        method: "PUT",
        body: JSON.stringify({ action: "ACCEPT" }),
      });
      const params = Promise.resolve({ id: "prop1" });

      const res = await PUT(req, { params });
      expect(res.status).toBe(400);
      // Should have tried to expire it
      expect(prisma.proposal.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "EXPIRED" } })
      );
    });
  });
});
