import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MenuItemForm from '../components/menu/MenuItemForm';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock environment variable
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:5000'
  }
}));

describe('MenuItemForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const mockItem = {
    _id: '1',
    name: 'Test Burger',
    description: 'A delicious test burger',
    price: 150,
    available: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render form for adding new item', () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByText('Add New Menu Item')).toBeInTheDocument();
    expect(screen.getByLabelText(/item name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/available for ordering/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
  });

  it('should render form for editing existing item', () => {
    render(<MenuItemForm item={mockItem} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    expect(screen.getByText('Edit Menu Item')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Burger')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A delicious test burger')).toBeInTheDocument();
    expect(screen.getByDisplayValue('150')).toBeInTheDocument();
    expect(screen.getByLabelText(/available for ordering/i)).toBeChecked();
    expect(screen.getByRole('button', { name: /update item/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const submitButton = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Item name is required')).toBeInTheDocument();
    });

    // Fill name but leave description empty
    fireEvent.change(screen.getByLabelText(/item name/i), {
      target: { value: 'Test Item' }
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    // Fill description but leave price empty
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test description' }
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Valid price is required')).toBeInTheDocument();
    });
  });

  it('should validate price field', async () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/item name/i), {
      target: { value: 'Test Item' }
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test description' }
    });

    // Test invalid price
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '-10' }
    });

    const submitButton = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Valid price is required')).toBeInTheDocument();
    });

    // Test non-numeric price
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: 'abc' }
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Valid price is required')).toBeInTheDocument();
    });
  });

  it('should create new menu item successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: { _id: 'new-item-id' }
      }
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/item name/i), {
      target: { value: 'New Burger' }
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A new delicious burger' }
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '200' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/menu',
        {
          name: 'New Burger',
          description: 'A new delicious burger',
          price: 200,
          available: true
        }
      );
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should update existing menu item successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: mockItem
      }
    };

    mockedAxios.put.mockResolvedValue(mockResponse);

    render(<MenuItemForm item={mockItem} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Update form
    fireEvent.change(screen.getByLabelText(/item name/i), {
      target: { value: 'Updated Burger' }
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '180' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /update item/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/menu/1',
        {
          name: 'Updated Burger',
          description: 'A delicious test burger',
          price: 180,
          available: true
        }
      );
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('should handle availability toggle', async () => {
    render(<MenuItemForm item={mockItem} onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const availabilityCheckbox = screen.getByLabelText(/available for ordering/i);
    expect(availabilityCheckbox).toBeChecked();

    // Toggle availability
    fireEvent.click(availabilityCheckbox);
    expect(availabilityCheckbox).not.toBeChecked();
  });

  it('should handle API errors gracefully', async () => {
    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Item name already exists'
          }
        }
      }
    };

    mockedAxios.post.mockRejectedValue(errorResponse);

    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/item name/i), {
      target: { value: 'Duplicate Item' }
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test description' }
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '100' }
    });

    const submitButton = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Item name already exists')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('should show loading state during submission', async () => {
    // Mock a delayed response
    mockedAxios.post.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
    );

    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/item name/i), {
      target: { value: 'Test Item' }
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Test description' }
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '100' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
    expect(submitButton).toBeDisabled();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should call onCancel when close button is clicked', () => {
    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const closeButton = screen.getByRole('button', { name: '' }); // SVG close button
    fireEvent.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should trim whitespace from form inputs', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: { _id: 'new-item-id' }
      }
    };

    mockedAxios.post.mockResolvedValue(mockResponse);

    render(<MenuItemForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    // Fill form with whitespace
    fireEvent.change(screen.getByLabelText(/item name/i), {
      target: { value: '  Spaced Item  ' }
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: '  Spaced description  ' }
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '100' }
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/menu',
        {
          name: 'Spaced Item',
          description: 'Spaced description',
          price: 100,
          available: true
        }
      );
    });
  });
});