const { findUserByEmail, findAllUsers, addUser } = require('../utils/dbHelpers');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { withLock } = require('../utils/mutex');

/**
 * Register a new user
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      return res.status(400).json({ success: false, message: 'name must be 1–100 characters' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    const newUser = await addUser({
      name: trimmedName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'customer',
    });

    // Generate token
    const token = generateToken(newUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    // User is already attached by authenticate middleware
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Update user profile (name only)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const trimmedName = name?.trim() || '';
    if (!trimmedName || trimmedName.length > 100) {
      return res.status(400).json({ success: false, message: 'name must be 1–100 characters' });
    }
    const { updateUser } = require('../utils/dbHelpers');
    const updated = await updateUser(req.user.id, { name: trimmedName });
    const { password: _, ...userWithoutPassword } = updated;
    res.json({ success: true, data: { user: userWithoutPassword } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

/**
 * One-time admin setup — creates the first admin account.
 * Permanently disabled once any admin exists in the database.
 * Locked to prevent two concurrent requests both passing the "no admins" check.
 */
exports.setupAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Admin password must be at least 8 characters' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  try {
    const result = await withLock('setup-admin', async () => {
      const users = await findAllUsers();
      if (users.some(u => u.role === 'admin')) {
        return { status: 403, body: { success: false, message: 'Setup already completed — an admin account already exists.' } };
      }
      const existing = await findUserByEmail(email);
      if (existing) {
        return { status: 409, body: { success: false, message: 'A user with this email already exists' } };
      }
      const hashedPassword = await hashPassword(password);
      const newAdmin = await addUser({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
      });
      const { password: _, ...adminWithoutPassword } = newAdmin;
      return {
        status: 201,
        body: { success: true, message: 'Admin account created successfully.', data: { user: adminWithoutPassword } },
      };
    });
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Setup admin error:', error);
    res.status(500).json({ success: false, message: 'Failed to create admin account' });
  }
};

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { findAllUsers } = require('../utils/dbHelpers');
    const users = await findAllUsers();
    const sanitized = users.map(({ password: _, ...u }) => u);
    res.json({ success: true, data: { users: sanitized } });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Failed to get users' });
  }
};

/**
 * Logout user — increments tokenVersion to revoke all current tokens for this user
 */
exports.logout = async (req, res) => {
  try {
    const { updateUser, findUserById } = require('../utils/dbHelpers');
    const user = await findUserById(req.user.id);
    await updateUser(req.user.id, { tokenVersion: (user.tokenVersion ?? 0) + 1 });
    res.json({
      success: true,
      message: 'Logout successful.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Get user with password
    const user = await findUserByEmail(req.user.email);

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and revoke all existing tokens
    const { updateUser } = require('../utils/dbHelpers');
    await updateUser(user.id, {
      password: hashedPassword,
      tokenVersion: (user.tokenVersion ?? 0) + 1,
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
