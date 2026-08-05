// ── AGENT 2: QUESTION GENERATOR ───────────────────
// Model: Sonnet (quality matters here)
// Input: interpreted opportunity data
// Output: 20 discovery questions across 8 themes

const llmClient = require('../llm/client');
const PROMPTS = require('../prompts');

const generateQuestions = async (interpreted, tenantId, opportunityId) => {
  // Build prompt with interpreted data
  const prompt = {
    ...PROMPTS.question_generation,
    userMessage: PROMPTS.question_generation.user(interpreted)
  };

  // Call LLM client
  const result = await llmClient.extract_json({
    prompt,
    tenantId,
    opportunityId,
    agent: 'question_generator'
  });

  // Validate output
  if (!result.questions || !Array.isArray(result.questions)) {
    throw new Error('Question generator returned invalid format');
  }

  // Check minimum questions
  if (result.questions.length < 10) {
    throw new Error(`Too few questions generated: ${result.questions.length}. Expected 18-24.`);
  }

  // Add default fields to each question
  const questions = result.questions.map((q, index) => ({
    theme_code: q.theme_code,
    question_text: q.question_text,
    rationale: q.rationale,
    status: 'selected',
    capture_state: 'not_asked',
    answer_text: null,
    display_order: index + 1
  }));

  console.log(`✅ Generated ${questions.length} questions across themes`);
  return questions;
};

module.exports = { generateQuestions };