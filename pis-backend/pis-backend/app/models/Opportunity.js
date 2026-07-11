const { ReturnDocument } = require('mongodb');
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
    rationale:       String,
    // 'accepted' | 'rejected' | null (undecided — treated as accepted by
    // default downstream, since most mapped competencies are expected to
    // be kept unless the BD Manager actively rejects one)
    decision:        { type: String, enum: ['accepted', 'rejected', null], default: null }
  }],

 // Agent 4 output — Module Recommender
  modules: [{
    module_id:            String,
    title:                String,
    domain:               String,
    duration_hrs:         Number,
    faculty:              String,
    evidence:             String,
    nps:                  Number,
    competencies_covered: [String]  // which of the accepted competencies this
                                     // specific module covers — set by Agent 4,
                                     // used by Architecture's coverage check
  }],

  // Agent 5 output — Architecture Builder
  architecture: {
    phases:             mongoose.Schema.Types.Mixed,

    // ── Design parameters used to generate this architecture ──
    // Either inferred automatically (first generation) or set by the
    // BD Manager and passed in on a regenerate call.
    design_parameters: {
      total_duration_days: Number,
      format:               String, // 'residential' | 'hybrid' | 'virtual' | 'modular'
      template:             String, // 'intensive_1d' | 'intensive_3d' | 'residential_5d' | 'hybrid_sprint' | 'modular_monthly'
      reinforcement:        String, // 'light' | 'medium' | 'heavy'
      measurement_depth:    Number  // 1-4
    },

    // ── Deterministic, code-computed metrics — separate from the LLM's own
    // self-reported "validation" field, which is kept only as a hint ──
    derived_metrics: {
      competency_coverage: {
        covered: Number,
        total:   Number,
        missing: [String]
      },
      faculty_utilisation: [{
        name:  String,
        hours: Number,
        pct:   Number
      }],
      warnings: [String]
    },

    // ── Short LLM-written explanation of the design choices, shown to the BD Manager ──
    rationale: {
      shape_reason:      String,
      sequencing_reason: String
    }
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

