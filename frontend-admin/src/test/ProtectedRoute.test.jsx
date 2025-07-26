import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { AdminAuthProvider } from '../context/AdminAuthContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

const TestComponent = () => <div>Protected Content</div>;

const renderWithProvider = (component) => {
  return render(
    <AdminAuthProvider>
      {component}
    </AdminAuthProvider>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should handle authentication check', async () => {
    // Mock a pending request that resolves to unauthenticated
    mockedAxios.get.mockResolvedValue({ data: { user: null } });

    renderWithProvider(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    // Should eventually show login form when not authenticated
    await waitFor(() => {
      expect(screen.getByText('Staff Login')).toBeInTheDocument();
    });
  });

  it('should show login form when user is not authenticated', async () => {
    mockedAxios.get.mockRejectedValue(new Error('No token'));

    renderWithProvider(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Staff Login')).toBeInTheDocument();
      expect(screen.getByText('Access the College Canteen Admin Dashboard')).toBeInTheDocument();
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show protected content when user is authenticated', async () => {
    const mockUser = { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'staff' };
    localStorage.setItem('adminToken', 'valid-token');
    mockedAxios.get.mockResolvedValue({ data: { user: mockUser } });

    renderWithProvider(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(screen.queryByText('Staff Login')).not.toBeInTheDocument();
  });

  it('should show login form when token verification fails', async () => {
    localStorage.setItem('adminToken', 'invalid-token');
    mockedAxios.get.mockRejectedValue(new Error('Token invalid'));

    renderWithProvider(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Staff Login')).toBeInTheDocument();
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show login form when user is not staff', async () => {
    const mockUser = { id: '1', name: 'Student User', email: 'student@example.com', role: 'student' };
    localStorage.setItem('adminToken', 'valid-token');
    mockedAxios.get.mockResolvedValue({ data: { user: mockUser } });

    renderWithProvider(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByText('Staff Login')).toBeInTheDocument();
    });

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});