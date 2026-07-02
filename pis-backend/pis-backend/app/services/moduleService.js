// ── AGENT 4: MODULE RECOMMENDER ───────────────────
// Model: Haiku (rationale generation)
// Input: mapped competencies
// Output: recommended modules with evidence
//  rule: match modules to competencies, show evidence

const llmClient = require('../llm/client');
const Module = require('../models/Module');

const recommendModules = async (competencies, tenantId, opportunityId) => {

  // Step 1: Filter out rejected competencies — only accepted or undecided
  // ones flow forward into module recommendation. This respects the BD
  // Manager's explicit rejection decisions from the Competency Mapping page.
  const activeCompetencies = competencies.filter(c => c.decision !== 'rejected');

  if (activeCompetencies.length === 0) {
    throw new Error('All competencies were rejected. Please accept at least one before proceeding.');
  }

  const competencyIds = activeCompetencies.map(c => c.competency_id);

  console.log(`🔍 Finding modules for competencies: ${competencyIds.join(', ')}`);

  // Step 2: Find modules that cover these competencies
  // This is the retrieval step — no AI needed here
  const matchedModules = await Module.find({
    competencies: { $in: competencyIds },
    status: 'Active'
  }).sort({ avg_nps: -1 });

  if (!matchedModules || matchedModules.length === 0) {
    // Fallback — return all active modules
    console.log('⚠️ No exact matches — returning top modules by NPS');
    const fallback = await Module.find({ status: 'Active' })
      .sort({ avg_nps: -1 })
      .limit(8);
    return formatModules(fallback, activeCompetencies);
  }

  // Step 3: Score each module
  // More competency matches = higher score
  const scored = matchedModules.map(module => {
    const matchCount = module.competencies.filter(c =>
      competencyIds.includes(c)
    ).length;
    return {
      module,
      matchCount,
      score: (matchCount * 20) + (module.avg_nps * 8)
    };
  });

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Take top 8 modules
  const top = scored.slice(0, 8).map(s => s.module);

  console.log(`✅ Recommended ${top.length} modules`);
  return formatModules(top, activeCompetencies);
};

// Format modules for response
const formatModules = (modules, competencies) => {
  return modules.map(m => {
    // Find which competencies this module covers
    const competencyIds = competencies.map(c => c.competency_id);
    const covered = m.competencies.filter(c => competencyIds.includes(c));

    return {
      module_id: m.module_id,
      title: m.title,
      domain: m.domain,
      duration_hrs: m.duration_hrs,
      format: m.format,
      audience_level: m.audience_level,
      faculty: m.lead_faculty,
      competencies_covered: covered,
      industry_tags: m.industry_tags,
      evidence: `Used ${m.times_used} times — NPS ${m.avg_nps}/10`,
      avg_nps: m.avg_nps,
      times_used: m.times_used
    };
  });
};

module.exports = { recommendModules };