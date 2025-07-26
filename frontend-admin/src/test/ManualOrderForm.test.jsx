import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import ManualOrderForm from '../components/orders/ManualOrderForm';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock environment variable
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:5000'
  }
}));

describe('ManualOrderForm', () => {
  const mockMenuItems = [
    {
      _id: '1',
      name: 'Burger',
      description: 'Delicious beef burger',
      price: 150,
      available: true,
      isDealOfDay: false
    },
    {
      _id: '2',
      name: 'Pizza',
      description: 'Cheese pizza',
      price: 200,
      available: true,
      isDealOfDay: true,
      dealPrice: 180
    },
    {
      _id: '3',
      name: 'Sandwich',
      description: 'Club sandwich',
      price: 100,
      available: false,
      isDealOfDay: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful menu fetch by default
    mockedAxios.get.mockResolvedValue({
      data: { data: mockMenuItems }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form with all required fields', async () => {
    render(<ManualOrderForm />);

    // Wait for menu items to load
    await waitFor(() => {
      expect(screen.getByText('Create Manual Order')).toBeInTheDocument();
    });

    // Check customer info fields
    expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/whatsapp number/i)).toBeInTheDocument();

    // Check payment method options
    expect(screen.getByLabelText(/cash payment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/online payment/i)).toBeInTheDocument();

    // Check submit button
    expect(screen.getByRole('button', { name: /create order/i })).toBeInTheDocument();
  });

  it('should fetch and display available menu items', async () => {
    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/menu');
    });

    // Wait for menu items to load
    await waitFor(() => {
      expect(screen.getByText('Select Menu Items')).toBeInTheDocument();
    });

    // Should display available items
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    
    // Should not display unavailable items
    expect(screen.queryByText('Sandwich')).not.toBeInTheDocument();
  });

  it('should display deal pricing correctly', async () => {
    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Pizza')).toBeInTheDocument();
    });

    // Check deal pricing display
    expect(screen.getByText('₹180')).toBeInTheDocument(); // Deal price
    expect(screen.getByText('₹200')).toBeInTheDocument(); // Original price (crossed out)
    expect(screen.getByText('Deal!')).toBeInTheDocument(); // Deal badge
  });

  it('should add items to order when Add button is clicked', async () => {
    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Add burger to order
    const addButton = screen.getAllByText('Add')[0];
    fireEvent.click(addButton);

    // Should show order summary
    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('₹150 each')).toBeInTheDocument();
    });
    
    // Check that burger appears in order summary (there will be multiple "Burger" texts)
    const burgerElements = screen.getAllByText('Burger');
    expect(burgerElements.length).toBeGreaterThan(1); // One in menu, one in order summary
  });

  it('should update item quantities correctly', async () => {
    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Add burger to order
    const addButton = screen.getAllByText('Add')[0];
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });

    // Increase quantity
    const plusButton = screen.getByText('+');
    fireEvent.click(plusButton);

    // Check quantity updated
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('₹300')).toBeInTheDocument(); // 150 * 2
  });

  it('should remove items from order', async () => {
    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Add burger to order
    const addButton = screen.getAllByText('Add')[0];
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });

    // Remove item
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    // Order summary should be gone
    expect(screen.queryByText('Order Summary')).not.toBeInTheDocument();
  });

  it('should calculate total correctly', async () => {
    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Add burger (₹150)
    const burgerAddButton = screen.getAllByText('Add')[0];
    fireEvent.click(burgerAddButton);

    // Add pizza (₹180 - deal price)
    const pizzaAddButton = screen.getAllByText('Add')[1];
    fireEvent.click(pizzaAddButton);

    await waitFor(() => {
      expect(screen.getByText('Total: ₹330')).toBeInTheDocument(); // 150 + 180
    });
  });

  it('should validate required fields before submission', async () => {
    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Try to submit without customer info
    const submitButton = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Customer name is required')).toBeInTheDocument();
    });
  });

  it('should validate items are selected before submission', async () => {
    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Fill customer info but no items
    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), {
      target: { value: '1234567890' }
    });

    const submitButton = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please add at least one item to the order')).toBeInTheDocument();
    });
  });

  it('should submit order successfully', async () => {
    const mockOrderResponse = {
      data: {
        success: true,
        data: {
          orderNumber: 'ORD-001',
          _id: 'order123'
        }
      }
    };

    mockedAxios.post.mockResolvedValue(mockOrderResponse);

    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), {
      target: { value: '1234567890' }
    });

    // Add item
    const addButton = screen.getAllByText('Add')[0];
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/staff/manual-order',
        {
          customerName: 'John Doe',
          customerWhatsapp: '1234567890',
          items: [{ itemId: '1', quantity: 1 }],
          paymentMethod: 'offline'
        }
      );
    });

    // Check success message
    await waitFor(() => {
      expect(screen.getByText(/order created successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/ORD-001/)).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Menu item not found'
          }
        }
      }
    };

    mockedAxios.post.mockRejectedValue(errorResponse);

    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Fill form and submit
    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), {
      target: { value: '1234567890' }
    });

    const addButton = screen.getAllByText('Add')[0];
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Menu item not found')).toBeInTheDocument();
    });
  });

  it('should clear form when Clear Form button is clicked', async () => {
    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), {
      target: { value: '1234567890' }
    });

    // Add item
    const addButton = screen.getAllByText('Add')[0];
    fireEvent.click(addButton);

    // Select online payment
    fireEvent.click(screen.getByLabelText(/online payment/i));

    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });

    // Clear form
    const clearButton = screen.getByRole('button', { name: /clear form/i });
    fireEvent.click(clearButton);

    // Check form is cleared
    expect(screen.getByLabelText(/customer name/i)).toHaveValue('');
    expect(screen.getByLabelText(/whatsapp number/i)).toHaveValue('');
    expect(screen.getByLabelText(/cash payment/i)).toBeChecked();
    expect(screen.queryByText('Order Summary')).not.toBeInTheDocument();
  });

  it('should handle menu loading error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load menu items')).toBeInTheDocument();
    });
  });

  it('should show loading state during form submission', async () => {
    // Mock a delayed response
    mockedAxios.post.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { success: true, data: { orderNumber: 'ORD-001' } } }), 100))
    );

    render(<ManualOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/whatsapp number/i), {
      target: { value: '1234567890' }
    });

    // Add item
    const addButton = screen.getAllByText('Add')[0];
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Order Summary')).toBeInTheDocument();
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create order/i });
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Creating Order...')).toBeInTheDocument();
    });
    expect(submitButton).toBeDisabled();
  });
});