import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useWishlist } from '../hooks/useWishlist';
import { fetchProductById, fetchProducts, fetchProductReviews, createReview, deleteReview } from '../services/api';
import { toast } from 'sonner';

const StarRating = ({ value, max = 5, onChange, size = 'md' }) => {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  const stars = Array.from({ length: max }, (_, i) => i + 1);
  const display = hovered || value;

  if (!onChange) {
    return (
      <div className="flex items-center gap-0.5">
        {stars.map(s => (
          <svg key={s} className={`${sizeClass} ${s <= display ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars.map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <svg className={`${sizeClass} ${s <= display ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
            fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const RECENTLY_VIEWED_KEY = 'ecommerce_recently_viewed';

const getRecentlyViewed = () => {
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]'); } catch { return []; }
};

const pushRecentlyViewed = (product) => {
  try {
    const current = getRecentlyViewed();
    const filtered = current.filter(p => p.id !== product.id);
    const updated = [{ id: product.id, name: product.name, price: product.price, image: product.image, category: product.category, avgRating: product.avgRating, reviewCount: product.reviewCount }, ...filtered].slice(0, 6);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {}
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const productImages = product
    ? (product.images?.length > 0 ? product.images : [product.image])
    : [];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSelectedImage(0);
      setQuantity(1);
      try {
        const [data, allProducts] = await Promise.all([
          fetchProductById(id),
          fetchProducts(),
        ]);
        setProduct(data);
        setRelatedProducts(
          allProducts
            .filter(p => p.id !== id && p.category === data.category)
            .slice(0, 4)
        );
        pushRecentlyViewed(data);
        setRecentlyViewed(getRecentlyViewed().filter(p => p.id !== id).slice(0, 4));
      } catch {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    fetchProductReviews(id)
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addToCart(product);
    toast.success(`Added ${quantity} × ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    const added = toggleWishlist(product);
    if (added) toast.success(`${product.name} added to wishlist`);
    else toast.info(`${product.name} removed from wishlist`);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewRating === 0) { toast.error('Please select a star rating'); return; }
    if (!reviewComment.trim()) { toast.error('Please write a comment'); return; }
    setSubmittingReview(true);
    try {
      const newReview = await createReview(id, reviewRating, reviewComment);
      setReviews(prev => [newReview, ...prev]);
      setProduct(prev => ({
        ...prev,
        reviewCount: (prev.reviewCount || 0) + 1,
        avgRating: newReview.avgRating ?? prev.avgRating,
      }));
      setReviewRating(0);
      setReviewComment('');
      toast.success('Review submitted!');
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await deleteReview(id, reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      toast.success('Review deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete review');
    }
  };

  const userHasReviewed = reviews.some(r => r.userId === user?.id);
  const avgRating = product?.avgRating || (reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <Link to="/products" className="text-primary-600 hover:underline">Back to Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8 text-sm" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li><Link to="/" className="text-gray-700 hover:text-primary-600">Home</Link></li>
            <li><span className="mx-2 text-gray-400">/</span><Link to="/products" className="text-gray-700 hover:text-primary-600">Products</Link></li>
            <li><span className="mx-2 text-gray-400">/</span><span className="text-gray-500">{product.name}</span></li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-8">
            {/* Image Gallery */}
            <div>
              <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                <img src={productImages[selectedImage]} alt={product.name} className="w-full h-96 object-cover" />
              </div>
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((img, index) => (
                    <button key={index} onClick={() => setSelectedImage(index)}
                      className={`rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-primary-600' : 'border-gray-200'} hover:border-primary-400 transition-colors`}>
                      <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="flex-1">
                {product.featured && (
                  <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded mb-4">Featured</span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>

                {/* Rating summary */}
                <div className="flex items-center gap-3 mb-4">
                  <StarRating value={Math.round(avgRating)} size="sm" />
                  <span className="text-sm text-gray-600">
                    {avgRating > 0 ? avgRating.toFixed(1) : 'No ratings yet'}
                    {reviews.length > 0 && ` (${reviews.length} review${reviews.length !== 1 ? 's' : ''})`}
                  </span>
                </div>

                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-xs text-primary-600 font-semibold uppercase bg-primary-50 px-3 py-1 rounded">
                    {product.category}
                  </span>
                  {product.stock > 0 ? (
                    <span className="text-green-600 text-sm font-medium">In Stock ({product.stock} available)</span>
                  ) : (
                    <span className="text-red-600 text-sm font-medium">Out of Stock</span>
                  )}
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary-600">${product.price.toFixed(2)}</span>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{product.description}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">What's included</h3>
                  <ul className="space-y-2">
                    {['High quality materials', '1-year warranty', 'Free shipping over $50', '30-day return policy'].map(f => (
                      <li key={f} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-600">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Quantity + Actions */}
              <div className="border-t pt-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={product.stock === 0}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors">−</button>
                      <input type="number" min="1" max={product.stock} value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                        className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                        disabled={product.stock === 0} />
                      <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={product.stock === 0}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors">+</button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleAddToCart} disabled={product.stock === 0}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button onClick={handleBuyNow} disabled={product.stock === 0}
                    className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                    Buy Now
                  </button>
                  <button onClick={handleToggleWishlist}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${isInWishlist(product.id) ? 'border-red-300 bg-red-50 text-red-500 hover:bg-red-100' : 'border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500'}`}
                    aria-label="Toggle wishlist">
                    <svg className="w-5 h-5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-10 bg-white rounded-lg shadow-lg p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Customer Reviews
            {reviews.length > 0 && <span className="ml-2 text-lg font-normal text-gray-500">({reviews.length})</span>}
          </h2>

          {/* Rating summary bar */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                <StarRating value={Math.round(avgRating)} />
                <p className="text-sm text-gray-500 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-gray-600">{star}</span>
                      <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-gray-500 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add review form */}
          {isAuthenticated && !userHasReviewed && (
            <form onSubmit={handleSubmitReview} className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Write a Review</h3>
              <div className="mb-3">
                <label className="block text-sm text-gray-700 mb-1">Your Rating</label>
                <StarRating value={reviewRating} onChange={setReviewRating} />
              </div>
              <div className="mb-3">
                <label className="block text-sm text-gray-700 mb-1">Your Review</label>
                <textarea
                  rows="3"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                />
              </div>
              <button type="submit" disabled={submittingReview}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm disabled:opacity-60">
                {submittingReview ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}

          {!isAuthenticated && (
            <div className="mb-8 p-4 border border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600 mb-2">Sign in to leave a review</p>
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium text-sm">Sign In →</Link>
            </div>
          )}

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse p-4 border border-gray-100 rounded-lg">
                  <div className="flex gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 bg-gray-200 rounded w-24" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mt-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 mt-1" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="p-4 border border-gray-100 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-sm">
                        {review.userName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{review.userName}</p>
                        <StarRating value={review.rating} size="sm" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {(user?.id === review.userId || user?.role === 'admin') && (
                        <button onClick={() => handleDeleteReview(review.id)}
                          className="text-xs text-red-500 hover:text-red-700">Delete</button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map(p => (
                <Link key={p.id} to={`/products/${p.id}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <img src={p.image} alt={p.name} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                  <div className="p-4">
                    <span className="text-xs text-primary-600 font-semibold uppercase">{p.category}</span>
                    <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2 hover:text-primary-600">{p.name}</h3>
                    {p.avgRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating value={Math.round(p.avgRating)} size="sm" />
                        <span className="text-xs text-gray-500">({p.reviewCount})</span>
                      </div>
                    )}
                    <p className="text-base font-bold text-primary-600 mt-2">${p.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recently Viewed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyViewed.map(p => (
                <Link key={p.id} to={`/products/${p.id}`}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <img src={p.image} alt={p.name} className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" />
                  <div className="p-4">
                    <span className="text-xs text-primary-600 font-semibold uppercase">{p.category}</span>
                    <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2 hover:text-primary-600">{p.name}</h3>
                    {p.avgRating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <StarRating value={Math.round(p.avgRating)} size="sm" />
                        <span className="text-xs text-gray-500">({p.reviewCount})</span>
                      </div>
                    )}
                    <p className="text-base font-bold text-primary-600 mt-2">${p.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
