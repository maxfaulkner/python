// src/__tests__/components/Navbar.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../../components/Navbar';

// Mock the api module used by NotificationBell
vi.mock('../../api', () => ({
  api: {
    getNotifications: vi.fn().mockResolvedValue([]),
    markAllRead: vi.fn().mockResolvedValue({}),
    markOneRead: vi.fn().mockResolvedValue({}),
    deleteNotification: vi.fn().mockResolvedValue({}),
  },
}));

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

describe('Navbar — logged out', () => {
  beforeEach(() => {
    localStorage.getItem.mockReturnValue(null); // no token, no user
  });

  test('renders the GRID FANTASY brand', () => {
    renderNavbar();
    expect(screen.getByText('FANTASY')).toBeInTheDocument();
  });

  test('shows Log in and Get started links', () => {
    renderNavbar();
    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.getByText('Get started')).toBeInTheDocument();
  });

  test('does not show authenticated nav links', () => {
    renderNavbar();
    expect(screen.queryByText('Discover')).not.toBeInTheDocument();
    expect(screen.queryByText('Calendar')).not.toBeInTheDocument();
  });
});

describe('Navbar — logged in', () => {
  beforeEach(() => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'fake-jwt-token';
      if (key === 'user') return JSON.stringify({ id: 'u1', name: 'Alice', email: 'a@b.com' });
      return null;
    });
  });

  test('shows Discover, Calendar, Profile links', () => {
    renderNavbar();
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test("shows user's name", () => {
    renderNavbar();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  test('shows sign out button', () => {
    renderNavbar();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  test('does not show Log in / Get started', () => {
    renderNavbar();
    expect(screen.queryByText('Log in')).not.toBeInTheDocument();
    expect(screen.queryByText('Get started')).not.toBeInTheDocument();
  });
});
