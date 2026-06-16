// Sir's requirement: track every AI call for cost monitoring
const mongoose = require('mongoose');

const LLMCallSchema = new mongoose.Schema({
  tenant_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  opportunity_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Opportunity' },
  agent:         String,   // which agent called this
  model:         String,   // which model was used
  input_tokens:  Number,
  output_tokens: Number,
  cost_usd:      Number,   // calculated cost
  latency_ms:    Number,   // how long it took
  success:       Boolean,
  error:         String
}, { timestamps: true });

module.exports = mongoose.model('LLMCall', LLMCallSchema);