import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { toast } from 'sonner';

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleRemove = (product) => {
    removeFromWishlist(product.id);
    toast.success(`${product.name} removed from wishlist`);
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-8">Save items you love by clicking the heart icon on any product.</p>
          <Link to="/products" className="inline-block px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <span className="text-gray-500 text-sm">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <Link to={`/products/${product.id}`} className="block relative">
                <img src={product.image} alt={product.name} className="w-full h-52 object-cover" />
                <button
                  onClick={(e) => { e.preventDefault(); handleRemove(product); }}
                  className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow text-red-500 hover:text-red-600 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </Link>
              <div className="p-4 flex-1 flex flex-col">
                <span className="text-xs text-primary-600 font-semibold uppercase mb-1">{product.category}</span>
                <Link to={`/products/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 hover:text-primary-600 transition-colors line-clamp-2">{product.name}</h3>
                </Link>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xl font-bold text-primary-600">${product.price?.toFixed(2)}</span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-semibold transition-colors"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
