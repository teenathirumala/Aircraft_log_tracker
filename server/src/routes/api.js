const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const User = require('../models/User');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// User signup
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Signup failed' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// Upload maintenance log
router.post('/logs/upload', auth, async (req, res) => {
  try {
    const logs = JSON.parse(req.files.logs.data.toString());
    const savedLogs = await Log.insertMany(logs.map(log => ({ ...log, userId: req.user.userId })));
    res.json({ message: 'Logs uploaded successfully', count: savedLogs.length });
  } catch (err) {
    res.status(400).json({ message: 'Invalid log format' });
  }
});

// Analyze failure trends
router.get('/logs/analyze', auth, async (req, res) => {
  try {
    const failures = await Log.aggregate([
      { $match: { userId: req.user.userId, failure: true } },
      { $group: { _id: { $month: '$date' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
    ]);
    res.json(failures.map(f => ({ month: f._id, failures: f.count })));
  } catch (err) {
    res.status(500).json({ message: 'Analysis failed' });
  }
});

// Predict maintenance
router.get('/logs/predict', auth, async (req, res) => {
  try {
    const logs = await Log.find({ userId: req.user.userId });
    const avgHours = logs.reduce((sum, log) => sum + log.hoursSinceLastMaintenance, 0) / logs.length;
    const predictions = logs
      .filter(log => log.hoursSinceLastMaintenance > avgHours * 1.5)
      .map(log => ({ component: log.component, aircraftId: log.aircraftId }));
    res.json({ predictions });
  } catch (err) {
    res.status(500).json({ message: 'Prediction failed' });
  }
});

router.delete('/logs/clear', auth, async (req, res) => {
  try {
    await Log.deleteMany({ userId: req.user.userId });
    res.json({ message: 'Logs cleared successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear logs' });
  }
});

module.exports = router;