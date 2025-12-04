import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfileForm from "@/components/Forms/ProfileForm";

jest.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({
    data: { user: { id: "u1", name: "Test User", email: "test@example.com" } },
    status: "authenticated",
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe("ProfileForm input and submission", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (typeof url === "string" && url.includes("/api/users/profile") && (!init || init.method === "GET")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ name: "", preferences: null }),
        }) as unknown as Promise<Response>;
      }
      if (typeof url === "string" && url.includes("/api/users/profile") && init?.method === "PUT") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        }) as unknown as Promise<Response>;
      }
      return Promise.resolve({ ok: false, json: async () => ({}) }) as unknown as Promise<Response>;
    });
  });

  it("allows typing into text inputs and saving", async () => {
    render(<ProfileForm />);

    // Wait for initial profile fetch to complete
    await waitFor(() => expect(screen.queryByText(/Loading profile/i)).toBeNull());

    const nameInput = screen.getByPlaceholderText("Your name");
    fireEvent.change(nameInput, { target: { value: "Alice" } });
    expect((nameInput as HTMLInputElement).value).toBe("Alice");

    const bioTextarea = screen.getByPlaceholderText("Tell us about yourself");
    fireEvent.change(bioTextarea, { target: { value: "Hello there" } });
    expect((bioTextarea as HTMLTextAreaElement).value).toBe("Hello there");

    const citiesInput = screen.getByPlaceholderText("New York, Boston, Austin");
    fireEvent.change(citiesInput, { target: { value: "NYC" } });
    expect((citiesInput as HTMLInputElement).value).toBe("NYC");

    const saveButton = screen.getByRole("button", { name: /save profile/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(calls.some(([url, init]) => typeof url === "string" && url.includes("/api/users/profile") && (init as RequestInit)?.method === "PUT")).toBe(true);
    });
  });

  it("shows validation errors when submitting invalid data", async () => {
    render(<ProfileForm />);

    await waitFor(() => expect(screen.queryByText(/Loading profile/i)).toBeNull());

    // Name is "Test User" (valid) from mock.
    // Preferred Cities is empty (invalid).

    const saveButton = screen.getByRole("button", { name: /save profile/i });
    fireEvent.click(saveButton);

    // Expect validation error message for cities
    expect(await screen.findByText(/Please enter at least one city/i)).toBeInTheDocument();

    // Expect NO API call
    const calls = (global.fetch as jest.Mock).mock.calls;
    // Filter for PUT calls
    const putCalls = calls.filter(([url, init]) => 
      typeof url === "string" && url.includes("/api/users/profile") && (init as RequestInit)?.method === "PUT"
    );
    expect(putCalls.length).toBe(0);
  });
});
