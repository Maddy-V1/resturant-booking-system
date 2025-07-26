import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import axios from 'axios';
import OrderCart from '../components/menu/OrderCart';
import { AuthProvider } from '../context/AuthContext';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock useAuth hook
const mockUser = {
  name: 'John Doe',
  whatsapp: '+1234567890'
};

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser
    })
  };
});

describe('OrderCart', () => {
  const mockProps = {
    onUpdateItem: vi.fn(),
    onRemoveItem: vi.fn(),
    onClearCart: vi.fn(),
    onClose: vi.fn(),
    totalAmount: 450
  };

  const mockCart = [
    {
      _id: '1',
      name: 'Burger',
      description: 'Delicious beef burger',
      price: 150,
      quantity: 2,
      isDealOfDay: false
    },
    {
      _id: '2',
      name: 'Pizza',
      description: 'Cheesy pizza slice',
      price: 300,
      quantity: 1,
      isDealOfDay: true,
      dealPrice: 250
    }
  ];

  const renderOrderCart = (cart = mockCart, props = {}) => {
    return render(
      <OrderCart
        cart={cart}
        {...mockProps}
        {...props}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  it('renders empty cart message when cart is empty', () => {
    renderOrderCart([]);

    expect(screen.getByText('Your Cart')).toBeInTheDocument();
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
  });

  it('renders cart items with correct information', () => {
    renderOrderCart();

    expect(screen.getByText('Your Order')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('₹150.00')).toBeInTheDocument();
    expect(screen.getAllByText('₹250.00')).toHaveLength(2); // Unit price and total
    expect(screen.getByText('Deal!')).toBeInTheDocument();
  });

  it('displays correct total amount', () => {
    renderOrderCart();

    expect(screen.getByText('₹450.00')).toBeInTheDocument();
  });

  it('shows customer information', () => {
    renderOrderCart();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });

  it('handles quantity updates', () => {
    renderOrderCart();

    const incrementButtons = screen.getAllByText('+');
    const decrementButtons = screen.getAllByText('-');

    // Test increment for first item
    fireEvent.click(incrementButtons[0]);
    expect(mockProps.onUpdateItem).toHaveBeenCalledWith('1', 3);

    // Test decrement for first item
    fireEvent.click(decrementButtons[0]);
    expect(mockProps.onUpdateItem).toHaveBeenCalledWith('1', 1);
  });

  it('prevents quantity from going below 1', () => {
    const cartWithMinQuantity = [
      {
        _id: '1',
        name: 'Burger',
        description: 'Delicious beef burger',
        price: 150,
        quantity: 1,
        isDealOfDay: false
      }
    ];

    renderOrderCart(cartWithMinQuantity);

    const decrementButton = screen.getByText('-');
    fireEvent.click(decrementButton);

    // Should not call onUpdateItem with quantity 0
    expect(mockProps.onUpdateItem).not.toHaveBeenCalled();
  });

  it('handles item removal', () => {
    renderOrderCart();

    const removeButtons = screen.getAllByTitle('Remove item');
    fireEvent.click(removeButtons[0]);

    expect(mockProps.onRemoveItem).toHaveBeenCalledWith('1');
  });

  it('handles payment method selection', () => {
    renderOrderCart();

    const offlineRadio = screen.getByDisplayValue('offline');
    fireEvent.click(offlineRadio);

    expect(offlineRadio).toBeChecked();
  });

  it('places order successfully with online payment', async () => {
    const mockOrderResponse = {
      data: {
        data: {
          _id: 'order123',
          orderNumber: 'ORD001'
        }
      }
    };

    mockedAxios.post.mockResolvedValueOnce(mockOrderResponse);

    renderOrderCart();

    const placeOrderButton = screen.getByText(/Place Order/);
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/orders', {
        items: [
          {
            itemId: '1',
            name: 'Burger',
            price: 150,
            quantity: 2
          },
          {
            itemId: '2',
            name: 'Pizza',
            price: 250,
            quantity: 1
          }
        ],
        paymentMethod: 'online',
        totalAmount: 450
      });
      expect(mockProps.onClearCart).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
      expect(mockLocation.href).toBe('/order/order123');
    });
  });

  it('places order successfully with offline payment', async () => {
    const mockOrderResponse = {
      data: {
        data: {
          _id: 'order123',
          orderNumber: 'ORD001'
        }
      }
    };

    mockedAxios.post.mockResolvedValueOnce(mockOrderResponse);

    renderOrderCart();

    // Select offline payment
    const offlineRadio = screen.getByDisplayValue('offline');
    fireEvent.click(offlineRadio);

    const placeOrderButton = screen.getByText(/Place Order/);
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/orders', {
        items: [
          {
            itemId: '1',
            name: 'Burger',
            price: 150,
            quantity: 2
          },
          {
            itemId: '2',
            name: 'Pizza',
            price: 250,
            quantity: 1
          }
        ],
        paymentMethod: 'offline',
        totalAmount: 450
      });
    });
  });

  it('handles order placement error', async () => {
    const errorMessage = 'Failed to place order';
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: {
            message: errorMessage
          }
        }
      }
    });

    renderOrderCart();

    const placeOrderButton = screen.getByText(/Place Order/);
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Should not clear cart or close modal on error
    expect(mockProps.onClearCart).not.toHaveBeenCalled();
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('shows loading state while placing order', async () => {
    mockedAxios.post.mockImplementation(() => new Promise(() => {}));

    renderOrderCart();

    const placeOrderButton = screen.getByText(/Place Order/);
    fireEvent.click(placeOrderButton);

    expect(screen.getByText('Placing Order...')).toBeInTheDocument();
    expect(screen.getByText('Placing Order...')).toBeDisabled();
  });

  it('handles clear cart action', () => {
    renderOrderCart();

    const clearCartButton = screen.getByText('Clear Cart');
    fireEvent.click(clearCartButton);

    expect(mockProps.onClearCart).toHaveBeenCalled();
  });

  it('closes modal when close button is clicked', () => {
    renderOrderCart();

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('closes modal when continue shopping is clicked (empty cart)', () => {
    renderOrderCart([]);

    const continueButton = screen.getByText('Continue Shopping');
    fireEvent.click(continueButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calculates item totals correctly', () => {
    renderOrderCart();

    // Burger: 150 * 2 = 300
    expect(screen.getByText('₹300.00')).toBeInTheDocument();
    
    // Pizza (deal): 250 * 1 = 250 (appears twice - unit price and total)
    expect(screen.getAllByText('₹250.00')).toHaveLength(2);
  });

  it('disables place order button when cart is empty', () => {
    renderOrderCart([]);

    // Empty cart should not have place order button
    expect(screen.queryByText(/Place Order/)).not.toBeInTheDocument();
  });

  it('uses deal price for deal items in order calculation', async () => {
    const mockOrderResponse = {
      data: {
        data: {
          _id: 'order123'
        }
      }
    };

    mockedAxios.post.mockResolvedValueOnce(mockOrderResponse);

    renderOrderCart();

    const placeOrderButton = screen.getByText(/Place Order/);
    fireEvent.click(placeOrderButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/orders', 
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              itemId: '2',
              name: 'Pizza',
              price: 250, // Should use deal price, not regular price
              quantity: 1
            })
          ])
        })
      );
    });
  });
});