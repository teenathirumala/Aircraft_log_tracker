const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Authentication middleware
const authenticate = function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get user from database to check current role
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.',
          requiredRoles: allowedRoles,
          userRole: user.role
        });
      }

      // Add user info to request for use in route handlers
      req.userInfo = {
        userId: user._id,
        username: user.username,
        role: user.role,
        assignedAircraft: user.assignedAircraft,
        fullName: user.fullName,
        department: user.department
      };

      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({ message: 'Authorization error' });
    }
  };
};

// Specific role checkers
const requireAdmin = authorizeRoles('admin');
const requireTechnician = authorizeRoles('admin', 'technician');

// Check if user can access specific aircraft
const canAccessAircraft = (aircraftId) => {
  return (req, res, next) => {
    const userRole = req.userInfo.role;
    const userAircraft = req.userInfo.assignedAircraft;

    // Admins can access all aircraft
    if (userRole === 'admin') {
      return next();
    }

    // Check if user is assigned to this aircraft
    if (userAircraft.includes(aircraftId)) {
      return next();
    }

    res.status(403).json({ 
      message: 'Access denied. Aircraft not assigned to user.',
      aircraftId: aircraftId,
      assignedAircraft: userAircraft
    });
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
  requireAdmin,
  requireTechnician,
  canAccessAircraft
};