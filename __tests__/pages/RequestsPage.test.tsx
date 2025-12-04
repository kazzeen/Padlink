import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import RequestsPage from "@/app/(dashboard)/requests/page";
import "@testing-library/jest-dom";

// Mock useRouter
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

const mockReceivedRequests = [
  {
    id: "req1",
    senderId: "user1",
    receiverId: "me",
    status: "PENDING",
    message: "Hi there!",
    createdAt: new Date().toISOString(),
    sender: {
      id: "user1",
      name: "Alice",
      image: null,
      role: "USER",
    },
    receiver: {
      id: "me",
      name: "Me",
      image: null,
      role: "USER",
    },
  },
];

const mockSentRequests = [
  {
    id: "req2",
    senderId: "me",
    receiverId: "user2",
    status: "PENDING",
    message: "Hello!",
    createdAt: new Date().toISOString(),
    sender: {
      id: "me",
      name: "Me",
      image: null,
      role: "USER",
    },
    receiver: {
      id: "user2",
      name: "Bob",
      image: null,
      role: "USER",
    },
  },
];

describe("RequestsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn(); // Mock alert
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url.includes("type=received")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReceivedRequests),
        });
      }
      if (url.includes("type=sent")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSentRequests),
        });
      }
      if (options && options.method === "PUT") {
         return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it("renders requests and handles card click navigation", async () => {
    await act(async () => {
      render(<RequestsPage />);
    });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    // Click on the received request card
    const card = screen.getByTestId("request-card-user1");
    fireEvent.click(card);

    expect(mockPush).toHaveBeenCalledWith("/profile/user1");
  });

  it("does not navigate when clicking accept button", async () => {
    await act(async () => {
      render(<RequestsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Accept")).toBeInTheDocument();
    });

    const acceptButton = screen.getByText("Accept");
    fireEvent.click(acceptButton);

    // Should call fetch for update
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/requests/req1"),
      expect.objectContaining({ method: "PUT" })
    );

    // Should NOT navigate
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("handles keyboard navigation (Enter key)", async () => {
    await act(async () => {
      render(<RequestsPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("request-card-user1")).toBeInTheDocument();
    });

    const card = screen.getByTestId("request-card-user1");
    fireEvent.keyDown(card, { key: "Enter" });

    expect(mockPush).toHaveBeenCalledWith("/profile/user1");
  });

  it("uses event delegation for container clicks", async () => {
    await act(async () => {
      render(<RequestsPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("received-requests-grid")).toBeInTheDocument();
    });

    // Simulate click on the grid container but targeting the card
    const grid = screen.getByTestId("received-requests-grid");
    const card = screen.getByTestId("request-card-user1");
    
    // We need to simulate bubbling manually if we fire on grid? 
    // Actually, firing on card bubbles to grid where the handler is.
    fireEvent.click(card, { bubbles: true });

    expect(mockPush).toHaveBeenCalledWith("/profile/user1");
  });
});
