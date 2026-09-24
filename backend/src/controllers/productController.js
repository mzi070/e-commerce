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
    const newProduct = await addProduct({
      name, description, price: Number(price), category,
      image, stock: Number(stock ?? 0), featured: Boolean(featured),
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
    if (price !== undefined) updates.price = Number(price);
    if (category !== undefined) updates.category = category;
    if (image !== undefined) updates.image = image;
    if (stock !== undefined) updates.stock = Number(stock);
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
