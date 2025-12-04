import { render, screen } from "@testing-library/react";
import MessagesPage from "@/app/(dashboard)/messages/page";
import { useConversations } from "@/hooks/useConversations";

// Mock the hook
jest.mock("@/hooks/useConversations");

describe("MessagesPage", () => {
  const mockUseConversations = useConversations as jest.Mock;

  beforeEach(() => {
    mockUseConversations.mockClear();
  });

  it("renders loading state", () => {
    mockUseConversations.mockReturnValue({
      conversations: [],
      isLoading: true,
      isError: null,
    });

    render(<MessagesPage />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    mockUseConversations.mockReturnValue({
      conversations: [],
      isLoading: false,
      isError: null,
    });

    render(<MessagesPage />);
    expect(screen.getByText("No conversations yet.")).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return content.includes("Connect with roommates in the") && element?.tagName.toLowerCase() === 'p';
    })).toBeInTheDocument();
  });

  it("renders conversations with messages", () => {
    const mockConversations = [
      {
        user: { id: "1", name: "John Doe", image: "/john.jpg" },
        lastMessage: { content: "Hello", createdAt: new Date().toISOString() },
      },
    ];

    mockUseConversations.mockReturnValue({
      conversations: mockConversations,
      isLoading: false,
      isError: null,
    });

    render(<MessagesPage />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders new connections (no messages)", () => {
    const mockConversations = [
      {
        user: { id: "2", name: "Jane Smith", image: null },
        lastMessage: null,
      },
    ];

    mockUseConversations.mockReturnValue({
      conversations: mockConversations,
      isLoading: false,
      isError: null,
    });

    render(<MessagesPage />);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Start a conversation")).toBeInTheDocument();
    expect(screen.getByText("New Connection")).toBeInTheDocument();
  });
});
