import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ProfileForm from "@/components/Forms/ProfileForm";
import { useAuth } from "@/lib/hooks/useAuth";

// Mock hooks
jest.mock("@/lib/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock Image component to avoid Next.js Image issues
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:http://localhost:3000/test-blob");
global.URL.revokeObjectURL = jest.fn();

describe("ProfileForm Image Upload Workflow", () => {
  const mockSession = {
    user: {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ data: mockSession, status: "authenticated" });
    
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    
    // Mock successful profile fetch
    (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === "/api/users/profile") {
            return Promise.resolve({
                ok: true,
                json: async () => ({
                    name: "Test User",
                    bio: "Old Bio",
                    avatar: null, // No avatar initially
                    preferences: {
                        preferredCities: '["Old City"]',
                        minBudget: 500,
                        maxBudget: 1500,
                        commutDistance: 10,
                        sleepSchedule: "flexible",
                        cleanlinesLevel: 3,
                        socialPreference: "ambivert",
                        smokingStatus: "non_smoker",
                    }
                }),
            });
        }
        if (url === "/api/upload") {
            return Promise.resolve({
                ok: true,
                json: async () => ({ url: "/uploads/new-avatar.png" }),
            });
        }
        // Default for update
        return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
        });
    });
  });

  it("should handle image upload and submit correct relative path", async () => {
    render(<ProfileForm />);

    // Wait for initial fetch
    await waitFor(() => {
        expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    });

    // Simulate file upload
    // Find the file input (it's hidden in ImageUpload)
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    const file = new File(["(⌐□_□)"], "avatar.png", { type: "image/png" });
    
    // Mock image loading for dimensions check in ImageUpload
    // This is tricky because ImageUpload creates a new Image()
    // We can skip the dimension check if we mock the Image constructor or just assume it works
    // But ImageUpload logic waits for onload.
    // Let's try to trigger the change event directly.
    
    // We need to mock window.Image to trigger onload immediately
    const originalImage = window.Image;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.Image = class {
        onload: () => void = () => {};
        width = 200;
        height = 200;
        src = "";
        constructor() {
            setTimeout(() => this.onload(), 10); // Async trigger
        }
    };

    await act(async () => {
        fireEvent.change(fileInput!, { target: { files: [file] } });
    });

    // Wait for upload to complete and avatar to be set
    // ImageUpload calls onUploadComplete which calls setValue("avatar", url)
    // And sets local preview.
    
    // Verify fetch was called for upload
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/upload", expect.anything());
    });

    // Now submit the form
    const saveButton = screen.getByRole("button", { name: /Save Profile/i });
    await act(async () => {
        fireEvent.click(saveButton);
    });

    // Verify profile update payload contains the relative path
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/users/profile", expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining('"avatar":"/uploads/new-avatar.png"'),
        }));
    });

    // Restore Image
    window.Image = originalImage;
  });

  it("should load existing avatar from profile", async () => {
      // Override fetch for this test
      (global.fetch as jest.Mock).mockImplementation((url) => {
          if (url === "/api/users/profile") {
              return Promise.resolve({
                  ok: true,
                  json: async () => ({
                      name: "Test User",
                      bio: "Old Bio",
                      avatar: "/uploads/existing.png", // Existing avatar
                      preferences: {
                          preferredCities: '["Old City"]',
                          minBudget: 500,
                          maxBudget: 1500,
                          commutDistance: 10,
                          sleepSchedule: "flexible",
                          cleanlinesLevel: 3,
                          socialPreference: "ambivert",
                          smokingStatus: "non_smoker",
                      }
                  }),
              });
          }
          return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      render(<ProfileForm />);

      // Wait for initial fetch
      await waitFor(() => {
          expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
      });

      // Check if avatar input has the value
      // Hidden input
      const hiddenInput = document.querySelector('input[name="avatar"]');
      expect(hiddenInput).toHaveValue("/uploads/existing.png");
      
      // Also check if ImageUpload shows it (it uses src)
      const img = screen.getByAltText("Profile Preview");
      expect(img).toHaveAttribute("src", "/uploads/existing.png");
  });
});
