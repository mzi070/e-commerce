const { getDB } = require('../config/db');

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// PRODUCTS CRUD Operations

/**
 * Find all products
 */
const findAllProducts = async () => {
  try {
    const db = await getDB();
    return db.data.products;
  } catch (error) {
    console.error('Error finding products:', error);
    throw new Error('Failed to retrieve products');
  }
};

/**
 * Find product by ID
 */
const findProductById = async (id) => {
  try {
    const db = await getDB();
    const product = db.data.products.find(p => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (error) {
    console.error('Error finding product:', error);
    throw error;
  }
};

/**
 * Add new product
 */
const addProduct = async (productData) => {
  try {
    const db = await getDB();
    const newProduct = {
      id: generateId(),
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.data.products.push(newProduct);
    await db.write();
    return newProduct;
  } catch (error) {
    console.error('Error adding product:', error);
    throw new Error('Failed to add product');
  }
};

/**
 * Update product by ID
 */
const updateProduct = async (id, updates) => {
  try {
    const db = await getDB();
    const index = db.data.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }
    db.data.products[index] = {
      ...db.data.products[index],
      ...updates,
      id, // Preserve the original ID
      updatedAt: new Date().toISOString()
    };
    await db.write();
    return db.data.products[index];
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Delete product by ID
 */
const deleteProduct = async (id) => {
  try {
    const db = await getDB();
    const index = db.data.products.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }
    const deletedProduct = db.data.products.splice(index, 1)[0];
    await db.write();
    return deletedProduct;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// USERS CRUD Operations

/**
 * Find all users
 */
const findAllUsers = async () => {
  try {
    const db = await getDB();
    return db.data.users;
  } catch (error) {
    console.error('Error finding users:', error);
    throw new Error('Failed to retrieve users');
  }
};

/**
 * Find user by ID
 */
const findUserById = async (id) => {
  try {
    const db = await getDB();
    const user = db.data.users.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
};

/**
 * Add new user
 */
const addUser = async (userData) => {
  try {
    const db = await getDB();
    const newUser = {
      id: generateId(),
      ...userData,
      createdAt: new Date().toISOString()
    };
    db.data.users.push(newUser);
    await db.write();
    return newUser;
  } catch (error) {
    console.error('Error adding user:', error);
    throw new Error('Failed to add user');
  }
};

/**
 * Update user by ID
 */
const updateUser = async (id, updates) => {
  try {
    const db = await getDB();
    const index = db.data.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    db.data.users[index] = {
      ...db.data.users[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    await db.write();
    return db.data.users[index];
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete user by ID
 */
const deleteUser = async (id) => {
  try {
    const db = await getDB();
    const index = db.data.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    const deletedUser = db.data.users.splice(index, 1)[0];
    await db.write();
    return deletedUser;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// ORDERS CRUD Operations

/**
 * Find all orders
 */
const findAllOrders = async () => {
  try {
    const db = await getDB();
    return db.data.orders;
  } catch (error) {
    console.error('Error finding orders:', error);
    throw new Error('Failed to retrieve orders');
  }
};

/**
 * Find order by ID
 */
const findOrderById = async (id) => {
  try {
    const db = await getDB();
    const order = db.data.orders.find(o => o.id === id);
    if (!order) {
      throw new Error('Order not found');
    }
    return order;
  } catch (error) {
    console.error('Error finding order:', error);
    throw error;
  }
};

/**
 * Add new order
 */
const addOrder = async (orderData) => {
  try {
    const db = await getDB();
    const newOrder = {
      id: generateId(),
      ...orderData,
      status: orderData.status || 'pending',
      createdAt: new Date().toISOString()
    };
    db.data.orders.push(newOrder);
    await db.write();
    return newOrder;
  } catch (error) {
    console.error('Error adding order:', error);
    throw new Error('Failed to add order');
  }
};

/**
 * Update order by ID
 */
const updateOrder = async (id, updates) => {
  try {
    const db = await getDB();
    const index = db.data.orders.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error('Order not found');
    }
    db.data.orders[index] = {
      ...db.data.orders[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    await db.write();
    return db.data.orders[index];
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

/**
 * Delete order by ID
 */
const deleteOrder = async (id) => {
  try {
    const db = await getDB();
    const index = db.data.orders.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error('Order not found');
    }
    const deletedOrder = db.data.orders.splice(index, 1)[0];
    await db.write();
    return deletedOrder;
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

module.exports = {
  // Products
  findAllProducts,
  findProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  // Users
  findAllUsers,
  findUserById,
  addUser,
  updateUser,
  deleteUser,
  // Orders
  findAllOrders,
  findOrderById,
  addOrder,
  updateOrder,
  deleteOrder,
};
