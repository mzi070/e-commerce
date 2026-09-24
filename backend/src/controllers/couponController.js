const { findCouponByCode } = require('../utils/dbHelpers');

exports.validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await findCouponByCode(code.trim());
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    const orderSubtotal = parseFloat(subtotal) || 0;
    if (coupon.minOrder > 0 && orderSubtotal < coupon.minOrder) {
      return res.status(400).json({
        success: false,
        message: `Minimum order of $${coupon.minOrder.toFixed(2)} required for this coupon`,
      });
    }

    res.json({ success: true, data: { coupon } });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate coupon' });
  }
};
