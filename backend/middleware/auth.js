import jwt from 'jsonwebtoken';
import { getPool } from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, name, email, phone FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: true,
        message: 'User not found'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: true,
        message: 'Invalid token'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: true,
      message: 'Authentication error'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, name, email, phone FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length > 0) {
      req.user = users[0];
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // For optional auth, we just set user to null if token is invalid
    req.user = null;
    next();
  }
};

export const requireEventOwnership = async (req, res, next) => {
  try {
    // Support both :id and :eventId param names
    const eventId = req.params.eventId || req.params.id;
    if (!eventId) {
      return res.status(400).json({
        error: true,
        message: 'Event ID is required.'
      });
    }
    const userId = req.user.id;

    console.log('Checking event ownership:', { eventId, userId });

    const pool = getPool();
    const [events] = await pool.execute(
      'SELECT id FROM events WHERE id = ? AND user_id = ?',
      [eventId, userId]
    );

    if (events.length === 0) {
      console.log('Event ownership check failed:', { eventId, userId });
      return res.status(403).json({
        error: true,
        message: 'Access denied. You do not own this event.'
      });
    }

    console.log('Event ownership check passed:', { eventId, userId });
    next();
  } catch (error) {
    console.error('Event ownership check error:', error);
    return res.status(500).json({
      error: true,
      message: 'Error checking event ownership'
    });
  }
};

export const requireEventAccess = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    const pool = getPool();
    
    // Check if user owns the event or if it's a public event
    let query = 'SELECT id, user_id, status FROM events WHERE id = ?';
    let params = [eventId];

    if (userId) {
      query += ' AND (user_id = ? OR status = "active")';
      params.push(userId);
    } else {
      query += ' AND status = "active"';
    }

    const [events] = await pool.execute(query, params);

    if (events.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Event not found or access denied'
      });
    }

    req.event = events[0];
    next();
  } catch (error) {
    console.error('Event access check error:', error);
    return res.status(500).json({
      error: true,
      message: 'Error checking event access'
    });
  }
};

export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}; 