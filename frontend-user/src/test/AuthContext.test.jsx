import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.name : 'No user'}</div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="error">{auth.error || 'No error'}</div>
      <div data-testid="authenticated">{auth.isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      <button onClick={() => auth.login('test@example.com', 'password')}>Login</button>
      <button onClick={() => auth.signup({ name: 'Test', email: 'test@example.com', password: 'password', whatsapp: '1234567890' })}>Signup</button>
      <button onClick={auth.logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockedAxios.defaults = { headers: { common: {} } };
    mockedAxios.interceptors = {
      response: {
        use: vi.fn(() => 1),
        eject: vi.fn()
      }
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial auth state', async () => {
    mockedAxios.get.mockResolvedValue({ data: { user: null } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('error')).toHaveTextContent('No error');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated');
    });
  });

  it('should handle successful login', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    const mockToken = 'mock-jwt-token';

    mockedAxios.post.mockResolvedValue({
      data: { token: mockToken, user: mockUser }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
    expect(mockedAxios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
  });

  it('should handle login error', async () => {
    const errorMessage = 'Invalid credentials';
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: { message: errorMessage } } }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated');
    });
  });

  it('should handle successful signup', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    const mockToken = 'mock-jwt-token';

    mockedAxios.post.mockResolvedValue({
      data: { token: mockToken, user: mockUser }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });

    await act(async () => {
      screen.getByText('Signup').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
  });

  it('should handle logout', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    const mockToken = 'mock-jwt-token';

    // Setup initial authenticated state
    localStorageMock.getItem.mockReturnValue(mockToken);
    mockedAxios.get.mockResolvedValue({ data: { user: mockUser } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });

  it('should restore user from token on app load', async () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    const mockToken = 'mock-jwt-token';

    localStorageMock.getItem.mockReturnValue(mockToken);
    mockedAxios.get.mockResolvedValue({ data: { user: mockUser } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/verify');
  });

  it('should handle token verification failure', async () => {
    const mockToken = 'invalid-token';

    localStorageMock.getItem.mockReturnValue(mockToken);
    mockedAxios.get.mockRejectedValue({ response: { status: 401 } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    });
  });
});