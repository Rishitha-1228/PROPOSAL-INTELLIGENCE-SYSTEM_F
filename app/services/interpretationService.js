// ── AGENT 1: BRIEF INTERPRETER ────────────────────
// Model: Haiku (fast + cheap)
// Input: raw brief text
// Output: structured opportunity data
// Sir's rule: temperature 0, max 400 tokens

const llmClient = require('../llm/client');
const PROMPTS = require('../prompts');

const interpretBrief = async (briefText, tenantId, opportunityId) => {
  // Build the prompt with actual brief inserted
  const prompt = {
    ...PROMPTS.brief_interpretation,
    userMessage: PROMPTS.brief_interpretation.user(briefText)
  };

  // Call the LLM client
  const result = await llmClient.extract_json({
    prompt,
    tenantId,
    opportunityId,
    agent: 'brief_interpreter'
  });

  // Validate we got what we need — goals/audience are now { value, confidence, source }
  // objects, not plain values, so check the nested .value.
  if (!result.goals?.value?.length || !result.audience?.value) {
    throw new Error('Interpretation incomplete — missing goals or audience');
  }

  return result;
};

module.exports = { interpretBrief };