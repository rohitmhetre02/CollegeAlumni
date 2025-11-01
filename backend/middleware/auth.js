import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.headers.token;

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'alumni-portal-secret-key-2024-very-secure-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions' });
    }
    next();
  };
};

// Middleware to check approval status for students and alumni
export const checkApproval = async (req, res, next) => {
  try {
    // Only check approval for students and alumni
    if (req.user.role !== 'student' && req.user.role !== 'alumni') {
      return next();
    }

    // Fetch user to get current approval status
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Block access if pending or rejected
    if (user.approvalStatus === 'pending' || user.approvalStatus === 'rejected') {
      return res.status(403).json({ 
        message: 'Access denied. Your profile is pending approval from the department coordinator.',
        approvalStatus: user.approvalStatus
      });
    }

    // Allow access if approved
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

