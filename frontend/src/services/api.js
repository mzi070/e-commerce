const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getToken = () => {
  try { return localStorage.getItem('token'); } catch { return null; }
};

const authHeaders = (extra = {}) => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

const handleResponse = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
};

export const fetchProducts = async () => {
  const res = await fetch(`${API_BASE_URL}/products`);
  return handleResponse(res);
};

export const fetchProductById = async (id) => {
  const res = await fetch(`${API_BASE_URL}/products/${id}`);
  return handleResponse(res);
};

export const createOrder = async (orderData) => {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(orderData),
  });
  return handleResponse(res);
};

export const loginUser = async (email, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
};

export const registerUser = async (name, email, password) => {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return handleResponse(res);
};

export const fetchMyOrders = async (email) => {
  const res = await fetch(`${API_BASE_URL}/orders/mine?email=${encodeURIComponent(email)}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const fetchProfile = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, { headers: authHeaders() });
  return handleResponse(res);
};

export const updateProfile = async (name) => {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  return handleResponse(res);
};

export const changePassword = async (currentPassword, newPassword) => {
  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handleResponse(res);
};

// Admin product CRUD
export const adminCreateProduct = async (data) => {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const adminUpdateProduct = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const adminDeleteProduct = async (id) => {
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
};

export const fetchAdminOrders = async () => {
  const res = await fetch(`${API_BASE_URL}/orders`, { headers: authHeaders() });
  return handleResponse(res);
};

export const adminUpdateOrderStatus = async (id, status) => {
  const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
};

// Reviews
export const fetchProductReviews = async (productId) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);
  return handleResponse(res);
};

export const createReview = async (productId, rating, comment) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ rating, comment }),
  });
  return handleResponse(res);
};

export const deleteReview = async (productId, reviewId) => {
  const res = await fetch(`${API_BASE_URL}/products/${productId}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
};
