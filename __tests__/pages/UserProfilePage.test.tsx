import { render, screen, waitFor, act } from "@testing-library/react";
import UserProfilePage from "@/app/(dashboard)/profile/[userId]/page";
import { Suspense } from "react";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

// Mock ConnectButton since it has its own logic
jest.mock("@/components/ConnectButton", () => {
  return function MockConnectButton() {
    return <button data-testid="connect-button">Connect</button>;
  };
});

global.fetch = jest.fn();

describe("UserProfilePage", () => {
  const mockParams = Promise.resolve({ userId: "123" });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders loading state initially", async () => {
    // Return a promise that never resolves to test loading state
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    await act(async () => {
        render(
            <Suspense fallback={<div>Suspended...</div>}>
                <UserProfilePage params={mockParams} />
            </Suspense>
        );
    });

    // Wait for the params to resolve and the component to render the loading spinner
    await waitFor(() => {
        const spinner = screen.getByTestId("loading-spinner");
        expect(spinner).toBeInTheDocument();
    });
  });

  it("renders user profile when data is fetched", async () => {
    const mockUser = {
      id: "123",
      name: "John Doe",
      age: 25,
      role: "ROOMMATE_SEEKER",
      bio: "Hello world",
      preferences: {
        minBudget: 500,
        maxBudget: 1000,
        cleanlinesLevel: 4,
      },
      isConnected: false,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    await act(async () => {
        render(
            <Suspense fallback={<div>Suspended...</div>}>
                <UserProfilePage params={mockParams} />
            </Suspense>
        );
    });

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("25 years old • Looking for a room")).toBeInTheDocument();
      expect(screen.getByText("Hello world")).toBeInTheDocument();
      expect(screen.getByText("$500 - $1000")).toBeInTheDocument();
    });
  });

  it("shows Message button when connected", async () => {
    const mockUser = {
      id: "123",
      name: "John Doe",
      isConnected: true,
      email: "john@example.com",
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockUser,
    });

    await act(async () => {
        render(
            <Suspense fallback={<div>Suspended...</div>}>
                <UserProfilePage params={mockParams} />
            </Suspense>
        );
    });

    await waitFor(() => {
      expect(screen.getByText("Message")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });
  });

  it("handles error state", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    await act(async () => {
        render(
            <Suspense fallback={<div>Suspended...</div>}>
                <UserProfilePage params={mockParams} />
            </Suspense>
        );
    });

    await waitFor(() => {
      expect(screen.getByText("Failed to load profile")).toBeInTheDocument();
    });
  });
});
