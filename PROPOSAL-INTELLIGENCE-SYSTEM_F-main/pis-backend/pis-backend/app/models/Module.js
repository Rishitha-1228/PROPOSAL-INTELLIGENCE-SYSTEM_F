const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  tenant_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  module_id:        { type: String, required: true },
  title:            { type: String, required: true },
  short_description:{ type: String, required: true },
  domain:           { type: String, required: true },
  duration_hrs:     { type: Number, required: true },
  format:           { type: String },
  audience_level:   { type: String, enum: ['Mid', 'Senior', 'Top'] },
  competencies:     [String],
  lead_faculty:     String,
  industry_tags:    [String],
  times_used:       { type: Number, default: 0 },
  avg_nps:          { type: Number, default: 0 },
  status:           { type: String, enum: ['Active', 'Archived'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Module', ModuleSchema);