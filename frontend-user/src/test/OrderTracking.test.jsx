import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import OrderTracking from '../components/orders/OrderTracking';
import { SocketProvider } from '../context/SocketContext';
import { io } from 'socket.io-client';

// Mock dependencies
vi.mock('axios');
vi.mock('socket.io-client');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ orderId: 'test-order-123' })
  };
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

describe('OrderTracking', () => {
  let mockSocket;
  const mockOrder = {
    _id: 'order-id-123',
    orderNumber: 'test-order-123',
    customerName: 'John Doe',
    customerWhatsapp: '+1234567890',
    status: 'preparing',
    paymentStatus: 'confirmed',
    paymentMethod: 'online',
    totalAmount: 150.50,
    items: [
      {
        name: 'Burger',
        price: 100,
        quantity: 1
      },
      {
        name: 'Fries',
        price: 50.50,
        quantity: 1
      }
    ],
    createdAt: '2024-01-15T10:30:00Z'
  };

  beforeEach(() => {
    mockSocket = {
      id: 'test-socket-id',
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn()
    };
    
    io.mockReturnValue(mockSocket);
    axios.get.mockResolvedValue({ data: { order: mockOrder } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (component) => {
    return render(
      <BrowserRouter>
        <SocketProvider>
          {component}
        </SocketProvider>
      </BrowserRouter>
    );
  };

  it('should render loading state initially', () => {
    renderWithProviders(<OrderTracking />);
    
    expect(screen.getByText('Loading order details...')).toBeInTheDocument();
  });

  it('should fetch and display order details', async () => {
    renderWithProviders(<OrderTracking />);

    await waitFor(() => {
      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
      expect(screen.getByText('Order #test-order-123')).toBeInTheDocument();
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/\+1234567890/)).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith('/api/orders/test-order-123');
  });

  it('should display order items correctly', async () => {
    renderWithProviders(<OrderTracking />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
      expect(screen.getByText('Fries')).toBeInTheDocument();
      expect(screen.getByText('₹100.00')).toBeInTheDocument();
      expect(screen.getByText('₹50.50')).toBeInTheDocument();
      expect(screen.getByText('₹150.50')).toBeInTheDocument();
    });
  });

  it('should join order room when connected', async () => {
    renderWithProviders(<OrderTracking />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    });

    // Simulate socket connection
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    connectHandler();

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join-order-room', 'test-order-123');
    });
  });

  it('should handle real-time order status updates', async () => {
    renderWithProviders(<OrderTracking />);

    await waitFor(() => {
      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    });

    // Simulate socket connection and order update
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    connectHandler();

    // Wait for socket event handlers to be registered
    await waitFor(() => {
      const orderUpdateCall = mockSocket.on.mock.calls.find(call => call[0] === 'order-status-updated');
      expect(orderUpdateCall).toBeDefined();
    });

    // Find the order status update handler
    const orderUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'order-status-updated')[1];
    
    // Simulate order status update
    const updatedOrder = {
      ...mockOrder,
      status: 'ready',
      orderNumber: 'test-order-123'
    };

    orderUpdateHandler(updatedOrder);

    await waitFor(() => {
      expect(screen.getByText('Your order is ready for pickup!')).toBeInTheDocument();
    });
  });

  it('should handle payment confirmation updates', async () => {
    const pendingOrder = {
      ...mockOrder,
      status: 'payment pending',
      paymentStatus: 'pending'
    };
    
    axios.get.mockResolvedValue({ data: { order: pendingOrder } });
    
    renderWithProviders(<OrderTracking />);

    await waitFor(() => {
      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    });

    // Simulate socket connection
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    connectHandler();

    // Wait for socket event handlers to be registered
    await waitFor(() => {
      const paymentUpdateCall = mockSocket.on.mock.calls.find(call => call[0] === 'payment-confirmed');
      expect(paymentUpdateCall).toBeDefined();
    });

    // Find the payment update handler
    const paymentUpdateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'payment-confirmed')[1];
    
    // Simulate payment confirmation
    const paymentUpdate = {
      orderNumber: 'test-order-123',
      newStatus: 'preparing'
    };

    paymentUpdateHandler(paymentUpdate);

    await waitFor(() => {
      expect(screen.getByText('Your order is being prepared')).toBeInTheDocument();
    });
  });

  it('should copy order link to clipboard', async () => {
    renderWithProviders(<OrderTracking />);

    await waitFor(() => {
      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('Copy Link');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Order not found';
    axios.get.mockRejectedValue({
      response: {
        data: {
          error: {
            message: errorMessage
          }
        }
      }
    });

    renderWithProviders(<OrderTracking />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('should show connection status indicator', async () => {
    renderWithProviders(<OrderTracking />);

    await waitFor(() => {
      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    });

    // Initially should show reconnecting
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();

    // Simulate connection
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    connectHandler();

    await waitFor(() => {
      expect(screen.getByText('Live Updates')).toBeInTheDocument();
    });
  });

  it('should leave order room on unmount', async () => {
    const { unmount } = renderWithProviders(<OrderTracking />);

    await waitFor(() => {
      expect(screen.getByText('Order Tracking')).toBeInTheDocument();
    });

    // Simulate connection
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    connectHandler();

    // Wait for join room to be called
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('join-order-room', 'test-order-123');
    });

    // Clear previous calls to isolate the unmount behavior
    mockSocket.emit.mockClear();

    unmount();

    // The leave room should be called on unmount
    expect(mockSocket.emit).toHaveBeenCalledWith('leave-order-room', 'test-order-123');
  });

  it('should display shareable order link section', async () => {
    renderWithProviders(<OrderTracking />);

    await waitFor(() => {
      expect(screen.getByText('Share Order')).toBeInTheDocument();
      expect(screen.getByText('Share this order tracking link with others:')).toBeInTheDocument();
      expect(screen.getByText('Anyone with this link can track the order status')).toBeInTheDocument();
    });
  });

  it('should format dates correctly', async () => {
    renderWithProviders(<OrderTracking />);

    await waitFor(() => {
      // Check if the date is formatted and displayed
      expect(screen.getByText(/Order Date:/)).toBeInTheDocument();
    });
  });
});