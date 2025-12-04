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

// Mock fetch
global.fetch = jest.fn();

describe("ProfileForm Submission", () => {
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
    
    // Mock console.error and console.log to verify logs
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    
    // Mock successful profile fetch
    (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
            name: "Test User",
            bio: "Old Bio",
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
  });

  it("should submit correct payload with array of cities when form is valid", async () => {
    render(<ProfileForm />);

    // Wait for initial fetch to complete
    await waitFor(() => {
        expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    });

    // Update form fields
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Updated Name" } });
    fireEvent.change(screen.getByLabelText(/Bio/i), { target: { value: "Updated Bio" } });
    
    // Update cities (comma separated string)
    const cityInput = screen.getByLabelText(/Preferred Cities/i);
    fireEvent.change(cityInput, { target: { value: "City A, City B" } });

    // Mock successful update response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
    });

    // Submit form
    const saveButton = screen.getByRole("button", { name: /Save Profile/i });
    await act(async () => {
        fireEvent.click(saveButton);
    });

    // Verify fetch was called with PUT
    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/users/profile", expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining('"preferredCities":["City A","City B"]'),
        }));
    });
    
    // Verify success message
    expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
  });

  it("should log validation errors when form is invalid", async () => {
    render(<ProfileForm />);

    // Wait for initial load
    await waitFor(() => {
        expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    });

    // Clear name (required)
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "" } });
    
    // Submit form
    const saveButton = screen.getByRole("button", { name: /Save Profile/i });
    await act(async () => {
        fireEvent.click(saveButton);
    });

    // Verify onError was called and logged errors
    await waitFor(() => {
        // The second argument is the errors object, which should contain the name error
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining("Validation Errors (Raw):"), 
            expect.objectContaining({
                name: expect.objectContaining({
                    message: expect.stringContaining("Name must be at least 2 characters")
                })
            })
        );
    });
  });
});
