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
  orders: []
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
