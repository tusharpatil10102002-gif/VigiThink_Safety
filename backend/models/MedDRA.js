const mongoose = require('mongoose');

const MedDRASchema = new mongoose.Schema({
  soc: { type: String, default: '', index: true },
  soc_code: { type: String, default: '' },
  hlgt: { type: String, default: '' },
  hlgt_code: { type: String, default: '' },
  hlt: { type: String, default: '' },
  hlt_code: { type: String, default: '' },
  pt: { type: String, default: '', index: true },
  pt_code: { type: String, default: '' },
  llt: { type: String, default: '', index: true },
  llt_code: { type: String, default: '' },
  synonyms: { type: [String], default: [] }
});

module.exports = mongoose.model('MedDRA', MedDRASchema);
