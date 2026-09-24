const { JSONFilePreset } = require('lowdb/node');
const path = require('path');

// Default data structure
const defaultData = {
  products: [
    {
      id: '1',
      name: 'Sample Product 1',
      description: 'This is a sample product description',
      price: 29.99,
      category: 'Electronics',
      image: 'https://via.placeholder.com/300',
      stock: 50,
      featured: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Sample Product 2',
      description: 'Another great product',
      price: 49.99,
      category: 'Clothing',
      image: 'https://via.placeholder.com/300',
      stock: 30,
      featured: false,
      createdAt: new Date().toISOString()
    }
  ],
  users: [],
  orders: [],
  reviews: [],
  coupons: [
    { code: 'SAVE10', type: 'percent', value: 10, minOrder: 0, description: '10% off your order' },
    { code: 'SAVE20', type: 'percent', value: 20, minOrder: 50, description: '20% off orders over $50' },
    { code: 'WELCOME15', type: 'percent', value: 15, minOrder: 0, description: '15% off — welcome gift' },
    { code: 'FREESHIP', type: 'shipping', value: 0, minOrder: 0, description: 'Free shipping on any order' },
    { code: 'SAVE5', type: 'fixed', value: 5, minOrder: 25, description: '$5 off orders over $25' }
  ]
};

let db = null;

// Initialize database
const initDB = async () => {
  try {
    const dbPath = path.join(__dirname, '..', '..', 'db.json');
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
