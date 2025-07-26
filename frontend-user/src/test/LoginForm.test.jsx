import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../context/AuthContext';

// Mock the useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

const mockUseAuth = vi.mocked(useAuth);

describe('LoginForm', () => {
  const mockLogin = vi.fn();
  const mockClearError = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToSignup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      error: null,
      clearError: mockClearError,
      loading: false
    });
  });

  it('should render login form with all fields', () => {
    render(
      <LoginForm 
        onSuccess={mockOnSuccess}
        onSwitchToSignup={mockOnSwitchToSignup}
      />
    );

    expect(screen.getByText('Login to Your Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText('Sign up here')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <LoginForm 
        onSuccess={mockOnSuccess}
        onSwitchToSignup={mockOnSwitchToSignup}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    render(
      <LoginForm 
        onSuccess={mockOnSuccess}
        onSwitchToSignup={mockOnSwitchToSignup}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const form = emailInput.closest('form');

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Directly trigger form submit event
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should validate password length', async () => {
    render(
      <LoginForm 
        onSuccess={mockOnSuccess}
        onSwitchToSignup={mockOnSwitchToSignup}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(
      <LoginForm 
        onSuccess={mockOnSuccess}
        onSwitchToSignup={mockOnSwitchToSignup}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display server error', () => {
    const errorMessage = 'Invalid credentials';
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      error: errorMessage,
      clearError: mockClearError,
      loading: false
    });

    render(
      <LoginForm 
        onSuccess={mockOnSuccess}
        onSwitchToSignup={mockOnSwitchToSignup}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should show loading state during submission', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      error: null,
      clearError: mockClearError,
      loading: true
    });

    render(
      <LoginForm 
        onSuccess={mockOnSuccess}
        onSwitchToSignup={mockOnSwitchToSignup}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Signing In...' });
    expect(submitButton).toBeDisabled();
  });

  it('should clear field errors when user starts typing', async () => {
    render(
      <LoginForm 
        onSuccess={mockOnSuccess}
        onSwitchToSignup={mockOnSwitchToSignup}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', { name: 'Sign In' });

    // Trigger validation error
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(emailInput, { target: { value: 'test@' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });
  });

  it('should call onSwitchToSignup when signup link is clicked', () => {
    render(
      <LoginForm 
        onSuccess={mockOnSuccess}
        onSwitchToSignup={mockOnSwitchToSignup}
      />
    );

    const signupLink = screen.getByText('Sign up here');
    fireEvent.click(signupLink);

    expect(mockOnSwitchToSignup).toHaveBeenCalled();
  });
});