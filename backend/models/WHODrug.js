const mongoose = require('mongoose');

const WHODrugSchema = new mongoose.Schema({
  trade_name: { type: String, default: '', index: true },
  generic_name: { type: String, default: '', index: true },
  drug_code: { type: String, default: '' },
  formulation: { type: String, default: '' },
  concentration: { type: String, default: '' },
  manufacturer: { type: String, default: '' },
  atc_code: { type: String, default: '' },
  atc_description: { type: String, default: '' },
  country: { type: String, default: '' }
});

module.exports = mongoose.model('WHODrug', WHODrugSchema);
