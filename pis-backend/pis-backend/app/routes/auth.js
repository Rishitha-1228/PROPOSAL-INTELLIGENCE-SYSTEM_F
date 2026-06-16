const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── POST /api/auth/signup ─────────────────────
router.post('/signup', async (req, res) => {
  const { first_name, last_name, email, password, role, institution } = req.body;

  // Validate
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'Full name is required' });
  }
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const validRoles = ['admin', 'editor', 'viewer'];
  const userRole = validRoles.includes(role) ? role : 'editor';

  try {
    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      institution: institution || 'My Institution'
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ New user registered: ${email} as ${userRole}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        institution: user.institution
      }
    });

  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user
    const user = await User.findOne({
      email: email.toLowerCase(),
      is_active: true
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${email} as ${user.role}`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        institution: user.institution
      }
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────
// Get current logged in user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;