import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import MenuItem from '../components/menu/MenuItem';

describe('MenuItem', () => {
  const mockOnAddToCart = vi.fn();

  const mockItem = {
    _id: '1',
    name: 'Burger',
    description: 'Delicious beef burger',
    price: 150,
    available: true,
    isDealOfDay: false
  };

  const mockDealItem = {
    _id: '2',
    name: 'Pizza',
    description: 'Cheesy pizza slice',
    price: 300,
    available: true,
    isDealOfDay: true,
    dealPrice: 250
  };

  const mockUnavailableItem = {
    _id: '3',
    name: 'Sandwich',
    description: 'Club sandwich',
    price: 120,
    available: false,
    isDealOfDay: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders menu item with basic information', () => {
    render(<MenuItem item={mockItem} onAddToCart={mockOnAddToCart} />);

    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Delicious beef burger')).toBeInTheDocument();
    expect(screen.getByText('₹150.00')).toBeInTheDocument();
    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  it('displays deal of the day badge and pricing for deal items', () => {
    render(<MenuItem item={mockDealItem} onAddToCart={mockOnAddToCart} />);

    expect(screen.getByText('Deal of the Day!')).toBeInTheDocument();
    expect(screen.getByText('₹250.00')).toBeInTheDocument();
    expect(screen.getByText('₹300.00')).toBeInTheDocument();
    expect(screen.getByText('Save ₹50.00')).toBeInTheDocument();
  });

  it('shows unavailable status for unavailable items', () => {
    render(<MenuItem item={mockUnavailableItem} onAddToCart={mockOnAddToCart} />);

    expect(screen.getAllByText('Currently Unavailable')).toHaveLength(2);
    expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument();
  });

  it('handles quantity increment and decrement', () => {
    render(<MenuItem item={mockItem} onAddToCart={mockOnAddToCart} />);

    const incrementButton = screen.getByText('+');
    const decrementButton = screen.getByText('-');
    const quantityDisplay = screen.getByText('1');

    // Test increment
    fireEvent.click(incrementButton);
    expect(screen.getByText('2')).toBeInTheDocument();

    fireEvent.click(incrementButton);
    expect(screen.getByText('3')).toBeInTheDocument();

    // Test decrement
    fireEvent.click(decrementButton);
    expect(screen.getByText('2')).toBeInTheDocument();

    fireEvent.click(decrementButton);
    expect(screen.getByText('1')).toBeInTheDocument();

    // Should not go below 1
    fireEvent.click(decrementButton);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onAddToCart with correct parameters when add to cart is clicked', async () => {
    render(<MenuItem item={mockItem} onAddToCart={mockOnAddToCart} />);

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockItem, 1);
  });

  it('calls onAddToCart with correct quantity when quantity is changed', async () => {
    render(<MenuItem item={mockItem} onAddToCart={mockOnAddToCart} />);

    // Increase quantity to 3
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith(mockItem, 3);
  });

  it('shows feedback when item is added to cart', async () => {
    render(<MenuItem item={mockItem} onAddToCart={mockOnAddToCart} />);

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    // Should show "Added!" feedback
    expect(screen.getByText('Added!')).toBeInTheDocument();

    // Should reset to "Add to Cart" after timeout
    await waitFor(() => {
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('resets quantity to 1 after adding to cart', async () => {
    render(<MenuItem item={mockItem} onAddToCart={mockOnAddToCart} />);

    // Increase quantity
    const incrementButton = screen.getByText('+');
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);
    expect(screen.getByText('3')).toBeInTheDocument();

    // Add to cart
    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    // Quantity should reset to 1 after timeout
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('disables add to cart button while adding', () => {
    render(<MenuItem item={mockItem} onAddToCart={mockOnAddToCart} />);

    const addToCartButton = screen.getByText('Add to Cart');
    fireEvent.click(addToCartButton);

    // Button should be disabled and show "Added!"
    const addedButton = screen.getByText('Added!');
    expect(addedButton).toBeDisabled();
  });

  it('does not render quantity controls for unavailable items', () => {
    render(<MenuItem item={mockUnavailableItem} onAddToCart={mockOnAddToCart} />);

    expect(screen.queryByText('Qty:')).not.toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
    expect(screen.queryByText('-')).not.toBeInTheDocument();
  });

  it('handles deal items without deal price gracefully', () => {
    const dealItemWithoutPrice = {
      ...mockItem,
      isDealOfDay: true
      // No dealPrice property
    };

    render(<MenuItem item={dealItemWithoutPrice} onAddToCart={mockOnAddToCart} />);

    // Should show regular price when deal price is not available
    expect(screen.getByText('₹150.00')).toBeInTheDocument();
    expect(screen.getByText('Deal of the Day!')).toBeInTheDocument();
  });
});