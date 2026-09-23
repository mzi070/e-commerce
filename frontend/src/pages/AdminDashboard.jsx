import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  fetchProducts,
  fetchAdminOrders,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminUpdateOrderStatus,
} from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, ordersData] = await Promise.all([
          fetchProducts(),
          fetchAdminOrders(),
        ]);
        setProducts(Array.isArray(productsData) ? productsData : []);
        const normalized = (Array.isArray(ordersData) ? ordersData : []).map(order => ({
          ...order,
          customerName: order.shippingInfo
            ? `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() || order.customerEmail
            : (order.customerEmail || 'Guest'),
          date: order.createdAt,
        }));
        setOrders(normalized);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => ({
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
  }), [products, orders]);

  const handleCreateProduct = async (productData) => {
    try {
      const newProduct = await adminCreateProduct(productData);
      setProducts(prev => [...prev, newProduct]);
      setShowProductModal(false);
      setEditingProduct(null);
      toast.success('Product created successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async (productData) => {
    try {
      const updated = await adminUpdateProduct(editingProduct.id, productData);
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? updated : p));
      setShowProductModal(false);
      setEditingProduct(null);
      toast.success('Product updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = (productId) => {
    setDeleteItemId(productId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await adminDeleteProduct(deleteItemId);
      setProducts(prev => prev.filter(p => p.id !== deleteItemId));
      toast.success('Product deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete product');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteItemId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminUpdateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success('Order status updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update order status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Manage your e-commerce platform</p>
            </div>
            <Link
              to="/"
              className="px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
            >
              ← Back to Store
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['overview', 'products', 'orders'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Dashboard Overview</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Recent Orders</h3>
                    {orders.length === 0 ? (
                      <p className="text-sm text-gray-500">No orders yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {orders.slice(0, 5).map(order => (
                          <div key={order.id} className="bg-white p-3 rounded border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{order.id}</p>
                                <p className="text-xs text-gray-600">{order.customerName}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">${(order.total || 0).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Low Stock Alert</h3>
                    {products.filter(p => (p.stock ?? 0) < 30).length === 0 ? (
                      <p className="text-sm text-gray-500">All products sufficiently stocked.</p>
                    ) : (
                      <div className="space-y-2">
                        {products
                          .filter(p => (p.stock ?? 0) < 30)
                          .slice(0, 5)
                          .map(product => (
                            <div key={product.id} className="bg-white p-3 rounded border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                                  <p className="text-xs text-gray-600">{product.category}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  (product.stock ?? 0) < 10 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {product.stock ?? 0} left
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <ProductsManagement
                products={products}
                onEdit={(product) => { setEditingProduct(product); setShowProductModal(true); }}
                onDelete={handleDeleteProduct}
                onCreate={() => { setEditingProduct(null); setShowProductModal(true); }}
                getStatusColor={getStatusColor}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersManagement
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      </div>

      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          onSave={editingProduct ? handleUpdateProduct : handleCreateProduct}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmModal
          onClose={() => { setShowDeleteConfirm(false); setDeleteItemId(null); }}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

const ProductsManagement = ({ products, onEdit, onDelete, onCreate, getStatusColor }) => (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-900">Products Management</h2>
      <button
        onClick={onCreate}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Product
      </button>
    </div>

    {products.length === 0 ? (
      <p className="text-gray-500 text-sm py-4">No products found.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description?.substring(0, 40)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${Number(product.price).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    (product.stock ?? 0) < 10 ? 'bg-red-100 text-red-800' :
                    (product.stock ?? 0) < 30 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {product.stock ?? 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => onEdit(product)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                  <button onClick={() => onDelete(product.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const OrdersManagement = ({ orders, onUpdateStatus, getStatusColor, formatDate }) => {
  const [expandedOrder, setExpandedOrder] = useState(null);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Orders Management</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500 text-sm py-4">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${(order.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status || 'pending'}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)} cursor-pointer`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {expandedOrder === order.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Order Items</h4>
                            <div className="space-y-1">
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{item.name} × {item.quantity}</span>
                                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
                            <p className="text-sm text-gray-600">
                              {order.shippingInfo?.address}<br />
                              {order.shippingInfo?.city}, {order.shippingInfo?.state} {order.shippingInfo?.zipCode}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || 'Electronics',
    price: product?.price || '',
    stock: product?.stock ?? '',
    description: product?.description || '',
    image: product?.image || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (formData.stock === '' || formData.stock < 0) newErrors.stock = 'Valid stock is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.image.trim()) newErrors.image = 'Image URL is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSave({ ...formData, price: parseFloat(formData.price), stock: parseInt(formData.stock) });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{product ? 'Edit Product' : 'Create New Product'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text" name="name" value={formData.name} onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Clothing">Clothing</option>
                <option value="Home">Home</option>
                <option value="Sports">Sports</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input
                type="number" name="price" step="0.01" value={formData.price} onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
            <input
              type="number" name="stock" value={formData.stock} onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description" rows="3" value={formData.description} onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
            <input
              type="text" name="image" value={formData.image} onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.image ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
            {formData.image && <img src={formData.image} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded" />}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
              {product ? 'Update' : 'Create'} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteConfirmModal = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
      <p className="text-gray-600 mb-6">Are you sure you want to delete this product? This action cannot be undone.</p>
      <div className="flex justify-end space-x-3">
        <button onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
          Cancel
        </button>
        <button onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default AdminDashboard;
