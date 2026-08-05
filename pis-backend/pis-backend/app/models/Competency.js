const mongoose = require('mongoose');

const CompetencySchema = new mongoose.Schema({
  tenant_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  id:         { type: String, required: true },
  cluster:    { type: String, required: true },
  name:       { type: String, required: true },
  definition: { type: String, required: true },
  // 'default'  -> part of the system's built-in framework, auto-seeded for every tenant
  // 'uploaded' -> this tenant replaced the default with their own framework
  source:     { type: String, enum: ['default', 'uploaded'], default: 'default' }
}, { timestamps: true });

// A given competency id must be unique per tenant, not globally,
// since two different tenants can both have a competency called "DAF02".
CompetencySchema.index({ tenant_id: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Competency', CompetencySchema);