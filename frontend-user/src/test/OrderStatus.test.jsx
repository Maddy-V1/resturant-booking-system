import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OrderStatus from '../components/orders/OrderStatus';

describe('OrderStatus', () => {
  const defaultProps = {
    status: 'payment pending',
    paymentStatus: 'pending',
    paymentMethod: 'online'
  };

  it('should render order status component', () => {
    render(<OrderStatus {...defaultProps} />);
    
    expect(screen.getByText('Order Status')).toBeInTheDocument();
    expect(screen.getByText('Payment Pending')).toBeInTheDocument();
    expect(screen.getByText('Being Prepared')).toBeInTheDocument();
    expect(screen.getByText('Ready for Pickup')).toBeInTheDocument();
    expect(screen.getByText('Picked Up')).toBeInTheDocument();
  });

  it('should show correct status for payment pending', () => {
    render(<OrderStatus {...defaultProps} />);
    
    expect(screen.getByText('Waiting for payment confirmation')).toBeInTheDocument();
  });

  it('should show offline payment message for cash orders', () => {
    render(
      <OrderStatus 
        {...defaultProps} 
        paymentMethod="offline"
      />
    );
    
    expect(screen.getByText('Please pay at the counter to confirm your order')).toBeInTheDocument();
  });

  it('should show preparing status correctly', () => {
    render(
      <OrderStatus 
        {...defaultProps} 
        status="preparing"
        paymentStatus="confirmed"
      />
    );
    
    expect(screen.getByText('Your order is being prepared')).toBeInTheDocument();
  });

  it('should show ready status correctly', () => {
    render(
      <OrderStatus 
        {...defaultProps} 
        status="ready"
        paymentStatus="confirmed"
      />
    );
    
    expect(screen.getByText('Your order is ready for pickup!')).toBeInTheDocument();
    expect(screen.getByText('Please collect your order from the counter')).toBeInTheDocument();
  });

  it('should show picked up status correctly', () => {
    render(
      <OrderStatus 
        {...defaultProps} 
        status="picked_up"
        paymentStatus="confirmed"
      />
    );
    
    expect(screen.getByText('Order completed. Thank you!')).toBeInTheDocument();
  });

  it('should highlight active steps correctly', () => {
    const { container } = render(
      <OrderStatus 
        {...defaultProps} 
        status="preparing"
        paymentStatus="confirmed"
      />
    );
    
    // Payment pending and preparing should be active (green/blue)
    // Note: There are also progress lines and other elements with these classes
    const activeSteps = container.querySelectorAll('.bg-green-600, .bg-blue-600');
    expect(activeSteps.length).toBeGreaterThan(1); // At least payment pending + preparing steps
  });

  it('should show payment required badge for offline pending payments', () => {
    render(
      <OrderStatus 
        {...defaultProps} 
        paymentMethod="offline"
        paymentStatus="pending"
      />
    );
    
    expect(screen.getByText('Payment Required')).toBeInTheDocument();
  });

  it('should show real-time indicator', () => {
    render(<OrderStatus {...defaultProps} />);
    
    expect(screen.getByText('Updates in real-time')).toBeInTheDocument();
  });

  it('should apply correct styling for current step', () => {
    const { container } = render(
      <OrderStatus 
        {...defaultProps} 
        status="ready"
        paymentStatus="confirmed"
      />
    );
    
    // The "ready" step should have animate-pulse class
    const currentStep = container.querySelector('.animate-pulse');
    expect(currentStep).toBeInTheDocument();
  });

  it('should show progress line between steps', () => {
    const { container } = render(
      <OrderStatus 
        {...defaultProps} 
        status="preparing"
        paymentStatus="confirmed"
      />
    );
    
    // Should have progress lines (hidden on small screens)
    const progressLines = container.querySelectorAll('.bg-green-600');
    expect(progressLines.length).toBeGreaterThan(0);
  });
});