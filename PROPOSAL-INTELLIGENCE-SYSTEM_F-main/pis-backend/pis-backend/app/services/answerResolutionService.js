// ── AGENT 2b: ANSWER RESOLVER ─────────────────────
// Powers the 3-option answer column on the Questions page:
//   Option 1 (from_brief)       -> checks if brief already answers the question
//   Option 2 (flagged_to_client)-> no LLM call, just a status flag (handled in route)
//   Option 3 (draft_assumption) -> LLM drafts a first-pass assumption

const llmClient = require('../llm/client');
const PROMPTS = require('../prompts');

const resolveFromBrief = async (questionText, briefText, tenantId, opportunityId) => {
  const prompt = {
    ...PROMPTS.answer_resolution,
    userMessage: PROMPTS.answer_resolution.user('from_brief', questionText, briefText)
  };

  const result = await llmClient.extract_json({
    prompt,
    tenantId,
    opportunityId,
    agent: 'answer_resolver_from_brief'
  });

  return result; // { found, answer, source_snippet }
};

const draftAssumption = async (questionText, briefText, tenantId, opportunityId) => {
  const prompt = {
    ...PROMPTS.answer_resolution,
    userMessage: PROMPTS.answer_resolution.user('draft_assumption', questionText, briefText)
  };

  const result = await llmClient.extract_json({
    prompt,
    tenantId,
    opportunityId,
    agent: 'answer_resolver_draft_assumption'
  });

  return result; // { draft_answer, confidence, needs_validation }
};

module.exports = { resolveFromBrief, draftAssumption };