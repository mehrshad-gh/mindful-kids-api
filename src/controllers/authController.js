const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

function generateToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const role = req.body.role === 'therapist' ? 'therapist' : 'parent';
    const user = await User.create({
      email,
      passwordHash,
      name,
      role,
    });
    const token = generateToken(user);
    res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      expiresIn: config.jwt.expiresIn,
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, created_at: user.created_at } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  me,
};
