// ── AGENT 5: ARCHITECTURE BUILDER ────────────────
// Builds day-by-day programme schedule
// from confirmed modules and constraints

const llmClient = require('../llm/client');
const PROMPTS = require('../prompts');

const buildArchitecture = async (opportunity) => {
  const prompt = {
    ...PROMPTS.architecture_builder,
    userMessage: PROMPTS.architecture_builder.user(opportunity)
  };

  const result = await llmClient.extract_json({
    prompt,
    tenantId: opportunity.tenant_id,
    opportunityId: opportunity._id,
    agent: 'architecture_builder'
  });

  if (!result.phases || !Array.isArray(result.phases)) {
    throw new Error('Architecture builder returned invalid format');
  }

  console.log(`✅ Architecture built: ${result.total_days} days, ${result.total_hours} hours`);
  return result;
};

module.exports = { buildArchitecture };