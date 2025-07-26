import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import axios from 'axios';
import MenuList from '../components/menu/MenuList';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock child components
vi.mock('../components/menu/MenuItem', () => ({
  default: ({ item, onAddToCart }) => (
    <div data-testid={`menu-item-${item._id}`}>
      <h3>{item.name}</h3>
      <p>{item.description}</p>
      <span>₹{item.price}</span>
      <button onClick={() => onAddToCart(item, 1)}>Add to Cart</button>
    </div>
  )
}));

vi.mock('../components/menu/OrderCart', () => ({
  default: ({ cart, onClose, totalAmount }) => (
    <div data-testid="order-cart">
      <h2>Order Cart</h2>
      <p>Items: {cart.length}</p>
      <p>Total: ₹{totalAmount}</p>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

describe('MenuList', () => {
  const mockMenuItems = [
    {
      _id: '1',
      name: 'Burger',
      description: 'Delicious burger',
      price: 150,
      available: true,
      isDealOfDay: false
    },
    {
      _id: '2',
      name: 'Pizza',
      description: 'Cheesy pizza',
      price: 300,
      available: true,
      isDealOfDay: true,
      dealPrice: 250
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));
    
    render(<MenuList />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('fetches and displays menu items', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: mockMenuItems }
    });

    render(<MenuList />);

    await waitFor(() => {
      expect(screen.getByText('Menu')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-2')).toBeInTheDocument();
    });

    expect(mockedAxios.get).toHaveBeenCalledWith('/api/menu');
  });

  it('displays error message when fetch fails', async () => {
    const errorMessage = 'Failed to load menu items';
    mockedAxios.get.mockRejectedValueOnce({
      response: { data: { error: { message: errorMessage } } }
    });

    render(<MenuList />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('displays empty state when no menu items', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: [] }
    });

    render(<MenuList />);

    await waitFor(() => {
      expect(screen.getByText('No menu items available at the moment.')).toBeInTheDocument();
    });
  });

  it('adds items to cart and shows cart button', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: mockMenuItems }
    });

    render(<MenuList />);

    await waitFor(() => {
      expect(screen.getByTestId('menu-item-1')).toBeInTheDocument();
    });

    // Add item to cart
    const addToCartButton = screen.getAllByText('Add to Cart')[0];
    fireEvent.click(addToCartButton);

    // Cart button should appear
    await waitFor(() => {
      expect(screen.getByText(/View Cart \(1\)/)).toBeInTheDocument();
    });
  });

  it('opens cart modal when cart button is clicked', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: mockMenuItems }
    });

    render(<MenuList />);

    await waitFor(() => {
      expect(screen.getByTestId('menu-item-1')).toBeInTheDocument();
    });

    // Add item to cart
    const addToCartButton = screen.getAllByText('Add to Cart')[0];
    fireEvent.click(addToCartButton);

    // Click cart button
    await waitFor(() => {
      const cartButton = screen.getByText(/View Cart \(1\)/);
      fireEvent.click(cartButton);
    });

    // Cart modal should be visible
    expect(screen.getByTestId('order-cart')).toBeInTheDocument();
  });

  it('handles adding multiple quantities of same item', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: mockMenuItems }
    });

    render(<MenuList />);

    await waitFor(() => {
      expect(screen.getByTestId('menu-item-1')).toBeInTheDocument();
    });

    // Add same item multiple times
    const addToCartButton = screen.getAllByText('Add to Cart')[0];
    fireEvent.click(addToCartButton);
    fireEvent.click(addToCartButton);

    // Cart should show 2 items
    await waitFor(() => {
      expect(screen.getByText(/View Cart \(2\)/)).toBeInTheDocument();
    });
  });

  it('retries fetching menu items when try again is clicked', async () => {
    // First call fails
    mockedAxios.get.mockRejectedValueOnce({
      response: { data: { error: { message: 'Network error' } } }
    });

    render(<MenuList />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Clear previous mock and set up success response
    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: mockMenuItems }
    });

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    // Just verify the API was called again
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/menu');
  });
});