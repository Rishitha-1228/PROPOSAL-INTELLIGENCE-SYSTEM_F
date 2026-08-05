// ── AGENT 5: ARCHITECTURE BUILDER ────────────────
// Builds day-by-day programme schedule
// from confirmed modules, constraints, and design parameters

const llmClient = require('../llm/client');
const PROMPTS = require('../prompts');
const { inferDesignParameters, computeDerivedMetrics } = require('./architectureParams');

// designParametersOverride: a partial object the BD Manager may have set
// (e.g. { reinforcement: 'heavy' }) — anything not overridden falls back
// to the inferred defaults for this opportunity.
const buildArchitecture = async (opportunity, designParametersOverride = {}) => {
  const inferredDefaults = inferDesignParameters(opportunity);
  const designParameters = { ...inferredDefaults, ...designParametersOverride };

  const prompt = {
    ...PROMPTS.architecture_builder,
    userMessage: PROMPTS.architecture_builder.user(opportunity, designParameters)
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

  // ── Deterministic, code-computed metrics — not just the LLM's self-report ──
  const derivedMetrics = computeDerivedMetrics(result, opportunity, designParameters);

  console.log(`✅ Architecture built: ${result.total_days} days, ${result.total_hours} hours, ${derivedMetrics.warnings.length} warning(s)`);

  return {
    ...result,
    design_parameters: designParameters,
    derived_metrics: derivedMetrics,
    rationale: result.rationale || {}
  };
};

module.exports = { buildArchitecture };