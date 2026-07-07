// src/__tests__/pages/Register.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../../pages/Register';

const mockRegister = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('../../api', () => ({
  api: { register: mockRegister },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

describe('Register page', () => {
  test('renders name, email, and password inputs', () => {
    renderRegister();
    expect(screen.getByPlaceholderText('Max Verstappen')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min. 6 characters')).toBeInTheDocument();
  });

  test('renders a submit button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('renders a link to the login page', () => {
    renderRegister();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  test('calls api.register with entered data', async () => {
    mockRegister.mockResolvedValue({ user: { id: 'u1' } });

    renderRegister();
    await userEvent.type(screen.getByPlaceholderText('Max Verstappen'), 'Bob');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'bob@example.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 6 characters'), 'pass1234');
    // Confirm password field uses placeholder "••••••••"
    const confirmField = screen.getByPlaceholderText('••••••••');
    await userEvent.type(confirmField, 'pass1234');

    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('bob@example.com', 'Bob', 'pass1234');
    });
  });

  test('shows error from api on failure', async () => {
    mockRegister.mockRejectedValue(new Error('Email already exists'));

    renderRegister();
    await userEvent.type(screen.getByPlaceholderText('Max Verstappen'), 'Bob');
    await userEvent.type(screen.getByPlaceholderText('you@example.com'), 'dup@example.com');
    await userEvent.type(screen.getByPlaceholderText('Min. 6 characters'), 'pass1234');
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass1234');

    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });
});
