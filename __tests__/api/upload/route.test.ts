/**
 * @jest-environment node
 */
import { POST } from "@/app/api/upload/route";
import { NextRequest } from "next/server";
import { mkdir } from "fs/promises"; // Re-added for mock reference check

// Mock session
jest.mock("@/lib/session", () => ({
  getSession: jest.fn(() => Promise.resolve({ user: { id: "user1" } })),
}));

// Mock fs
jest.mock("fs/promises", () => ({
  writeFile: jest.fn(),
  mkdir: jest.fn(),
}));

// Mock uuid
jest.mock("uuid", () => ({
  v4: () => "test-uuid",
}));

describe("POST /api/upload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uploads profile image by default to users/profiles", async () => {
    const formData = new FormData();
    const file = new File(["test"], "test.png", { type: "image/png" });
    formData.append("file", file);
    // No type appended, defaults to profile

    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.url).toBe("/uploads/users/profiles/test-uuid.png");
    
    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining("users\\profiles"), { recursive: true });
    // Note: path separator depends on OS, but stringContaining helps. 
    // On Windows it's backslash.
  });

  it("uploads property image to properties directory", async () => {
    const formData = new FormData();
    const file = new File(["test"], "house.jpg", { type: "image/jpeg" });
    formData.append("file", file);
    formData.append("type", "property");

    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.url).toBe("/uploads/properties/test-uuid.jpg");
    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining("properties"), { recursive: true });
  });

  it("rejects invalid file type", async () => {
    const formData = new FormData();
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    formData.append("file", file);

    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects invalid upload type", async () => {
    const formData = new FormData();
    const file = new File(["test"], "test.png", { type: "image/png" });
    formData.append("file", file);
    formData.append("type", "invalid-type");

    const req = new NextRequest("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
