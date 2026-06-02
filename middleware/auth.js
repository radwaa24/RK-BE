import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { can, isStaff, isOwner } from '../config/permissions.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Require a specific permission key. Owner bypasses; staff need the key.
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (can(req.user, permission)) return next();
    return res.status(403).json({
      success: false,
      message: `Missing permission: ${permission}`
    });
  };
};

// Require any admin-panel staff (owner or staff role).
export const requireStaff = (req, res, next) => {
  if (isStaff(req.user)) return next();
  return res.status(403).json({
    success: false,
    message: 'Staff access required'
  });
};

// Require the owner specifically (e.g. creating/editing other owners).
export const requireOwner = (req, res, next) => {
  if (isOwner(req.user)) return next();
  return res.status(403).json({
    success: false,
    message: 'Owner access required'
  });
};

