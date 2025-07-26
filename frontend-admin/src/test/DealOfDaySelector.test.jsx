import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import DealOfDaySelector from '../components/menu/DealOfDaySelector';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock environment variable
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:5000'
  }
}));

describe('DealOfDaySelector', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render deal selector with available items', () => {
    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByText('Manage Deal of the Day')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    
    // Should not show unavailable items
    expect(screen.queryByText('Sandwich')).not.toBeInTheDocument();
  });

  it('should initialize with current deal items selected', () => {
    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Pizza should be checked as it's currently a deal
    const pizzaCheckbox = screen.getByLabelText(/pizza/i);
    expect(pizzaCheckbox).toBeChecked();

    // Burger should not be checked
    const burgerCheckbox = screen.getByLabelText(/burger/i);
    expect(burgerCheckbox).not.toBeChecked();

    // Deal price should be pre-filled for Pizza
    expect(screen.getByDisplayValue('180')).toBeInTheDocument();
  });

  it('should toggle item selection', () => {
    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    const burgerCheckbox = screen.getByRole('checkbox', { name: /burger/i });
    
    // Initially not checked
    expect(burgerCheckbox).not.toBeChecked();
    expect(screen.queryByLabelText(/deal price.*burger/i)).not.toBeInTheDocument();

    // Check the item
    fireEvent.click(burgerCheckbox);
    expect(burgerCheckbox).toBeChecked();
    
    // Deal price input should appear
    expect(screen.getByLabelText(/deal price/i)).toBeInTheDocument();

    // Uncheck the item
    fireEvent.click(burgerCheckbox);
    expect(burgerCheckbox).not.toBeChecked();
  });

  it('should validate deal prices before submission', async () => {
    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Select burger but don't set deal price
    const burgerCheckbox = screen.getByLabelText(/burger/i);
    fireEvent.click(burgerCheckbox);

    const submitButton = screen.getByRole('button', { name: /update deals/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid deal price for burger/i)).toBeInTheDocument();
    });
  });

  it('should validate deal price is less than original price', async () => {
    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Select burger and set deal price higher than original
    const burgerCheckbox = screen.getByRole('checkbox', { name: /burger/i });
    fireEvent.click(burgerCheckbox);

    const dealPriceInput = screen.getByLabelText(/deal price/i);
    fireEvent.change(dealPriceInput, { target: { value: '200' } }); // Higher than ₹150

    const submitButton = screen.getByRole('button', { name: /update deals/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/deal price for burger must be less than the original price/i)).toBeInTheDocument();
    });
  });

  it('should update deals successfully', async () => {
    const mockResponses = mockMenuItems.map(item => ({
      data: { success: true, data: item }
    }));

    mockedAxios.put.mockImplementation(() => Promise.resolve(mockResponses[0]));

    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Select burger and set valid deal price
    const burgerCheckbox = screen.getByLabelText(/burger/i);
    fireEvent.click(burgerCheckbox);

    const dealPriceInput = screen.getByLabelText(/deal price/i);
    fireEvent.change(dealPriceInput, { target: { value: '120' } });

    const submitButton = screen.getByRole('button', { name: /update deals/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledTimes(3); // One call per menu item
    });

    // Check that burger is updated with deal
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/menu/1',
      expect.objectContaining({
        isDealOfDay: true,
        dealPrice: 120
      })
    );

    // Check that pizza deal is removed (since it wasn't selected in this test)
    expect(mockedAxios.put).toHaveBeenCalledWith(
      'http://localhost:5000/api/menu/2',
      expect.objectContaining({
        isDealOfDay: false,
        dealPrice: null
      })
    );

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Failed to update menu item'
          }
        }
      }
    };

    mockedAxios.put.mockRejectedValue(errorResponse);

    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Select burger and set valid deal price
    const burgerCheckbox = screen.getByLabelText(/burger/i);
    fireEvent.click(burgerCheckbox);

    const dealPriceInput = screen.getByLabelText(/deal price/i);
    fireEvent.change(dealPriceInput, { target: { value: '120' } });

    const submitButton = screen.getByRole('button', { name: /update deals/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to update menu item')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should show loading state during submission', async () => {
    // Mock a delayed response
    mockedAxios.put.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
    );

    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Select burger and set valid deal price
    const burgerCheckbox = screen.getByLabelText(/burger/i);
    fireEvent.click(burgerCheckbox);

    const dealPriceInput = screen.getByLabelText(/deal price/i);
    fireEvent.change(dealPriceInput, { target: { value: '120' } });

    const submitButton = screen.getByRole('button', { name: /update deals/i });
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });
    expect(submitButton).toBeDisabled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should call onCancel when close button is clicked', () => {
    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // SVG close button
    fireEvent.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show message when no available items exist', () => {
    const unavailableItems = mockMenuItems.map(item => ({ ...item, available: false }));

    render(
      <DealOfDaySelector 
        menuItems={unavailableItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByText('No available menu items to set as deals.')).toBeInTheDocument();
  });

  it('should handle deal price input changes', () => {
    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Select burger
    const burgerCheckbox = screen.getByLabelText(/burger/i);
    fireEvent.click(burgerCheckbox);

    // Change deal price
    const dealPriceInput = screen.getByLabelText(/deal price/i);
    fireEvent.change(dealPriceInput, { target: { value: '130' } });

    expect(dealPriceInput).toHaveValue(130);
  });

  it('should clear deal price when item is deselected', () => {
    render(
      <DealOfDaySelector 
        menuItems={mockMenuItems} 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );

    // Pizza is initially selected with deal price
    const pizzaCheckbox = screen.getByRole('checkbox', { name: /pizza/i });
    expect(pizzaCheckbox).toBeChecked();
    expect(screen.getByDisplayValue('180')).toBeInTheDocument();

    // Deselect pizza
    fireEvent.click(pizzaCheckbox);
    expect(pizzaCheckbox).not.toBeChecked();

    // Deal price input should be gone
    expect(screen.queryByDisplayValue('180')).not.toBeInTheDocument();
  });
});