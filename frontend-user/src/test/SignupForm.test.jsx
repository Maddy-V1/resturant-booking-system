import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SignupForm from '../components/auth/SignupForm';
import { useAuth } from '../context/AuthContext';

// Mock the useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

const mockUseAuth = vi.mocked(useAuth);

describe('SignupForm', () => {
  const mockSignup = vi.fn();
  const mockClearError = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      signup: mockSignup,
      error: null,
      clearError: mockClearError,
      loading: false
    });
  });

  it('should render signup form with all fields', () => {
    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    expect(screen.getByText('Create Your Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('WhatsApp Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByText('Sign in here')).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp number is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
    });

    expect(mockSignup).not.toHaveBeenCalled();
  });

  it('should validate name length', async () => {
    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const nameInput = screen.getByLabelText('Full Name');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(nameInput, { target: { value: 'A' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name must be at least 2 characters long')).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email Address');
    const whatsappInput = screen.getByLabelText('WhatsApp Number');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const form = emailInput.closest('form');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(whatsappInput, { target: { value: '+1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    
    // Directly trigger form submit event
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should validate WhatsApp number format', async () => {
    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const whatsappInput = screen.getByLabelText('WhatsApp Number');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(whatsappInput, { target: { value: '123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid WhatsApp number')).toBeInTheDocument();
    });
  });

  it('should validate password strength', async () => {
    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email Address');
    const whatsappInput = screen.getByLabelText('WhatsApp Number');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(whatsappInput, { target: { value: '+1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'weakpassword' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'weakpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must contain at least one uppercase letter, one lowercase letter, and one number')).toBeInTheDocument();
    });
  });

  it('should validate password confirmation', async () => {
    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Different123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    mockSignup.mockResolvedValue({ success: true });

    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email Address');
    const whatsappInput = screen.getByLabelText('WhatsApp Number');
    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(whatsappInput, { target: { value: '+1234567890' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        whatsapp: '+1234567890',
        password: 'Password123'
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should display server error', () => {
    const errorMessage = 'Email already exists';
    mockUseAuth.mockReturnValue({
      signup: mockSignup,
      error: errorMessage,
      clearError: mockClearError,
      loading: false
    });

    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should show loading state during submission', () => {
    mockUseAuth.mockReturnValue({
      signup: mockSignup,
      error: null,
      clearError: mockClearError,
      loading: true
    });

    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Creating Account...' });
    expect(submitButton).toBeDisabled();
  });

  it('should clear confirm password error when passwords match', async () => {
    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const passwordInput = screen.getByLabelText('Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm Password');
    const submitButton = screen.getByRole('button', { name: 'Create Account' });

    // Create password mismatch error
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'Different123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });

    // Fix the password to match
    fireEvent.change(confirmPasswordInput, { target: { value: 'Password123' } });

    await waitFor(() => {
      expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
    });
  });

  it('should call onSwitchToLogin when login link is clicked', () => {
    render(
      <SignupForm 
        onSuccess={mockOnSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
      />
    );

    const loginLink = screen.getByText('Sign in here');
    fireEvent.click(loginLink);

    expect(mockOnSwitchToLogin).toHaveBeenCalled();
  });
});