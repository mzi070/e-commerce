import React, { createContext, useState, useEffect } from 'react';

const WishlistContext = createContext();
export { WishlistContext };

const WISHLIST_KEY = 'ecommerce_wishlist';

const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); } catch { /* storage unavailable */ }
  }, [wishlist]);

  // Clear wishlist when user logs out
  useEffect(() => {
    const handler = () => setWishlist([]);
    window.addEventListener('user:logout', handler);
    return () => window.removeEventListener('user:logout', handler);
  }, []);

  const addToWishlist = (product) => {
    setWishlist(prev => {
      if (prev.some(p => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(p => p.id !== productId));
  };

  const toggleWishlist = (product) => {
    if (wishlist.some(p => p.id === product.id)) {
      removeFromWishlist(product.id);
      return false;
    } else {
      addToWishlist(product);
      return true;
    }
  };

  const isInWishlist = (productId) => wishlist.some(p => p.id === productId);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;
