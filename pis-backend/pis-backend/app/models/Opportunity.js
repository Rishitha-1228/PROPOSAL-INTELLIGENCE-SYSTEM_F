const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema({
  tenant_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  client_name:  { type: String, required: true },
  brief_text:   { type: String, required: true },

  // Agent 1 output — Brief Interpreter
  interpreted: {
    goals:               [String],
    audience:            String,
    constraints:         [String],
    themes:              [String],
    pedagogical_posture: String,
    confidence_score:    Number,
    ambiguities:         [String]
  },

  // Agent 2 output — Question Generator
  questions: [{
    theme_code:     String,
    question_text:  String,
    rationale:      String,
    status:         { type: String, default: 'selected' },
    answer_text:    String,
    capture_state:  { type: String, default: 'not_asked' },

    // ── answer-source tracking ────────────────
    // 'from_brief'        -> Option 1: answer pulled from client requirement doc
    // 'flagged_to_client' -> Option 2: not in brief, needs to go back to client
    // 'draft_assumption'  -> Option 3: AI-drafted assumption / first-draft answer
    answer_source:  { type: String, enum: ['from_brief', 'flagged_to_client', 'draft_assumption', null], default: null },

    // ── framework tagging ──
    framework_used: { type: String, default: null }
  }],

  // Agent 3 output — Competency Mapper
  competencies: [{
    competency_id:   String,
    competency_name: String,
    cluster:         String,
    definition:      String,
    fit_score:       Number,
    rationale:       String
  }],

  // Agent 4 output — Module Recommender
  modules: [{
    module_id:   String,
    title:       String,
    domain:      String,
    duration_hrs:Number,
    faculty:     String,
    evidence:    String,
    nps:         Number
  }],

  // Agent 5 output — Architecture Builder
  architecture: {
    phases: mongoose.Schema.Types.Mixed
  },

  // Agent 6 output — Approach Note Writer
  approach_note: {
    sections: mongoose.Schema.Types.Mixed,
    version:  { type: Number, default: 1 }
  },

  // Proposal scoring
  score: {
    total:        Number,
    breakdown:    mongoose.Schema.Types.Mixed,
    gaps:         [String]
  },

  status:    { type: String, default: 'new' },
  outcome:   { type: String, enum: ['pending', 'won', 'lost'], default: 'pending' },
  due_date:  Date

}, { timestamps: true });

module.exports = mongoose.model('Opportunity', OpportunitySchema);