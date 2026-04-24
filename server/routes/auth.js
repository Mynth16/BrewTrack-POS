import express from 'express';
import jwt from 'jsonwebtoken';
import { getAccountByUsername, verifyPassword } from '../db.js';

const router = express.Router();

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get account from database
    const account = await getAccountByUsername(username);

    if (!account || account.status !== 'Active') {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, account.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { accountID: account.accountID, username: account.username, role: account.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        username: account.username,
        role: account.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/auth/verify
export async function verify(req, res) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    res.json({
      user: {
        username: decoded.username,
        role: decoded.role,
      },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

// Setup routes
router.post('/login', login);
router.get('/verify', verify);

export default router;
