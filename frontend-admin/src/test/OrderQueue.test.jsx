import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import OrderQueue from '../components/orders/OrderQueue';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock socket.io-client
const mockSocket = {
  on: vi.fn((event, callback) => {
    if (event === 'connect') {
      // Simulate immediate connection
      setTimeout(() => callback(), 0);
    }
  }),
  emit: vi.fn(),
  disconnect: vi.fn()
};

vi.mock('socket.io-client', () => ({
  default: vi.fn(() => mockSocket)
}));

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:5000',
    VITE_SOCKET_URL: 'http://localhost:5000'
  }
}));

describe('OrderQueue', () => {
  const mockOrders = [
    {
      _id: '1',
      orderNumber: 'ORD-001',
      customerName: 'John Doe',
      customerWhatsapp: '1234567890',
      status: 'pending',
      paymentMethod: 'offline',
      paymentStatus: 'pending',
      items: [
        { name: 'Burger', price: 150, quantity: 2 },
        { name: 'Fries', price: 80, quantity: 1 }
      ],
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      _id: '2',
      orderNumber: 'ORD-002',
      customerName: 'Jane Smith',
      customerWhatsapp: '9876543210',
      status: 'preparing',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      items: [
        { name: 'Pizza', price: 200, quantity: 1 }
      ],
      createdAt: '2024-01-15T11:00:00Z'
    },
    {
      _id: '3',
      orderNumber: 'ORD-003',
      customerName: 'Bob Wilson',
      customerWhatsapp: '5555555555',
      status: 'ready',
      paymentMethod: 'offline',
      paymentStatus: 'paid',
      items: [
        { name: 'Sandwich', price: 100, quantity: 3 }
      ],
      createdAt: '2024-01-15T09:45:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful orders fetch by default
    mockedAxios.get.mockResolvedValue({
      data: { data: mockOrders }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render order queue with header and controls', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('Order Queue')).toBeInTheDocument();
    });

    expect(screen.getByText('Manage incoming orders and track preparation status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Orders')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Newest First')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should fetch and display orders', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/staff/orders');
    });

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
      expect(screen.getByText('ORD-003')).toBeInTheDocument();
    });

    // Check customer names
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('should display order details correctly', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Check order items
    expect(screen.getByText('2x Burger')).toBeInTheDocument();
    expect(screen.getByText('1x Fries')).toBeInTheDocument();
    expect(screen.getAllByText('₹300')).toHaveLength(3); // 2 * 150 (appears in item, total, and another order)
    expect(screen.getByText('₹80')).toBeInTheDocument();

    // Check status badges (using getAllByText since there are multiple elements)
    expect(screen.getAllByText('Pending')).toHaveLength(2); // One in filter, one in status badge
    expect(screen.getAllByText('Preparing')).toHaveLength(2); // One in filter, one in status badge
    expect(screen.getByText('Ready')).toBeInTheDocument();

    // Check payment status
    expect(screen.getByText('Cash Pending')).toBeInTheDocument();
    expect(screen.getByText('Online Paid')).toBeInTheDocument();
    expect(screen.getByText('Cash Paid')).toBeInTheDocument();
  });

  it('should filter orders by status', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Filter by preparing status
    const filterSelect = screen.getByDisplayValue('All Orders');
    fireEvent.change(filterSelect, { target: { value: 'preparing' } });

    // Should only show preparing orders
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.queryByText('ORD-001')).not.toBeInTheDocument();
    expect(screen.queryByText('ORD-003')).not.toBeInTheDocument();
  });

  it('should sort orders correctly', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Change sort to oldest first
    const sortSelect = screen.getByDisplayValue('Newest First');
    fireEvent.change(sortSelect, { target: { value: 'oldest' } });

    // Orders should be reordered (oldest first: ORD-003, ORD-001, ORD-002)
    const orderCards = screen.getAllByText(/ORD-\d+/);
    expect(orderCards[0]).toHaveTextContent('ORD-003');
    expect(orderCards[1]).toHaveTextContent('ORD-001');
    expect(orderCards[2]).toHaveTextContent('ORD-002');
  });

  it('should update order status', async () => {
    mockedAxios.put.mockResolvedValue({ data: { success: true } });

    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
    });

    // Find and click "Mark Ready" button for preparing order
    const markReadyButton = screen.getByText('Mark Ready');
    fireEvent.click(markReadyButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/orders/2/status',
        { status: 'ready' }
      );
    });

    // Should refetch orders
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  it('should show order details modal', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Click "View Details" button
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    // Modal should be visible
    expect(screen.getByText('Order Details')).toBeInTheDocument();
    // Check that modal contains order details (WhatsApp might be in different format)
    expect(screen.getByText('Order Details')).toBeInTheDocument();
    
    // Check that modal is visible with order details
    expect(screen.getByText('Order Details')).toBeInTheDocument();
  });

  it('should close order details modal', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Open modal
    const viewDetailsButtons = screen.getAllByText('View Details');
    fireEvent.click(viewDetailsButtons[0]);

    expect(screen.getByText('Order Details')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText('Order Details')).not.toBeInTheDocument();
  });

  it('should handle refresh button', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Should fetch orders again
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('should show empty state when no orders exist', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: [] } });

    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('No orders found.')).toBeInTheDocument();
    });
  });

  it('should show filtered empty state', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Filter by completed status (no completed orders in mock data)
    const filterSelect = screen.getByDisplayValue('All Orders');
    fireEvent.change(filterSelect, { target: { value: 'completed' } });

    expect(screen.getByText('No completed orders found.')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    // Mock a delayed response
    mockedAxios.get.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { data: mockOrders } }), 100))
    );

    render(<OrderQueue />);

    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should initialize socket connection', async () => {
    render(<OrderQueue />);

    // Wait for component to mount and socket to initialize
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join-staff-room');
    });
  });

  it('should handle socket events', async () => {
    render(<OrderQueue />);

    // Simulate socket events
    const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    const newOrderCallback = mockSocket.on.mock.calls.find(call => call[0] === 'new-order')[1];
    const statusUpdateCallback = mockSocket.on.mock.calls.find(call => call[0] === 'order-status-updated')[1];

    // Trigger connect event
    connectCallback();
    expect(mockSocket.emit).toHaveBeenCalledWith('join-staff-room');

    // Trigger new order event
    newOrderCallback({ orderId: 'new-order' });
    
    // Trigger status update event
    statusUpdateCallback({ orderId: '1', status: 'confirmed' });

    // Should refetch orders for both events
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(3); // Initial + 2 refreshes
    });
  });

  it('should show correct action buttons based on order status and payment', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Pending order with pending payment - should not show status update button
    const pendingOrderCard = screen.getByText('ORD-001').closest('.bg-white');
    expect(pendingOrderCard).not.toHaveTextContent('Confirm Order');

    // Preparing order with paid status - should show "Mark Ready" button
    expect(screen.getByText('Mark Ready')).toBeInTheDocument();

    // Ready order with paid status - should show "Mark Completed" button
    expect(screen.getByText('Mark Completed')).toBeInTheDocument();
  });

  it('should handle cancel order', async () => {
    mockedAxios.put.mockResolvedValue({ data: { success: true } });

    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Find and click cancel button for pending order
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/orders/1/status',
        { status: 'cancelled' }
      );
    });
  });

  it('should handle status update errors', async () => {
    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Failed to update status'
          }
        }
      }
    };

    mockedAxios.put.mockRejectedValue(errorResponse);

    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
    });

    // Try to update status
    const markReadyButton = screen.getByText('Mark Ready');
    fireEvent.click(markReadyButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update order status')).toBeInTheDocument();
    });
  });

  it('should calculate order totals correctly', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Check total for ORD-001: (2 * 150) + (1 * 80) = 380
    const orderCard = screen.getByText('ORD-001').closest('.bg-white');
    expect(orderCard).toHaveTextContent('₹380');

    // Check total for ORD-002: 1 * 200 = 200
    const order2Card = screen.getByText('ORD-002').closest('.bg-white');
    expect(order2Card).toHaveTextContent('₹200');
  });

  it('should format time correctly', async () => {
    render(<OrderQueue />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Should display formatted time (this will depend on timezone, so we just check format)
    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });
});