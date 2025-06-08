const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  component: { type: String, required: true },
  aircraftId: { type: String, required: true },
  date: { type: Date, required: true },
  failure: { type: Boolean, default: false },
  hoursSinceLastMaintenance: { type: Number, required: true },
  userId: { type: String, required: true },
});

module.exports = mongoose.model('Log', logSchema);