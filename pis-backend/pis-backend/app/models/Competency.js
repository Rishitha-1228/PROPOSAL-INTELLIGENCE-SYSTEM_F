const mongoose = require('mongoose');

const CompetencySchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true },
  cluster:    { type: String, required: true },
  name:       { type: String, required: true },
  definition: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Competency', CompetencySchema);