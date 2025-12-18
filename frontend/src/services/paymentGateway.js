/**
 * Simulated Payment Gateway Service
 * This simulates a real payment processor like Stripe, PayPal, etc.
 */

// Simulated delay for API calls
const simulateNetworkDelay = (min = 1000, max = 3000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Validate card number using Luhn algorithm
 */
const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (!/^\d{13,19}$/.test(cleaned)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Detect card type from card number
 */
export const detectCardType = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
    dinersclub: /^3(?:0[0-5]|[68])/,
    jcb: /^(?:2131|1800|35)/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleaned)) {
      return type;
    }
  }

  return 'unknown';
};

/**
 * Validate expiry date
 */
const validateExpiryDate = (expiryDate) => {
  if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return false;
  }

  const [month, year] = expiryDate.split('/').map(Number);
  
  if (month < 1 || month > 12) {
    return false;
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }

  return true;
};

/**
 * Validate CVV
 */
const validateCVV = (cvv, cardType) => {
  const cleaned = cvv.replace(/\s/g, '');
  
  if (cardType === 'amex') {
    return /^\d{4}$/.test(cleaned);
  }
  
  return /^\d{3}$/.test(cleaned);
};

/**
 * Process payment (simulated)
 * @param {Object} paymentData - Payment information
 * @returns {Promise<Object>} - Payment result
 */
export const processPayment = async (paymentData) => {
  const {
    cardNumber,
    cardName,
    expiryDate,
    cvv,
    amount,
  } = paymentData;

  // Simulate network delay
  await simulateNetworkDelay(1500, 2500);

  // Validate card number
  if (!validateCardNumber(cardNumber)) {
    throw new Error('Invalid card number');
  }

  // Validate expiry date
  if (!validateExpiryDate(expiryDate)) {
    throw new Error('Card has expired or invalid expiry date');
  }

  // Validate CVV
  const cardType = detectCardType(cardNumber);
  if (!validateCVV(cvv, cardType)) {
    throw new Error('Invalid CVV');
  }

  // Validate cardholder name
  if (!cardName || cardName.trim().length < 3) {
    throw new Error('Invalid cardholder name');
  }

  // Validate amount
  if (!amount || amount <= 0) {
    throw new Error('Invalid amount');
  }

  // Simulate random failures (5% failure rate)
  const shouldFail = Math.random() < 0.05;
  if (shouldFail) {
    const errors = [
      'Payment declined by issuer',
      'Insufficient funds',
      'Card limit exceeded',
      'Fraud detection triggered',
    ];
    throw new Error(errors[Math.floor(Math.random() * errors.length)]);
  }

  // Generate transaction ID
  const transactionId = 'TXN_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 9).toUpperCase();

  // Return success response
  return {
    success: true,
    transactionId,
    amount,
    cardType: detectCardType(cardNumber),
    lastFourDigits: cardNumber.replace(/\s/g, '').slice(-4),
    timestamp: new Date().toISOString(),
    message: 'Payment processed successfully',
  };
};

/**
 * Get test card numbers for different scenarios
 */
export const getTestCards = () => {
  return {
    success: [
      { number: '4242424242424242', type: 'Visa', description: 'Always succeeds' },
      { number: '5555555555554444', type: 'Mastercard', description: 'Always succeeds' },
      { number: '378282246310005', type: 'American Express', description: 'Always succeeds' },
      { number: '6011111111111117', type: 'Discover', description: 'Always succeeds' },
    ],
    decline: [
      { number: '4000000000000002', type: 'Visa', description: 'Card declined' },
      { number: '4000000000009995', type: 'Visa', description: 'Insufficient funds' },
    ],
  };
};

/**
 * Validate entire payment form
 */
export const validatePaymentForm = (paymentData) => {
  const errors = {};

  // Validate card number
  if (!paymentData.cardNumber) {
    errors.cardNumber = 'Card number is required';
  } else if (!validateCardNumber(paymentData.cardNumber)) {
    errors.cardNumber = 'Invalid card number';
  }

  // Validate cardholder name
  if (!paymentData.cardName || paymentData.cardName.trim().length < 3) {
    errors.cardName = 'Valid cardholder name is required';
  }

  // Validate expiry date
  if (!paymentData.expiryDate) {
    errors.expiryDate = 'Expiry date is required';
  } else if (!validateExpiryDate(paymentData.expiryDate)) {
    errors.expiryDate = 'Card has expired or invalid date';
  }

  // Validate CVV
  const cardType = detectCardType(paymentData.cardNumber || '');
  if (!paymentData.cvv) {
    errors.cvv = 'CVV is required';
  } else if (!validateCVV(paymentData.cvv, cardType)) {
    errors.cvv = cardType === 'amex' ? 'CVV must be 4 digits' : 'CVV must be 3 digits';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Format card number for display
 */
export const formatCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const cardType = detectCardType(cleaned);
  
  // AMEX format: XXXX XXXXXX XXXXX
  if (cardType === 'amex') {
    return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }
  
  // Default format: XXXX XXXX XXXX XXXX
  return cleaned.replace(/(\d{4})/g, '$1 ').trim();
};

/**
 * Mask card number for display
 */
export const maskCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const lastFour = cleaned.slice(-4);
  return `•••• •••• •••• ${lastFour}`;
};

export default {
  processPayment,
  detectCardType,
  validatePaymentForm,
  formatCardNumber,
  maskCardNumber,
  getTestCards,
};
