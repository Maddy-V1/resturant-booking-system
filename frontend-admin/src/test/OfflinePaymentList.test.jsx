import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import OfflinePaymentList from '../components/payments/OfflinePaymentList';

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

describe('OfflinePaymentList', () => {
  const mockPendingOrders = [
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
      status: 'confirmed',
      paymentMethod: 'offline',
      paymentStatus: 'pending',
      items: [
        { name: 'Pizza', price: 200, quantity: 1 }
      ],
      createdAt: '2024-01-15T11:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful pending payments fetch by default
    mockedAxios.get.mockResolvedValue({
      data: { data: mockPendingOrders }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render payment confirmation page with header', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('Offline Payment Confirmation')).toBeInTheDocument();
    });

    expect(screen.getByText('Confirm cash payments from customers')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('pending payments')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('should fetch and display pending payments', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/staff/pending-payments');
    });

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
    });

    // Check customer details
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('9876543210')).toBeInTheDocument();
  });

  it('should display order items and totals correctly', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Check order items for ORD-001
    expect(screen.getByText('2x Burger')).toBeInTheDocument();
    expect(screen.getByText('1x Fries')).toBeInTheDocument();
    expect(screen.getByText('₹300')).toBeInTheDocument(); // 2 * 150
    expect(screen.getByText('₹80')).toBeInTheDocument();

    // Check total amounts
    const totalAmounts = screen.getAllByText('₹380'); // (2 * 150) + (1 * 80)
    expect(totalAmounts.length).toBeGreaterThan(0);

    // Check for ORD-002
    expect(screen.getByText('1x Pizza')).toBeInTheDocument();
    expect(screen.getAllByText('₹200')).toHaveLength(2); // Item price and total
  });

  it('should confirm payment successfully', async () => {
    mockedAxios.put.mockResolvedValue({ data: { success: true } });

    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Find and click confirm payment button
    const confirmButtons = screen.getAllByText('Confirm Cash Payment');
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/staff/orders/1/payment',
        { paymentStatus: 'paid' }
      );
    });

    // Should refetch pending payments
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  it('should show loading state during payment confirmation', async () => {
    // Mock a delayed response
    mockedAxios.put.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
    );

    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Click confirm payment button
    const confirmButtons = screen.getAllByText('Confirm Cash Payment');
    fireEvent.click(confirmButtons[0]);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Confirming...')).toBeInTheDocument();
    });

    // Button should be disabled
    const confirmingButton = screen.getByText('Confirming...').closest('button');
    expect(confirmingButton).toBeDisabled();
  });

  it('should handle payment confirmation errors', async () => {
    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Payment already confirmed'
          }
        }
      }
    };

    mockedAxios.put.mockRejectedValue(errorResponse);

    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Try to confirm payment
    const confirmButtons = screen.getAllByText('Confirm Cash Payment');
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Payment already confirmed')).toBeInTheDocument();
    });
  });

  it('should show empty state when no pending payments exist', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: [] } });

    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('All payments confirmed!')).toBeInTheDocument();
    });

    expect(screen.getByText('No orders are waiting for cash payment confirmation.')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('pending payments')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load pending payments')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    // Mock a delayed response
    mockedAxios.get.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { data: mockPendingOrders } }), 100))
    );

    render(<OfflinePaymentList />);

    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should handle refresh button', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);

    // Should fetch pending payments again
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('should initialize socket connection', async () => {
    render(<OfflinePaymentList />);

    // Wait for component to mount and socket to initialize
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join-staff-room');
    });
  });

  it('should handle socket events', async () => {
    render(<OfflinePaymentList />);

    // Simulate socket events
    const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    const newOrderCallback = mockSocket.on.mock.calls.find(call => call[0] === 'new-order')[1];
    const paymentConfirmedCallback = mockSocket.on.mock.calls.find(call => call[0] === 'payment-confirmed')[1];

    // Trigger connect event
    connectCallback();
    expect(mockSocket.emit).toHaveBeenCalledWith('join-staff-room');

    // Trigger new order event with offline payment
    newOrderCallback({ orderId: 'new-order', paymentMethod: 'offline' });
    
    // Trigger payment confirmed event
    paymentConfirmedCallback({ orderId: '1' });

    // Should refetch pending payments for both events
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(3); // Initial + 2 refreshes
    });
  });

  it('should not refresh on online payment orders', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Simulate new order event with online payment
    const newOrderCallback = mockSocket.on.mock.calls.find(call => call[0] === 'new-order')[1];
    newOrderCallback({ orderId: 'new-order', paymentMethod: 'online' });

    // Should not trigger additional fetch (still only 1 call)
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('should format dates and times correctly', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Should display formatted dates and times
    const dateElements = screen.getAllByText(/\d{2} \w{3} \d{4}/); // DD MMM YYYY format
    expect(dateElements.length).toBeGreaterThan(0);

    const timeElements = screen.getAllByText(/\d{1,2}:\d{2}/); // HH:MM format
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('should show time since order', async () => {
    // Mock current time to be 1 hour after order creation
    const mockDate = new Date('2024-01-15T11:30:00Z');
    vi.setSystemTime(mockDate);

    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Should show time elapsed
    const timeAgoElements = screen.getAllByText(/\d+h \d+m ago|\d+ min ago/);
    expect(timeAgoElements.length).toBeGreaterThan(0);

    vi.useRealTimers();
  });

  it('should display status badges correctly', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();

    // Check payment status badges
    const paymentPendingBadges = screen.getAllByText('Payment Pending');
    expect(paymentPendingBadges.length).toBe(2); // One for each order
  });

  it('should show payment instructions', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('Payment Confirmation Instructions')).toBeInTheDocument();
    });

    expect(screen.getByText('Collect the exact cash amount from the customer')).toBeInTheDocument();
    expect(screen.getByText('Click "Confirm Cash Payment" only after receiving payment')).toBeInTheDocument();
    expect(screen.getByText('The order will automatically move to the preparation queue')).toBeInTheDocument();
  });

  it('should show correct payment amount in button text', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Check payment amount hints
    expect(screen.getByText('Click after receiving ₹380 in cash')).toBeInTheDocument();
    expect(screen.getByText('Click after receiving ₹200 in cash')).toBeInTheDocument();
  });

  it('should calculate totals correctly', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // ORD-001: (2 * 150) + (1 * 80) = 380
    const order1Total = screen.getAllByText('₹380');
    expect(order1Total.length).toBeGreaterThan(0);

    // ORD-002: 1 * 200 = 200
    const order2Total = screen.getAllByText('₹200');
    expect(order2Total.length).toBeGreaterThan(0);
  });

  it('should show queue movement information', async () => {
    render(<OfflinePaymentList />);

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    const queueInfoElements = screen.getAllByText('Order will move to preparation queue after payment confirmation');
    expect(queueInfoElements.length).toBe(2); // One for each order
  });
});