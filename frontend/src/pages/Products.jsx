import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { fetchProducts } from '../services/api';
import { toast } from 'sonner';

const StarMini = ({ value }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s} className={`w-3 h-3 ${s <= value ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const HeartIcon = ({ filled }) => (
  <svg className="w-5 h-5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const Products = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('cat') || 'all');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'default');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [priceRange, setPriceRange] = useState(() => ({ min: searchParams.get('minPrice') || '', max: searchParams.get('maxPrice') || '' }));
  const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Sync filter state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('cat', selectedCategory);
    if (sortBy !== 'default') params.set('sort', sortBy);
    if (priceRange.min) params.set('minPrice', priceRange.min);
    if (priceRange.max) params.set('maxPrice', priceRange.max);
    if (currentPage > 1) params.set('page', String(currentPage));
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, sortBy, priceRange, currentPage]);

  useEffect(() => {
    let result = [...products];

    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const min = priceRange.min !== '' ? parseFloat(priceRange.min) : null;
    const max = priceRange.max !== '' ? parseFloat(priceRange.max) : null;
    if (min !== null) result = result.filter(p => p.price >= min);
    if (max !== null) result = result.filter(p => p.price <= max);

    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rating': result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0)); break;
      default: break;
    }

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, selectedCategory, sortBy, searchQuery, priceRange]);

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = (product) => {
    const added = toggleWishlist(product);
    if (added) {
      toast.success(`${product.name} added to wishlist`);
    } else {
      toast.info(`${product.name} removed from wishlist`);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('default');
    setPriceRange({ min: '', max: '' });
  };

  const hasActiveFilters = selectedCategory !== 'all' || searchQuery || sortBy !== 'default' || priceRange.min || priceRange.max;

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const pageProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Our Products</h1>
          <p className="text-gray-600">Explore our complete collection of quality products</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  min="0"
                  onChange={(e) => setPriceRange(p => ({ ...p, min: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <span className="text-gray-400 text-sm flex-shrink-0">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  min="0"
                  onChange={(e) => setPriceRange(p => ({ ...p, max: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="flex justify-between mt-4">
                    <div className="h-6 bg-gray-200 rounded w-1/4" />
                    <div className="h-8 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
            <button onClick={clearFilters} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pageProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col">
                <Link to={`/products/${product.id}`} className="block relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-56 object-cover hover:scale-105 transition-transform duration-300"
                  />
                  {product.featured && (
                    <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); handleToggleWishlist(product); }}
                    className={`absolute top-2 right-2 p-1.5 rounded-full shadow transition-colors ${
                      isInWishlist(product.id) ? 'bg-red-50 text-red-500 hover:text-red-600' : 'bg-white text-gray-400 hover:text-red-500'
                    }`}
                    aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <HeartIcon filled={isInWishlist(product.id)} />
                  </button>
                </Link>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <span className="text-xs text-primary-600 font-semibold uppercase">{product.category}</span>
                    <Link to={`/products/${product.id}`}>
                      <h3 className="text-base font-semibold text-gray-900 my-1 hover:text-primary-600 transition-colors line-clamp-2">{product.name}</h3>
                    </Link>
                    {product.avgRating > 0 && (
                      <div className="flex items-center gap-1 mb-1">
                        <StarMini value={Math.round(product.avgRating)} />
                        <span className="text-xs text-gray-500">{product.avgRating.toFixed(1)} ({product.reviewCount})</span>
                      </div>
                    )}
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xl font-bold text-primary-600">${product.price.toFixed(2)}</span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {product.stock === 0 ? 'Sold Out' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '…' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-10 h-10 text-sm font-semibold rounded-lg border transition-colors ${
                      p === currentPage
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )
            }
            <button
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
