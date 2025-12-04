
import { PUT } from "@/app/api/users/profile/route";
import { prisma } from "@/lib/prisma";


class MockHeaders {
  private map = new Map<string, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(init?: any) {
    if (init) {
      Object.keys(init).forEach(key => this.map.set(key.toLowerCase(), init[key]));
    }
  }
  get(key: string) { return this.map.get(key.toLowerCase()) || null; }
  set(key: string, value: string) { this.map.set(key.toLowerCase(), value); }
  has(key: string) { return this.map.has(key.toLowerCase()); }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forEach(callback: any) { this.map.forEach((v, k) => callback(v, k, this)); }
}

// Mock Next.js server components
jest.mock("next/server", () => {
  return {
    NextResponse: {
      json: jest.fn((body, init) => ({
        json: async () => body,
        status: init?.status || 200,
        headers: new MockHeaders(init?.headers),
      })),
    },
    NextRequest: jest.fn().mockImplementation((url, init) => ({
      url,
      method: init?.method || "GET",
      json: async () => JSON.parse(init?.body || "{}"),
      headers: new MockHeaders(init?.headers),
    })),
  };
});

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock Session
jest.mock("@/lib/session", () => ({
  getSession: jest.fn(() => Promise.resolve({ user: { id: "user-123" } })),
}));

import { NextRequest } from "next/server";

describe("Profile API PUT", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update profile preferences correctly", async () => {
    const payload = {
      name: "Test User",
      bio: "Test Bio",
      age: 25,
      avatar: "http://example.com/avatar.jpg",
      preferences: {
        minBudget: 1000,
        maxBudget: 2000,
        preferredCities: ["New York", "Boston"],
        commutDistance: 20,
        sleepSchedule: "night_owl",
        cleanlinesLevel: 4,
        socialPreference: "introvert",
        smokingStatus: "non_smoker",
      },
    };

    // Create a mock request using the mocked NextRequest class
    const req = new NextRequest("http://localhost/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: "user-123",
      ...payload,
      preferences: {
          ...payload.preferences,
          // The API returns the Prisma object, which usually has the stringified version
          // but for this test we can just return what we expect the API to transform it back to?
          // Actually the API returns `updatedUser` which comes from Prisma.
          // Prisma stores it as string.
          // But `NextResponse.json(updatedUser)` will just return that object.
          // Wait, the API does NOT transform it back to array in the response.
          // The frontend `fetchProfile` does `JSON.parse`?
          // Let's check the GET route. It returns `user`.
          // If `preferredCities` is stored as string, the frontend receives a string.
          // The frontend `ProfileForm` handles parsing?
          // Let's check ProfileForm.tsx again.
          preferredCities: '["New York","Boston"]', 
      }
    });

    const response = await PUT(req);
    await response.json(); // Consume json to ensure it works

    expect(response.status).toBe(200);
    
    // Verify Prisma update call
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-123" },
      data: expect.objectContaining({
        name: "Test User",
        preferences: expect.objectContaining({
          upsert: expect.objectContaining({
            create: expect.objectContaining({
              sleepSchedule: "night_owl",
              preferredCities: '["New York","Boston"]',
            }),
            update: expect.objectContaining({
              sleepSchedule: "night_owl",
              preferredCities: '["New York","Boston"]',
            }),
          }),
        }),
      }),
      include: { preferences: true },
    });
  });
});
