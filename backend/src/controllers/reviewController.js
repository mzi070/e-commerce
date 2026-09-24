const {
  findReviewsByProductId,
  findReviewById,
  addReview,
  deleteReview,
  findProductById,
  updateProduct,
} = require('../utils/dbHelpers');

exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await findReviewsByProductId(req.params.productId);
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    // One review per user per product
    const existing = await findReviewsByProductId(productId);
    const alreadyReviewed = existing.some(r => r.userId === req.user.id);
    if (alreadyReviewed) {
      return res.status(409).json({ message: 'You have already reviewed this product' });
    }

    const newReview = await addReview({
      productId,
      userId: req.user.id,
      userName: req.user.name,
      rating: parseInt(rating),
      comment: comment.trim(),
    });

    // Update product average rating and review count
    const allReviews = [...existing, newReview];
    const newAvg = Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length) * 10) / 10;
    await updateProduct(productId, { avgRating: newAvg, reviewCount: allReviews.length });

    res.status(201).json({ ...newReview, productAvgRating: newAvg, productReviewCount: allReviews.length });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const review = await findReviewById(reviewId);

    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await deleteReview(reviewId);

    // Recalculate product rating
    const remaining = await findReviewsByProductId(productId);
    const newAvg = remaining.length > 0
      ? Math.round((remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length) * 10) / 10
      : 0;
    await updateProduct(productId, { avgRating: newAvg, reviewCount: remaining.length });

    res.json({ message: 'Review deleted', productAvgRating: newAvg, productReviewCount: remaining.length });
  } catch (error) {
    if (error.message === 'Review not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};
