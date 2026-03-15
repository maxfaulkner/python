// src/__tests__/pages/Login.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';

// vi.mock is hoisted — variables used inside must be declared with vi.hoisted()
const mockLogin = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('../../api', () => ({
  api: { login: mockLogin },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login page', () => {
  test('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  test('renders a submit button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders a link to the register page', () => {
    renderLogin();
    expect(screen.getByText(/create one/i)).toBeInTheDocument();
  });

  test('shows error when submitted with empty fields', async () => {
    renderLogin();
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
    await waitFor(() => {
      // Form uses HTML5 required — api should not be called with empty fields
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  test('calls api.login with entered credentials', async () => {
    mockLogin.mockResolvedValue({
      token: 'jwt123',
      user: { id: 'u1', name: 'Alice', email: 'alice@example.com' },
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'mypassword');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('alice@example.com', 'mypassword');
    });
  });

  test('navigates to home on successful login', async () => {
    mockLogin.mockResolvedValue({
      token: 'jwt123',
      user: { id: 'u1', name: 'Alice', email: 'alice@example.com' },
    });

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'alice@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('shows error message on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));

    renderLogin();
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bad@example.com');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
