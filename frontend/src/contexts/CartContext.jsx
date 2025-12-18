import React, { createContext, useState, useEffect } from 'react';

const CartContext = createContext();

// Export context separately for the hook to use
export { CartContext };

// LocalStorage key
const CART_STORAGE_KEY = 'ecommerce_cart';

// Helper functions for localStorage
const saveToLocalStorage = (cart) => {
  try {
    const cartJSON = JSON.stringify(cart);
    localStorage.setItem(CART_STORAGE_KEY, cartJSON);
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const cartJSON = localStorage.getItem(CART_STORAGE_KEY);
    return cartJSON ? JSON.parse(cartJSON) : [];
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    return [];
  }
};

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    // Initialize cart from localStorage on first render
    return loadFromLocalStorage();
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    saveToLocalStorage(cart);
  }, [cart]);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;

