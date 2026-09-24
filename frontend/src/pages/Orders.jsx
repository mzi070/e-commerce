import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchMyOrders, cancelOrder } from '../services/api';
import { toast } from 'sonner';

const Orders = () => {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [lookupEmail, setLookupEmail] = useState(() => {
    try { return localStorage.getItem('customerEmail') || ''; } catch { return ''; }
  });
  const [hasSearched, setHasSearched] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const loadOrders = async (emailToUse) => {
    if (!emailToUse) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyOrders(emailToUse);
      setOrders(data);
      setHasSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedEmail = lookupEmail || (isAuthenticated ? user?.email : '');
    if (storedEmail) {
      setEmail(storedEmail);
      loadOrders(storedEmail);
    }
  }, []);

  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      const updated = await cancelOrder(orderId, lookupEmail);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updated.status } : o));
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
      setConfirmCancelId(null);
    }
  };

  const handleLookup = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try { localStorage.setItem('customerEmail', email.trim()); } catch {}
    setLookupEmail(email.trim());
    loadOrders(email.trim());
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const getStatusColor = (status = 'pending') => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.pending;
  };

  const getStatusStep = (status) => {
    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    return steps.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {/* Email lookup form */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-8">
          <p className="text-sm text-gray-600 mb-3">Enter the email address used at checkout to view your orders.</p>
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <button type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm">
              Look Up Orders
            </button>
          </form>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>
        )}

        {!loading && hasSearched && orders.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No orders found</h2>
            <p className="text-gray-500 mb-6">No orders were found for this email address.</p>
            <Link to="/products" className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
              Start Shopping
            </Link>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Order #{order.id}</h2>
                      <p className="text-sm text-gray-600">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                      </span>
                      <span className="text-lg font-bold text-primary-600">${order.total?.toFixed(2)}</span>
                      {order.status === 'pending' && (
                        confirmCancelId === order.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Cancel this order?</span>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={cancellingId === order.id}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                            >
                              {cancellingId === order.id ? 'Cancelling…' : 'Yes, Cancel'}
                            </button>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 font-medium"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmCancelId(order.id)}
                            className="px-3 py-1 text-xs border border-red-400 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                          >
                            Cancel Order
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Progress tracker */}
                  {order.status !== 'cancelled' && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, idx) => {
                          const current = getStatusStep(order.status);
                          const active = idx <= current;
                          return (
                            <div key={step} className="flex flex-col items-center flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${active ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {idx + 1}
                              </div>
                              <span className={`text-xs text-center ${active ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="relative h-1 bg-gray-200 rounded mx-4">
                        <div
                          className="absolute h-1 bg-primary-600 rounded transition-all"
                          style={{ width: `${Math.max(0, (getStatusStep(order.status) / 3) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="space-y-3 mb-6">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                        </div>
                        <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span><span>${order.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className={order.shipping === 0 ? 'text-green-600 font-medium' : ''}>
                        {order.shipping === 0 ? 'FREE' : `$${order.shipping?.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span><span>${order.tax?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900 pt-1.5 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-primary-600">${order.total?.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Shipping address */}
                  {order.shippingInfo && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-1 text-sm">Shipping Address</h3>
                      <p className="text-sm text-gray-600">
                        {order.shippingInfo.firstName} {order.shippingInfo.lastName}<br />
                        {order.shippingInfo.address}<br />
                        {order.shippingInfo.city}, {order.shippingInfo.state} {order.shippingInfo.zipCode}
                        {order.shippingInfo.country && <><br />{order.shippingInfo.country}</>}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/products" className="inline-block px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Orders;
