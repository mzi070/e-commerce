import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { fetchProducts } from '../services/api';
import { toast } from 'sonner';

const StarMini = ({ value }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s} className={`w-3 h-3 ${s <= value ? 'text-primary-500' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const Home = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await fetchProducts();
        const featured = products.filter(p => p.featured);
        setFeaturedProducts(featured.length > 0 ? featured.slice(0, 4) : products.slice(0, 4));
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = (product) => {
    const added = toggleWishlist(product);
    if (added) toast.success(`${product.name} added to wishlist`);
    else toast.info(`${product.name} removed from wishlist`);
  };

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 lg:px-6 pt-16 pb-12 md:pt-24 md:pb-16">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-7 px-3.5 py-1.5 bg-primary-500/10 text-primary-400 rounded-full text-sm font-medium border border-primary-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse"></span>
            Free shipping on orders over $50
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-[1.04] tracking-tight mb-6 max-w-2xl">
            Shop&nbsp;Smarter.<br />
            <span className="text-primary-400">Live Better.</span>
          </h1>

          <p className="text-slate-300 text-lg md:text-xl mb-9 max-w-xl leading-relaxed">
            Quality products at prices that make sense. From electronics to everyday essentials — all in one place.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-7 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-500 transition-colors text-sm"
            >
              Shop Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-7 py-3 border border-slate-700 text-slate-300 font-medium rounded-xl hover:bg-slate-800 hover:text-white transition-colors text-sm"
            >
              Our Story
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-slate-800">
          <div className="container mx-auto px-4 lg:px-6 py-5">
            <div className="flex flex-wrap gap-8">
              {[
                { value: '2,000+', label: 'Products' },
                { value: '50K+', label: 'Happy customers' },
                { value: '4.9 ★', label: 'Avg. rating' },
                { value: '2–5 days', label: 'Delivery' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-xl font-bold text-white tabular-nums">{value}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Value props ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                title: 'Quality Guaranteed',
                desc: 'Every product is verified before it reaches our catalog. No exceptions.',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ),
                title: 'Best Prices',
                desc: 'We negotiate hard with suppliers so you always get the best possible deal.',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                ),
                title: 'Fast Shipping',
                desc: 'Quick delivery to your doorstep. Most orders arrive within 2–5 business days.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-6 rounded-2xl bg-stone-50 border border-stone-100">
                <div className="flex-shrink-0 w-11 h-11 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {icon}
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary-600 text-sm font-semibold uppercase tracking-widest mb-2">Handpicked for you</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                Featured Products
              </h2>
            </div>
            <Link to="/products" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-slate-900 transition-colors">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse border border-stone-100">
                  <div className="aspect-[4/3] bg-stone-100" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-2.5 bg-stone-100 rounded w-1/3" />
                    <div className="h-4 bg-stone-100 rounded w-3/4" />
                    <div className="h-3 bg-stone-100 rounded w-full" />
                    <div className="h-3 bg-stone-100 rounded w-2/3" />
                    <div className="flex justify-between mt-3 pt-3 border-t border-stone-100">
                      <div className="h-5 bg-stone-100 rounded w-1/4" />
                      <div className="h-7 bg-stone-100 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col border border-stone-100">
                  <Link to={`/products/${product.id}`} className="block relative overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden bg-stone-50">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); handleToggleWishlist(product); }}
                      className={`absolute top-3 right-3 p-2 rounded-full shadow-sm transition-all ${
                        isInWishlist(product.id) ? 'bg-red-50 text-red-500' : 'bg-white text-stone-400 hover:text-red-400'
                      }`}
                      aria-label="Toggle wishlist"
                    >
                      <svg className="w-4 h-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </Link>
                  <div className="p-4 flex-1 flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-primary-600 uppercase tracking-wide">{product.category}</span>
                    <Link to={`/products/${product.id}`}>
                      <h3 className="text-sm font-semibold text-slate-900 hover:text-primary-600 transition-colors line-clamp-1">{product.name}</h3>
                    </Link>
                    {product.avgRating > 0 && (
                      <div className="flex items-center gap-1.5">
                        <StarMini value={Math.round(product.avgRating)} />
                        <span className="text-xs text-stone-400">{product.avgRating.toFixed(1)}</span>
                      </div>
                    )}
                    <p className="text-stone-500 text-xs mt-0.5 line-clamp-2 leading-relaxed flex-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                      <span className="text-lg font-bold text-slate-900 tabular-nums">${product.price.toFixed(2)}</span>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors font-semibold text-xs flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm"
            >
              View All Products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 lg:px-6 text-center">
          <p className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-4">Ready to start?</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-5 max-w-xl mx-auto leading-tight">
            Thousands of products waiting for you
          </h2>
          <p className="text-slate-400 text-lg mb-9 max-w-lg mx-auto">
            Join over 50,000 happy customers and find exactly what you need.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-500 transition-colors"
          >
            Browse Products
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
