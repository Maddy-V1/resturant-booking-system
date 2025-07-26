import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SocketProvider, useSocket } from '../context/SocketContext';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn()
}));

// Test component to use the socket context
const TestComponent = () => {
  const { socket, isConnected, error, joinOrderRoom, leaveOrderRoom } = useSocket();
  
  return (
    <div>
      <div data-testid="connection-status">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => joinOrderRoom('test-order-123')} data-testid="join-room">
        Join Room
      </button>
      <button onClick={() => leaveOrderRoom('test-order-123')} data-testid="leave-room">
        Leave Room
      </button>
    </div>
  );
};

describe('SocketContext', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      id: 'test-socket-id',
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn()
    };
    
    io.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize socket connection on mount', () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    expect(io).toHaveBeenCalledWith('http://localhost:5001', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
  });

  it('should update connection status when socket connects', async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Simulate socket connection
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    
    act(() => {
      connectHandler();
    });

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('connected');
    });
  });

  it('should update connection status when socket disconnects', async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // First connect
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    act(() => {
      connectHandler();
    });

    // Then disconnect
    const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
    act(() => {
      disconnectHandler('transport close');
    });

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
    });
  });

  it('should handle connection errors', async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1];
    
    act(() => {
      errorHandler(new Error('Connection failed'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Connection failed');
      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected');
    });
  });

  it('should join order room when connected', async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Connect first
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    act(() => {
      connectHandler();
    });

    // Join room
    const joinButton = screen.getByTestId('join-room');
    act(() => {
      joinButton.click();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('join-order-room', 'test-order-123');
  });

  it('should leave order room when requested', async () => {
    render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    // Connect first
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
    act(() => {
      connectHandler();
    });

    // Leave room
    const leaveButton = screen.getByTestId('leave-room');
    act(() => {
      leaveButton.click();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('leave-order-room', 'test-order-123');
  });

  it('should cleanup socket on unmount', () => {
    const { unmount } = render(
      <SocketProvider>
        <TestComponent />
      </SocketProvider>
    );

    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('should throw error when useSocket is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSocket must be used within a SocketProvider');
    
    consoleSpy.mockRestore();
  });
});