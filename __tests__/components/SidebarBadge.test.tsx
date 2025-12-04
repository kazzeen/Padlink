import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '@/components/Sidebar';

// Mock hooks
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

jest.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    data: { user: { role: 'USER' } },
    signOut: jest.fn(),
  }),
}));

jest.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

// Mock the notification count hook
const mockUseNotificationCount = jest.fn();
jest.mock('@/lib/hooks/useNotificationCount', () => ({
  useNotificationCount: () => mockUseNotificationCount(),
}));

describe('Sidebar Notification Badge', () => {
  beforeEach(() => {
    mockUseNotificationCount.mockReturnValue({ count: 0 });
  });

  it('does not render badge when count is 0', () => {
    render(<Sidebar />);
    const badge = screen.queryByLabelText(/unread notifications/);
    expect(badge).not.toBeInTheDocument();
  });

  it('renders badge with count when count > 0', () => {
    mockUseNotificationCount.mockReturnValue({ count: 5 });
    render(<Sidebar />);
    const badge = screen.getByLabelText('5 unread notifications');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
    expect(badge).toHaveClass('bg-[#ff0000]');
  });

  it('renders "99+" when count > 99', () => {
    mockUseNotificationCount.mockReturnValue({ count: 100 });
    render(<Sidebar />);
    const badge = screen.getByLabelText('100 unread notifications');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('99+');
  });
});
