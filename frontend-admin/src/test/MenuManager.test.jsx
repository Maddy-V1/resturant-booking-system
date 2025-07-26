import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MenuManager from '../components/menu/MenuManager';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock environment variable
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:5000'
  }
}));

// Mock child components
vi.mock('../components/menu/MenuItemForm', () => ({
  default: ({ item, onSuccess, onCancel }) => (
    <div data-testid="menu-item-form">
      <p>MenuItemForm</p>
      <p>{item ? `Editing: ${item.name}` : 'Adding new item'}</p>
      <button onClick={onSuccess}>Success</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

vi.mock('../components/menu/DealOfDaySelector', () => ({
  default: ({ menuItems, onSuccess, onCancel }) => (
    <div data-testid="deal-selector">
      <p>DealOfDaySelector</p>
      <p>Items: {menuItems.length}</p>
      <button onClick={onSuccess}>Success</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

describe('MenuManager', () => {
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

  it('should render menu manager with header and controls', async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
    });

    expect(screen.getByText('Manage your menu items and daily deals')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage deals/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add new item/i })).toBeInTheDocument();
  });

  it('should fetch and display menu items', async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/api/menu');
    });

    await waitFor(() => {
      expect(screen.getByText('Menu Items (3)')).toBeInTheDocument();
    });

    // Check that items are displayed
    expect(screen.getByText('Burger')).toBeInTheDocument();
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Sandwich')).toBeInTheDocument();
  });

  it('should display item details correctly', async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Check burger details
    expect(screen.getByText('Delicious beef burger')).toBeInTheDocument();
    expect(screen.getByText('₹150')).toBeInTheDocument();
    expect(screen.getAllByText('Available')).toHaveLength(2); // Burger and Pizza are available

    // Check pizza details (deal item)
    expect(screen.getByText('Cheese pizza')).toBeInTheDocument();
    expect(screen.getByText('₹180')).toBeInTheDocument(); // Deal price
    expect(screen.getByText('₹200')).toBeInTheDocument(); // Original price
    expect(screen.getByText('Deal!')).toBeInTheDocument();

    // Check sandwich details (unavailable)
    expect(screen.getByText('Club sandwich')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('should show add form when Add New Item is clicked', async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add new item/i });
    fireEvent.click(addButton);

    expect(screen.getByTestId('menu-item-form')).toBeInTheDocument();
    expect(screen.getByText('Adding new item')).toBeInTheDocument();
  });

  it('should show edit form when Edit button is clicked', async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Click edit for first item (Burger)

    expect(screen.getByTestId('menu-item-form')).toBeInTheDocument();
    expect(screen.getByText('Editing: Burger')).toBeInTheDocument();
  });

  it('should show deal selector when Manage Deals is clicked', async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
    });

    const manageDealsButton = screen.getByRole('button', { name: /manage deals/i });
    fireEvent.click(manageDealsButton);

    expect(screen.getByTestId('deal-selector')).toBeInTheDocument();
    expect(screen.getByText('Items: 3')).toBeInTheDocument();
  });

  it('should toggle item availability', async () => {
    mockedAxios.put.mockResolvedValue({ data: { success: true } });

    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    // Find pause button for available item (Burger)
    const pauseButtons = screen.getAllByText('Pause');
    fireEvent.click(pauseButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('http://localhost:5000/api/menu/1/toggle');
    });

    // Should refetch menu items
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial fetch + refetch after toggle
    });
  });

  it('should delete item with confirmation', async () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    mockedAxios.delete.mockResolvedValue({ data: { success: true } });

    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this menu item?');

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith('http://localhost:5000/api/menu/1');
    });

    // Should refetch menu items
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    // Restore window.confirm
    window.confirm = originalConfirm;
  });

  it('should not delete item if confirmation is cancelled', async () => {
    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => false);

    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockedAxios.delete).not.toHaveBeenCalled();

    // Restore window.confirm
    window.confirm = originalConfirm;
  });

  it('should handle form success and refresh data', async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
    });

    // Open add form
    const addButton = screen.getByRole('button', { name: /add new item/i });
    fireEvent.click(addButton);

    // Simulate form success
    const successButton = screen.getByText('Success');
    fireEvent.click(successButton);

    // Form should be closed and data refreshed
    expect(screen.queryByTestId('menu-item-form')).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('should handle form cancel', async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
    });

    // Open add form
    const addButton = screen.getByRole('button', { name: /add new item/i });
    fireEvent.click(addButton);

    // Simulate form cancel
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Form should be closed
    expect(screen.queryByTestId('menu-item-form')).not.toBeInTheDocument();
  });

  it('should handle deal selector success and refresh data', async () => {
    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
    });

    // Open deal selector
    const manageDealsButton = screen.getByRole('button', { name: /manage deals/i });
    fireEvent.click(manageDealsButton);

    // Simulate deal selector success
    const successButton = screen.getByText('Success');
    fireEvent.click(successButton);

    // Deal selector should be closed and data refreshed
    expect(screen.queryByTestId('deal-selector')).not.toBeInTheDocument();
    expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('should show empty state when no menu items exist', async () => {
    mockedAxios.get.mockResolvedValue({ data: { data: [] } });

    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Menu Items (0)')).toBeInTheDocument();
    });

    expect(screen.getByText('No menu items found. Add your first item to get started.')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load menu items')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    // Mock a delayed response
    mockedAxios.get.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: { data: mockMenuItems } }), 100))
    );

    render(<MenuManager />);

    // Should show loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should handle toggle availability errors', async () => {
    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Failed to update availability'
          }
        }
      }
    };

    mockedAxios.put.mockRejectedValue(errorResponse);

    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    const pauseButtons = screen.getAllByText('Pause');
    fireEvent.click(pauseButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to update item availability')).toBeInTheDocument();
    });
  });

  it('should handle delete errors', async () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    const errorResponse = {
      response: {
        data: {
          error: {
            message: 'Failed to delete item'
          }
        }
      }
    };

    mockedAxios.delete.mockRejectedValue(errorResponse);

    render(<MenuManager />);

    await waitFor(() => {
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Failed to delete menu item')).toBeInTheDocument();
    });

    // Restore window.confirm
    window.confirm = originalConfirm;
  });
});