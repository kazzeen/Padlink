/**
 * @jest-environment node
 */
import { PUT } from "@/app/api/users/profile/route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextRequest } from "next/server";

jest.mock("@/lib/session", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe("PUT /api/users/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("updates profile with valid data", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: "user123",
      name: "Updated Name",
    });

    const body = {
      name: "Updated Name",
      preferences: {
        minBudget: 500,
        maxBudget: 1500,
        preferredCities: ["New York"],
        commutDistance: 20,
        sleepSchedule: "early_bird",
        cleanlinesLevel: 4,
        socialPreference: "introvert",
        smokingStatus: "non_smoker",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it("updates profile with null age", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });
    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: "user123",
      name: "Updated Name",
      age: null,
    });

    const body = {
      name: "Updated Name",
      age: null,
      preferences: {
        minBudget: 500,
        maxBudget: 1500,
        preferredCities: ["New York"],
        commutDistance: 20,
        sleepSchedule: "early_bird",
        cleanlinesLevel: 4,
        socialPreference: "introvert",
        smokingStatus: "non_smoker",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ age: null })
    }));
  });

  it("fails if cities array is empty", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });

    const body = {
      name: "Updated Name",
      preferences: {
        minBudget: 500,
        maxBudget: 1500,
        preferredCities: [], // Empty array
        commutDistance: 20,
        sleepSchedule: "early_bird",
        cleanlinesLevel: 4,
        socialPreference: "introvert",
        smokingStatus: "non_smoker",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400); // Should fail validation
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
  });

  it("fails if required numeric fields are missing or invalid", async () => {
    (getSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });

    const body = {
      name: "Updated Name",
      preferences: {
        minBudget: "not a number", // Invalid
        maxBudget: 1500,
        preferredCities: ["NYC"],
        commutDistance: 20,
        sleepSchedule: "early_bird",
        cleanlinesLevel: 4,
        socialPreference: "introvert",
        smokingStatus: "non_smoker",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});
