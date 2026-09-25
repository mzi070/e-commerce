import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { toast } from 'sonner';

const StarMini = ({ value }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s} className={`w-3 h-3 ${s <= value ? 'text-primary-500' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    const added = toggleWishlist(product);
    if (added) toast.success(`${product.name} added to wishlist`);
    else toast.info(`${product.name} removed from wishlist`);
  };

  const wishlisted = isInWishlist(product.id);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col border border-stone-100">
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden">
        <div className="aspect-[4/3] overflow-hidden bg-stone-50">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
        {product.featured && (
          <span className="absolute top-3 left-3 bg-primary-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            Featured
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full">Sold Out</span>
          </div>
        )}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-all ${
            wishlisted
              ? 'bg-red-50 text-red-500'
              : 'bg-white text-stone-400 hover:text-red-400'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </Link>

      <div className="p-4 flex-1 flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-primary-600 uppercase tracking-wide">{product.category}</span>
        <Link to={`/products/${product.id}`}>
          <h3 className="text-sm font-semibold text-slate-900 hover:text-primary-600 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </Link>
        {product.avgRating > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <StarMini value={Math.round(product.avgRating)} />
            <span className="text-xs text-stone-400">{product.avgRating.toFixed(1)} ({product.reviewCount})</span>
          </div>
        )}
        <p className="text-stone-500 text-xs mt-1 line-clamp-2 leading-relaxed flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
          <span className="text-lg font-bold text-slate-900 font-variant-numeric tabular-nums">${product.price.toFixed(2)}</span>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors font-semibold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {product.stock === 0 ? 'Sold Out' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
