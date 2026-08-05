// ── PROPOSAL SCORER ───────────────────────────────
// Evaluates proposal quality before export
//  rule: block export if score < 75

const llmClient = require('../llm/client');
const PROMPTS = require('../prompts');

const scoreProposal = async (opportunity) => {
  const prompt = {
    ...PROMPTS.proposal_scoring,
    userMessage: PROMPTS.proposal_scoring.user(opportunity)
  };

  const result = await llmClient.extract_json({
    prompt,
    tenantId: opportunity.tenant_id,
    opportunityId: opportunity._id,
    agent: 'proposal_scorer'
  });

  if (typeof result.total_score !== 'number') {
    throw new Error('Scorer returned invalid format');
  }

  console.log(`✅ Proposal scored: ${result.total_score}/100`);
  console.log(`   Can export: ${result.can_export ? 'YES' : 'NO — fix gaps first'}`);

  return result;
};

module.exports = { scoreProposal };