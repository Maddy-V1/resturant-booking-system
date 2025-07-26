import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminLoginForm from '../components/auth/AdminLoginForm';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const renderWithProvider = (component) => {
  return render(
    <AdminAuthProvider>
      {component}
    </AdminAuthProvider>
  );
};

describe('AdminLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form', () => {
    renderWithProvider(<AdminLoginForm />);

    expect(screen.getByText('Staff Login')).toBeInTheDocument();
    expect(screen.getByText('Access the College Canteen Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should handle form input changes', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AdminLoginForm />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('admin@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('should disable submit button when fields are empty', () => {
    renderWithProvider(<AdminLoginForm />);

    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when fields are filled', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AdminLoginForm />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password123');

    expect(submitButton).not.toBeDisabled();
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    const mockOnLoginSuccess = vi.fn();
    const mockUser = { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'staff' };
    const mockToken = 'mock-jwt-token';

    mockedAxios.post.mockResolvedValue({
      data: { token: mockToken, user: mockUser }
    });

    renderWithProvider(<AdminLoginForm onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
        email: 'admin@example.com',
        password: 'password123'
      });
    });

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });

  it('should call login function on form submission', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: { message: 'Invalid credentials' } } }
    });

    renderWithProvider(<AdminLoginForm />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
        email: 'admin@example.com',
        password: 'wrongpassword'
      });
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    mockedAxios.post.mockReturnValue(loginPromise);

    renderWithProvider(<AdminLoginForm />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText('Signing in...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolveLogin({
      data: { token: 'token', user: { id: '1', name: 'Admin', role: 'staff' } }
    });

    await waitFor(() => {
      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });
  });

  it('should reset form after successful login', async () => {
    const user = userEvent.setup();
    const mockUser = { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'staff' };
    const mockToken = 'mock-jwt-token';

    mockedAxios.post.mockResolvedValue({
      data: { token: mockToken, user: mockUser }
    });

    renderWithProvider(<AdminLoginForm />);

    const emailInput = screen.getByPlaceholderText('Email address');
    const passwordInput = screen.getByPlaceholderText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    await user.type(emailInput, 'admin@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    });
  });

  it('should prevent form submission with empty fields', async () => {
    const user = userEvent.setup();
    renderWithProvider(<AdminLoginForm />);

    const form = screen.getByRole('button', { name: 'Sign in' }).closest('form');
    
    fireEvent.submit(form);

    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});