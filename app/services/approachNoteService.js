// ── AGENT 6: APPROACH NOTE WRITER ────────────────
//  most important agent
// Uses Sonnet — highest quality model
// Generates 7-section client-facing proposal

const llmClient = require('../llm/client');
const PROMPTS = require('../prompts');

const writeApproachNote = async (opportunity) => {
  console.log('✍️  Agent 6: Writing approach note with Claude Sonnet...');
  console.log('⏳ This takes 15-20 seconds — Sonnet generates high quality text...');

  const prompt = {
    ...PROMPTS.approach_note,
    userMessage: PROMPTS.approach_note.user(opportunity)
  };

  const result = await llmClient.extract_json({
    prompt,
    tenantId: opportunity.tenant_id,
    opportunityId: opportunity._id,
    agent: 'approach_note_writer'
  });

  if (!result.sections) {
    throw new Error('Approach note writer returned invalid format');
  }

  // Check all 7 sections are present
  const required = [
    'context_and_challenge',
    'programme_philosophy',
    'learning_journey',
    'faculty_bench',
    'evaluation_approach',
    'analogous_engagements',
    'commercial_terms'
  ];

  const missing = required.filter(s => !result.sections[s]);
  if (missing.length > 0) {
    console.warn(`⚠️ Missing sections: ${missing.join(', ')}`);
  }

  console.log(`✅ Approach note written — ${result.word_count || 'unknown'} words`);
  return result;
};

module.exports = { writeApproachNote };