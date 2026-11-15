const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  caseNumber: {
    type: String,
    required: true,
    index: true
  },
  field: {
    type: String,
    default: ''
  },
  oldValue: {
    type: String,
    default: ''
  },
  newValue: {
    type: String,
    default: ''
  },
  timestamp: {
    type: String,
    default: () => new Date().toISOString()
  },
  user: {
    type: String,
    default: ''
  },
  userName: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    default: 'Routine Update'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Audit', AuditSchema);
