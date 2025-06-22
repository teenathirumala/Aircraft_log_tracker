const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'technician'], 
    default: 'technician' 
  },
  assignedAircraft: [{ type: String }], // Aircraft IDs this user can access
  fullName: { type: String },
  email: { type: String },
  department: { type: String, default: 'Maintenance' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('User', userSchema);