const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  workflowState: {
    type: String,
    default: 'Case Triage',
    index: true
  },
  isValidIcsr: {
    type: Boolean,
    default: false
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  companyReceivedDate: {
    type: String,
    default: ''
  },
  dayZero: {
    type: String,
    default: null
  },
  assignedUser: {
    type: String,
    default: ''
  },
  owner: {
    type: String,
    default: ''
  },
  lockState: {
    type: String,
    default: 'Unlocked'
  },
  lockedBy: {
    type: String,
    default: null
  },
  priority: {
    type: String,
    default: 'Routine'
  },
  deadline: {
    type: String,
    default: ''
  },
  general: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  patient: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  products: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  events: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  narrative: {
    type: String,
    default: ''
  },
  analysis: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  activities: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  additionalInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  minimize: false
});

module.exports = mongoose.model('Case', CaseSchema);
