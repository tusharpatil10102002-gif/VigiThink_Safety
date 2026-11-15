const mongoose = require('mongoose');

const DraftSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  minimize: false
});

module.exports = mongoose.model('Draft', DraftSchema);
