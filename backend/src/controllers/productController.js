const {
  findAllProducts,
  findProductById,
  addProduct,
  updateProduct,
  deleteProduct,
} = require('../utils/dbHelpers');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await findAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await findProductById(req.params.id);
    res.json(product);
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock, featured } = req.body;
    if (!name || price == null || !category) {
      return res.status(400).json({ message: 'name, price, and category are required' });
    }
    const numPrice = Number(price);
    const numStock = Number(stock ?? 0);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ message: 'price must be a non-negative number' });
    }
    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      return res.status(400).json({ message: 'stock must be a non-negative integer' });
    }
    if (image && !/^https?:\/\/.+/.test(image)) {
      return res.status(400).json({ message: 'image must be a valid http/https URL' });
    }
    const newProduct = await addProduct({
      name, description, price: numPrice, category,
      image, stock: numStock, featured: Boolean(featured),
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock, featured } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ message: 'price must be a non-negative number' });
      }
      updates.price = numPrice;
    }
    if (category !== undefined) updates.category = category;
    if (image !== undefined) {
      if (image && !/^https?:\/\/.+/.test(image)) {
        return res.status(400).json({ message: 'image must be a valid http/https URL' });
      }
      updates.image = image;
    }
    if (stock !== undefined) {
      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
        return res.status(400).json({ message: 'stock must be a non-negative integer' });
      }
      updates.stock = numStock;
    }
    if (featured !== undefined) updates.featured = Boolean(featured);
    const product = await updateProduct(req.params.id, updates);
    res.json(product);
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(400).json({ message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};
