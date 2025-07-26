import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ProfileInfo from '../components/account/ProfileInfo';
import { AuthProvider } from '../context/AuthContext';

// Mock fetch
global.fetch = vi.fn();

// Mock the useAuth hook
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: '1', name: 'John Doe', email: 'john@example.com' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn()
    })
  };
});

const renderWithAuth = (component) => {
  return render(component);
};

describe('ProfileInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithAuth(<ProfileInfo />);
    
    // Check for loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders profile information successfully', async () => {
    const mockProfile = {
      name: 'John Doe',
      email: 'john@example.com',
      whatsapp: '+1234567890',
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockProfile
      })
    });

    renderWithAuth(<ProfileInfo />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    });
  });

  it('makes correct API call', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {}
      })
    });

    renderWithAuth(<ProfileInfo />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/users/profile', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        }
      });
    });
  });

  it('handles API error', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: { message: 'Profile not found' }
      })
    });

    renderWithAuth(<ProfileInfo />);

    await waitFor(() => {
      expect(screen.getByText('Error loading profile: Profile not found')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithAuth(<ProfileInfo />);

    await waitFor(() => {
      expect(screen.getByText('Error loading profile: Failed to fetch profile')).toBeInTheDocument();
    });
  });

  it('displays N/A for missing profile fields', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {} // Empty profile
      })
    });

    renderWithAuth(<ProfileInfo />);

    await waitFor(() => {
      const naElements = screen.getAllByText('N/A');
      expect(naElements).toHaveLength(4); // name, email, whatsapp, createdAt
    });
  });
});