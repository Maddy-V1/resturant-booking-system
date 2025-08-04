import React, { useState, useEffect } from 'react';
import { cartStorage, localStorageUtils } from '../../utils/localStorage';

const LocalStorageTest = () => {
  const [testResults, setTestResults] = useState({});
  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    runTests();
    loadCartData();
  }, []);

  const runTests = () => {
    const results = {};
    
    // Test localStorage availability
    results.isAvailable = localStorageUtils.isAvailable();
    
    // Test basic operations
    const testKey = 'test_key';
    const testValue = { test: 'data', number: 123 };
    
    results.setTest = localStorageUtils.setItem(testKey, testValue);
    results.getTest = JSON.stringify(localStorageUtils.getItem(testKey)) === JSON.stringify(testValue);
    results.removeTest = localStorageUtils.removeItem(testKey);
    
    // Test cart operations
    const testCart = [{ id: 'test', name: 'Test Item', quantity: 1, price: 10 }];
    results.setCart = cartStorage.setCart(testCart);
    results.getCart = JSON.stringify(cartStorage.getCart()) === JSON.stringify(testCart);
    
    setTestResults(results);
  };

  const loadCartData = () => {
    const cart = cartStorage.getCart();
    setCartData(cart);
  };

  const addTestItem = () => {
    const newItem = {
      id: Date.now().toString(),
      name: `Test Item ${Date.now()}`,
      quantity: 1,
      price: Math.floor(Math.random() * 100) + 10
    };
    
    const currentCart = cartStorage.getCart();
    const updatedCart = [...currentCart, newItem];
    cartStorage.setCart(updatedCart);
    loadCartData();
  };

  const clearTestCart = () => {
    cartStorage.clearCart();
    loadCartData();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">localStorage Test Results</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
        <div className="space-y-1">
          {Object.entries(testResults).map(([test, result]) => (
            <div key={test} className={`p-2 rounded ${result ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {test}: {result ? '✅ PASS' : '❌ FAIL'}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current Cart Data:</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(cartData, null, 2)}
        </pre>
      </div>

      <div className="space-x-2">
        <button
          onClick={addTestItem}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Test Item
        </button>
        <button
          onClick={clearTestCart}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Cart
        </button>
        <button
          onClick={() => { runTests(); loadCartData(); }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Refresh Tests
        </button>
      </div>
    </div>
  );
};

export default LocalStorageTest;