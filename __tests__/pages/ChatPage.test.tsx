import { render, screen, fireEvent, act } from "@testing-library/react";
import ChatPage from "@/app/(dashboard)/messages/[userId]/page";
import "@testing-library/jest-dom";

// Mock useRouter
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

// Mock useAuth
jest.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({
    data: { user: { id: "me" } },
  }),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

// Mock React.use
jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    use: (promise: Promise<unknown>) => {
      if (promise instanceof Promise) {
        // Very basic unwrap for test purposes if needed, 
        // but usually we can just return the value if we mock the prop directly as a value 
        // or simple object. However, since it's a Promise in component signature:
        return { userId: "user1" }; 
      }
      return promise;
    },
  };
});


describe("ChatPage Back Button", () => {
  const originalHistoryLength = window.history.length;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset history length mock (it's read-only usually, so we might need Object.defineProperty)
    Object.defineProperty(window.history, 'length', {
      value: originalHistoryLength,
      writable: true,
    });
  });

  it("renders back button with correct accessibility attributes", async () => {
    await act(async () => {
      render(<ChatPage params={Promise.resolve({ userId: "user1" })} />);
    });

    const backButton = screen.getByLabelText("Go back to previous page");
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveTextContent("←");
  });

  it("calls router.back() when history exists", async () => {
    Object.defineProperty(window.history, 'length', { value: 5, writable: true });
    
    await act(async () => {
      render(<ChatPage params={Promise.resolve({ userId: "user1" })} />);
    });

    const backButton = screen.getByLabelText("Go back to previous page");
    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("calls router.push('/messages') when no history exists (fallback)", async () => {
    Object.defineProperty(window.history, 'length', { value: 1, writable: true });

    await act(async () => {
      render(<ChatPage params={Promise.resolve({ userId: "user1" })} />);
    });

    const backButton = screen.getByLabelText("Go back to previous page");
    fireEvent.click(backButton);

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/messages");
  });
});
