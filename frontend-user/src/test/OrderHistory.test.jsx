import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import OrderHistory from '../components/account/OrderHistory';

// Mock fetch
global.fetch = vi.fn();

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('OrderHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  const mockOrders = [
    {
      _id: '1',
      orderNumber: 'ORD001',
      createdAt: '2024-01-01T12:00:00.000Z',
      status: 'ready',
      items: [
        { name: 'Pizza', quantity: 2, price: 10 },
        { name: 'Coke', quantity: 1, price: 2 }
      ],
      totalAmount: 22,
      paymentMethod: 'online'
    },
    {
      _id: '2',
      orderNumber: 'ORD002',
      createdAt: '2024-01-02T14:30:00.000Z',
      status: 'preparing',
      items: [
        { name: 'Burger', quantity: 1, price: 8 }
      ],
      totalAmount: 8,
      paymentMethod: 'offline'
    }
  ];

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    renderWithRouter(<OrderHistory />);
    
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders order history successfully', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockOrders
      })
    });

    renderWithRouter(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Order #ORD001')).toBeInTheDocument();
      expect(screen.getByText('Order #ORD002')).toBeInTheDocument();
      expect(screen.getByText('Pizza x2')).toBeInTheDocument();
      expect(screen.getByText('Burger x1')).toBeInTheDocument();
      expect(screen.getByText('Total: ₹22.00')).toBeInTheDocument();
      expect(screen.getByText('Total: ₹8.00')).toBeInTheDocument();
    });
  });

  it('renders limited orders when limit prop is provided', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockOrders
      })
    });

    renderWithRouter(<OrderHistory limit={1} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Orders (Last 1)')).toBeInTheDocument();
      expect(screen.getByText('Order #ORD001')).toBeInTheDocument();
      expect(screen.queryByText('Order #ORD002')).not.toBeInTheDocument();
      expect(screen.getByText('View More Order History →')).toBeInTheDocument();
    });
  });

  it('displays correct status colors and formatting', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: [
          { ...mockOrders[0], status: 'payment pending' },
          { ...mockOrders[1], status: 'picked_up' }
        ]
      })
    });

    renderWithRouter(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Payment pending')).toBeInTheDocument();
      expect(screen.getByText('Picked Up')).toBeInTheDocument();
    });
  });

  it('makes correct API call', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: []
      })
    });

    renderWithRouter(<OrderHistory />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/orders', {
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
        error: { message: 'Orders not found' }
      })
    });

    renderWithRouter(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Error loading orders: Orders not found')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Error loading orders: Failed to fetch orders')).toBeInTheDocument();
    });
  });

  it('displays empty state when no orders', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: []
      })
    });

    renderWithRouter(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
      expect(screen.getByText('Browse Menu')).toBeInTheDocument();
    });
  });

  it('displays payment method correctly', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockOrders
      })
    });

    renderWithRouter(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Payment: Online')).toBeInTheDocument();
      expect(screen.getByText('Payment: Cash')).toBeInTheDocument();
    });
  });

  it('includes track order links', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockOrders
      })
    });

    renderWithRouter(<OrderHistory />);

    await waitFor(() => {
      const trackLinks = screen.getAllByText('Track Order');
      expect(trackLinks).toHaveLength(2);
      expect(trackLinks[0].closest('a')).toHaveAttribute('href', '/order/1');
      expect(trackLinks[1].closest('a')).toHaveAttribute('href', '/order/2');
    });
  });
});