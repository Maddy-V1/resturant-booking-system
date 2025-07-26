import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AdminAuthProvider, useAdminAuth } from '../context/AdminAuthContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Test component to access context
const TestComponent = () => {
  const { user, loading, error, login, logout, isAuthenticated } = useAdminAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.name : 'no-user'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AdminAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete mockedAxios.defaults.headers.common['Authorization'];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial state', async () => {
    mockedAxios.get.mockRejectedValue(new Error('No token'));

    render(
      <AdminAuthProvider>
        <TestComponent />
      </AdminAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should authenticate user with valid staff credentials', async () => {
    const mockUser = { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'staff' };
    const mockToken = 'mock-jwt-token';

    mockedAxios.post.mockResolvedValue({
      data: { token: mockToken, user: mockUser }
    });

    render(
      <AdminAuthProvider>
        <TestComponent />
      </AdminAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    });

    expect(localStorage.getItem('adminToken')).toBe(mockToken);
    expect(mockedAxios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
  });

  it('should reject non-staff users', async () => {
    const mockUser = { id: '1', name: 'Student User', email: 'student@example.com', role: 'student' };
    const mockToken = 'mock-jwt-token';

    mockedAxios.post.mockResolvedValue({
      data: { token: mockToken, user: mockUser }
    });

    render(
      <AdminAuthProvider>
        <TestComponent />
      </AdminAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Access denied. Staff credentials required.');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });

    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  it('should handle login errors', async () => {
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: { message: 'Invalid credentials' } } }
    });

    render(
      <AdminAuthProvider>
        <TestComponent />
      </AdminAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  it('should logout user and clear token', async () => {
    const mockUser = { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'staff' };
    const mockToken = 'mock-jwt-token';

    // Setup authenticated state
    localStorage.setItem('adminToken', mockToken);
    mockedAxios.get.mockResolvedValue({ data: { user: mockUser } });

    render(
      <AdminAuthProvider>
        <TestComponent />
      </AdminAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
    });

    // Perform logout
    act(() => {
      screen.getByText('Logout').click();
    });

    // Check immediate state changes (synchronous)
    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(mockedAxios.defaults.headers.common['Authorization']).toBeUndefined();
  });

  it('should verify existing token on mount', async () => {
    const mockUser = { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'staff' };
    const mockToken = 'existing-token';

    localStorage.setItem('adminToken', mockToken);
    mockedAxios.get.mockResolvedValue({ data: { user: mockUser } });

    render(
      <AdminAuthProvider>
        <TestComponent />
      </AdminAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('Admin User');
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/auth/verify');
  });

  it('should clear invalid token on verification failure', async () => {
    const mockToken = 'invalid-token';
    localStorage.setItem('adminToken', mockToken);
    mockedAxios.get.mockRejectedValue(new Error('Token invalid'));

    render(
      <AdminAuthProvider>
        <TestComponent />
      </AdminAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    expect(localStorage.getItem('adminToken')).toBeNull();
  });
});