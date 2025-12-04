import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ListingDetailsPage from "@/app/(dashboard)/listings/[id]/page";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock swr
jest.mock("swr", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock image
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: ({ fill, priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt || ""} />
  ),
}));

describe("ListingDetailsPage", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue({ id: "1" });
  });

  it("renders loading state", () => {
    (useSWR as jest.Mock).mockReturnValue({
      isLoading: true,
    });

    render(<ListingDetailsPage />);
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders not found state", () => {
    (useSWR as jest.Mock).mockReturnValue({
      error: { status: 404 },
      isLoading: false,
    });

    render(<ListingDetailsPage />);
    expect(screen.getByText("Listing Not Found")).toBeInTheDocument();
    expect(screen.getByText("The property you are looking for might have been removed or is temporarily unavailable.")).toBeInTheDocument();
  });

  it("renders generic error state", () => {
    (useSWR as jest.Mock).mockReturnValue({
      error: { status: 500, message: "Server Error" },
      isLoading: false,
    });

    render(<ListingDetailsPage />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("We couldn't load the listing details. Please try again later.")).toBeInTheDocument();
  });

  it("renders listing details", () => {
    const mockListing = {
      id: "1",
      title: "Beautiful Apartment",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      rentAmount: 2000,
      roomType: "private",
      bedrooms: 2,
      bathrooms: 1,
      sqft: 800,
      maxOccupants: 2,
      description: "A lovely place",
      amenities: ["Wifi", "Parking"],
      images: ["/img1.jpg"],
      moveInDate: "2025-01-01",
      leaseTerm: 12,
      userId: "user1",
      user: {
        id: "user1",
        name: "Host User",
        image: "/host.jpg",
        createdAt: "2024-01-01",
      },
    };

    (useSWR as jest.Mock).mockReturnValue({
      data: mockListing,
      isLoading: false,
    });

    render(<ListingDetailsPage />);
    
    expect(screen.getByText("Beautiful Apartment")).toBeInTheDocument();
    expect(screen.getByText("$2000/mo")).toBeInTheDocument();
    expect(screen.getByText("Wifi")).toBeInTheDocument();
    expect(screen.getByText("Host User")).toBeInTheDocument();
  });

  it("navigates back when back button is clicked", () => {
    (useSWR as jest.Mock).mockReturnValue({
      data: { title: "Test", images: [], user: {} }, // Minimal mock
      isLoading: false,
    });

    render(<ListingDetailsPage />);
    fireEvent.click(screen.getByText("← Back"));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
