const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  component: { type: String, required: true },
  aircraftId: { type: String, required: true },
  date: { type: Date, required: true },
  failure: { type: Boolean, default: false },
  hoursSinceLastMaintenance: { type: Number, required: true },
  userId: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  notes: { type: String },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  }
});

module.exports = mongoose.model('Log', logSchema);