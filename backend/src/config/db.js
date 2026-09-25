const { JSONFilePreset } = require('lowdb/node');
const path = require('path');

// Default data structure
const defaultData = {
  products: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Sample Product 1',
      description: 'This is a sample product description',
      price: 29.99,
      category: 'Electronics',
      image: 'https://placehold.co/300',
      stock: 50,
      featured: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Sample Product 2',
      description: 'Another great product',
      price: 49.99,
      category: 'Clothing',
      image: 'https://placehold.co/300',
      stock: 30,
      featured: false,
      createdAt: new Date().toISOString()
    }
  ],
  users: [],
  orders: [],
  reviews: [],
  coupons: [
    { code: 'SAVE10', type: 'percent', value: 10, minOrder: 0, active: true, description: '10% off your order' },
    { code: 'SAVE20', type: 'percent', value: 20, minOrder: 50, active: true, description: '20% off orders over $50' },
    { code: 'WELCOME15', type: 'percent', value: 15, minOrder: 0, active: true, description: '15% off — welcome gift' },
    { code: 'FREESHIP', type: 'shipping', value: 0, minOrder: 0, active: true, description: 'Free shipping on any order' },
    { code: 'SAVE5', type: 'fixed', value: 5, minOrder: 25, active: true, description: '$5 off orders over $25' }
  ]
};

let db = null;

// Initialize database
const initDB = async () => {
  try {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'db.json');
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        'WARNING: Using lowdb (JSON file) in production. ' +
        'Data will be lost on ephemeral filesystems (Railway, Render, Heroku). ' +
        'Set DB_PATH to a persistent volume path, or migrate to a real database.'
      );
    }
    db = await JSONFilePreset(dbPath, defaultData);
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Get database instance
const getDB = async () => {
  if (!db) {
    await initDB();
  }
  return db;
};

module.exports = { initDB, getDB };
