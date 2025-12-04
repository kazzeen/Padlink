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
        }) as any;
      }
      if (typeof url === "string" && url.includes("/api/users/profile") && init?.method === "PUT") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        }) as any;
      }
      return Promise.resolve({ ok: false, json: async () => ({}) }) as any;
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
});
