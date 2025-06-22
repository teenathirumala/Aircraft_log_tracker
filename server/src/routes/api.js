const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const User = require('../models/User');
const { authenticate, requireAdmin, requireTechnician } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// User signup with role assignment
router.post('/signup', async (req, res) => {
  const { username, password, fullName, email, role = 'technician', assignedAircraft = [] } = req.body;
  
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      password: hashedPassword, 
      fullName, 
      email, 
      role, 
      assignedAircraft 
    });
    
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        assignedAircraft: user.assignedAircraft
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Signup failed' });
  }
});

// User login with role info
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Update last login without triggering validation on the whole document
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        assignedAircraft: user.assignedAircraft,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get current user profile
router.get('/profile', authenticate, requireTechnician, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Upload maintenance log (Technician and Admin only)
router.post('/logs/upload', authenticate, requireTechnician, async (req, res) => {
  try {
    const originalLogs = JSON.parse(req.files.logs.data.toString());
    const userInfo = req.userInfo;

    let logsToProcess = originalLogs;
    let skippedCount = 0;

    // For technicians, filter logs to only include those for their assigned aircraft.
    if (userInfo.role !== 'admin') {
      logsToProcess = originalLogs.filter(log => 
        userInfo.assignedAircraft.includes(log.aircraftId)
      );
      skippedCount = originalLogs.length - logsToProcess.length;
    }

    // If there are no valid logs to process after filtering, inform the user.
    if (logsToProcess.length === 0) {
      return res.status(403).json({ 
        message: 'Upload failed. You are not assigned to any of the aircraft in this file.',
        totalLogsInFile: originalLogs.length,
        assignedAircraft: userInfo.assignedAircraft
      });
    }

    // Prepare valid logs for insertion into the database.
    const savedLogs = await Log.insertMany(logsToProcess.map(log => ({ 
      ...log, 
      userId: req.user.userId,
      uploadedBy: userInfo.username
    })));
    
    let message = `${savedLogs.length} logs uploaded successfully.`;
    if (skippedCount > 0) {
      message += ` ${skippedCount} logs were skipped due to missing aircraft assignment.`;
    }

    res.status(201).json({ 
      message: message,
      count: savedLogs.length,
      skipped: skippedCount,
      uploadedBy: userInfo.username
    });
    
  } catch (err) {
    console.error('Upload error:', err);
    res.status(400).json({ message: 'Invalid log format or server error during upload.' });
  }
});

// Get logs with role-based filtering
router.get('/logs', authenticate, requireTechnician, async (req, res) => {
  try {
    const userInfo = req.userInfo;
    let query = {};
    
    // Non-admin users can only see logs for their assigned aircraft
    if (userInfo.role !== 'admin') {
      query.aircraftId = { $in: userInfo.assignedAircraft };
    }
    
    const logs = await Log.find(query).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
});

// Analyze failure trends (Technician and Admin can view)
router.get('/logs/analyze', authenticate, requireTechnician, async (req, res) => {
  try {
    const userInfo = req.userInfo;
    let matchQuery = { failure: true };
    
    // Non-admin users can only analyze their assigned aircraft
    if (userInfo.role !== 'admin') {
      matchQuery.aircraftId = { $in: userInfo.assignedAircraft };
    }
    
    const failures = await Log.aggregate([
      { $match: matchQuery },
      { $group: { _id: { $month: '$date' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]);
    
    res.json(failures.map(f => ({ month: f._id, failures: f.count })));
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ message: 'Analysis failed' });
  }
});

// Predict maintenance (Technician and Admin can view)
router.get('/logs/predict', authenticate, requireTechnician, async (req, res) => {
  try {
    const userInfo = req.userInfo;
    let query = {};
    
    // Non-admin users can only predict for their assigned aircraft
    if (userInfo.role !== 'admin') {
      query.aircraftId = { $in: userInfo.assignedAircraft };
    }
    
    const logs = await Log.find(query);
    const avgHours = logs.reduce((sum, log) => sum + log.hoursSinceLastMaintenance, 0) / logs.length;
    const predictions = logs
      .filter(log => log.hoursSinceLastMaintenance > avgHours * 1.5)
      .map(log => ({ 
        component: log.component, 
        aircraftId: log.aircraftId,
        hoursSinceLastMaintenance: log.hoursSinceLastMaintenance,
        riskLevel: log.hoursSinceLastMaintenance > avgHours * 2 ? 'HIGH' : 'MEDIUM'
      }));
    
    res.json({ 
      predictions,
      averageHours: Math.round(avgHours),
      analyzedBy: userInfo.username
    });
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ message: 'Prediction failed' });
  }
});

// Clear logs (Admin only)
router.delete('/logs/clear', authenticate, requireAdmin, async (req, res) => {
  try {
    const userInfo = req.userInfo;
    await Log.deleteMany({});
    
    res.json({ 
      message: 'All logs cleared successfully',
      clearedBy: userInfo.username,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Clear logs error:', err);
    res.status(500).json({ message: 'Failed to clear logs' });
  }
});

// Export logs (Admin only)
router.get('/logs/export', authenticate, requireAdmin, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const logs = await Log.find({}).sort({ date: -1 });
    
    if (format === 'csv') {
      const csv = logs.map(log => 
        `${log.aircraftId},${log.component},${log.date},${log.failure},${log.hoursSinceLastMaintenance}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=maintenance_logs.csv');
      res.send(`AircraftID,Component,Date,Failure,HoursSinceLastMaintenance\n${csv}`);
    } else {
      res.json({
        logs,
        exportedBy: req.userInfo.username,
        timestamp: new Date(),
        totalRecords: logs.length
      });
    }
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Export failed' });
  }
});

// Admin routes for user management
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user role and assignments (Admin only)
router.put('/users/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { role, assignedAircraft, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role, assignedAircraft, isActive },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Get system statistics (Admin only)
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const totalLogs = await Log.countDocuments();
    const totalUsers = await User.countDocuments();
    const failureRate = await Log.aggregate([
      { $group: { _id: null, failures: { $sum: { $cond: ['$failure', 1, 0] } }, total: { $sum: 1 } } }
    ]);
    
    const stats = {
      totalLogs,
      totalUsers,
      failureRate: failureRate[0] ? (failureRate[0].failures / failureRate[0].total * 100).toFixed(2) + '%' : '0%',
      lastUpdated: new Date()
    };
    
    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;