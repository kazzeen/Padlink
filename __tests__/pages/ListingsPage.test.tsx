import { render, screen, fireEvent } from "@testing-library/react";
import ListingsPage from "@/app/(dashboard)/listings/page";
import { useSession } from "next-auth/react";
import useSWR from "swr";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => "/listings",
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock swr
jest.mock("swr", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock components
jest.mock("@/components/listings/ListingCard", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ listing }: any) => <div data-testid="listing-card">{listing.title}</div>,
}));

jest.mock("@/components/listings/AddListingModal", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="add-listing-modal"><button onClick={onClose}>Close</button></div> : null,
}));

describe("ListingsPage", () => {
  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: "user1", name: "Test User" } },
      status: "authenticated",
    });
  });

  it("renders loading state initially", () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    render(<ListingsPage />);
    // Check for loading skeletons (pulse animation divs)
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders listings when data is loaded", () => {
    const mockListings = [
      { id: "1", title: "Listing 1" },
      { id: "2", title: "Listing 2" },
    ];

    (useSWR as jest.Mock).mockReturnValue({
      data: { listings: mockListings, pagination: { totalPages: 1 } },
      error: undefined,
      isLoading: false,
    });

    render(<ListingsPage />);
    expect(screen.getAllByTestId("listing-card")).toHaveLength(2);
    expect(screen.getByText("Listing 1")).toBeInTheDocument();
    expect(screen.getByText("Listing 2")).toBeInTheDocument();
  });

  it("renders empty state when no listings found", () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: { listings: [], pagination: { totalPages: 1 } },
      error: undefined,
      isLoading: false,
    });

    render(<ListingsPage />);
    expect(screen.getByText("No listings found")).toBeInTheDocument();
  });

  it("opens add listing modal when button is clicked", () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: { listings: [], pagination: { totalPages: 1 } },
      error: undefined,
      isLoading: false,
    });

    render(<ListingsPage />);
    const addButton = screen.getByText("+ Post a Listing");
    fireEvent.click(addButton);
    expect(screen.getByTestId("add-listing-modal")).toBeInTheDocument();
  });

  it("updates filters when inputs change", async () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: { listings: [], pagination: { totalPages: 1 } },
      error: undefined,
      isLoading: false,
    });

    render(<ListingsPage />);
    const cityInput = screen.getByPlaceholderText("Search by city...");
    fireEvent.change(cityInput, { target: { value: "New York" } });
    
    expect(cityInput).toHaveValue("New York");
    // Debounce prevents immediate SWR update check, but state is updated
  });

  it("updates sort order when sort dropdown changes", () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: { listings: [], pagination: { totalPages: 1 } },
      error: undefined,
      isLoading: false,
    });

    render(<ListingsPage />);
    // We need to find the select. Since we didn't add a label with "for" attribute or aria-label in the component yet (we used a label above it), we can try to find by display value or class.
    // Better approach: Update the component to have an aria-label or id, but for now let's look for the select by one of its options.
    const sortSelect = screen.getByDisplayValue("Newest");
    fireEvent.change(sortSelect, { target: { value: "price_asc" } });
    expect(sortSelect).toHaveValue("price_asc");
  });
});
