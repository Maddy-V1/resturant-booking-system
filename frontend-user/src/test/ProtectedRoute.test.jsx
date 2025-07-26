import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Mock the useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock react-router-dom Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, state }) => (
      <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)}>
        Navigate to {to}
      </div>
    )
  };
});

const mockUseAuth = vi.mocked(useAuth);

const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Check for loading spinner (looking for the spinning animation class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toBeInTheDocument();
    expect(navigate).toHaveAttribute('data-to', '/login');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to custom path when specified', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute redirectTo="/custom-login">
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toHaveAttribute('data-to', '/custom-login');
  });

  it('should render protected content when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('should pass location state for redirect after login', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </BrowserRouter>
    );

    const navigate = screen.getByTestId('navigate');
    const stateData = JSON.parse(navigate.getAttribute('data-state'));
    expect(stateData.from).toBeDefined();
    expect(stateData.from.pathname).toBe('/');
  });
});