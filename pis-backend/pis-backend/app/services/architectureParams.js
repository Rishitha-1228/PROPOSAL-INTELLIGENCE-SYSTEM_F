// ── ARCHITECTURE DESIGN PARAMETERS & VALIDATION ──────────────
// Deterministic logic only — no LLM calls in this file.
// Adapted from the Stage 4 build spec (§5.3 default inference, §9.1 validation rules),
// scoped down to what this MVP's data model can actually support:
//   - duration/format/reinforcement/measurement_depth (not all 7 parameter groups)
//   - competency coverage, day overload, faculty overload, missing capstone
//     (not the full deterministic rule set, which assumes a richer block/element model)

// ── Pull a duration in days out of the free-text constraints Agent 1 produced ──
const parseDurationDays = (opportunity) => {
  const text = (opportunity.interpreted?.constraints || []).join(' ').toLowerCase();
  const match = text.match(/(\d+)\s*[- ]?\s*day/);
  if (match) return parseInt(match[1], 10);
  return 3; // fallback used by the spec for thin briefs
};

// ── Pull a format out of the same free-text constraints ──
const parseFormat = (opportunity) => {
  const text = (opportunity.interpreted?.constraints || []).join(' ').toLowerCase();
  if (text.includes('virtual')) return 'virtual';
  if (text.includes('hybrid') || text.includes('blended')) return 'hybrid';
  if (text.includes('modular')) return 'modular';
  return 'residential';
};

// ── Shape template inference (spec §5.3, group A) ──
const inferTemplate = (durationDays, format) => {
  if (durationDays <= 1) return 'intensive_1d';
  if (durationDays <= 3) return format === 'hybrid' ? 'hybrid_sprint' : 'intensive_3d';
  if (durationDays <= 6) return 'residential_5d';
  return 'modular_monthly';
};

// ── Reinforcement inference (spec §5.3, group E) ──
const inferReinforcement = (durationDays) => {
  if (durationDays <= 2) return 'light';
  if (durationDays <= 5) return 'medium';
  return 'heavy';
};

// ── Measurement depth inference (spec §5.3, group F) ──
const inferMeasurementDepth = (opportunity) => {
  const text = [
    ...(opportunity.interpreted?.goals || []),
    ...(opportunity.interpreted?.constraints || [])
  ].join(' ').toLowerCase();

  const businessKpiSignal = /\b(roi|revenue|kpi|business impact|cycle time|nps growth)\b/.test(text);
  const behaviourSignal = /\b(behaviour|behavior|on[- ]the[- ]job|manager involvement)\b/.test(text);

  if (businessKpiSignal) return 4;
  if (behaviourSignal) return 3;
  return 2;
};

// ── Build the full starting DesignParameters object for an opportunity ──
const inferDesignParameters = (opportunity) => {
  const total_duration_days = parseDurationDays(opportunity);
  const format = parseFormat(opportunity);
  return {
    total_duration_days,
    format,
    template: inferTemplate(total_duration_days, format),
    reinforcement: inferReinforcement(total_duration_days),
    measurement_depth: inferMeasurementDepth(opportunity)
  };
};

// ── Deterministic validation, run on a generated (or stored) architecture ──
// This is intentionally separate from whatever "validation" the LLM returns —
// the LLM's self-reported warnings are a hint, not a source of truth.
const computeDerivedMetrics = (architectureResult, opportunity, designParameters) => {
  const acceptedCompetencies = (opportunity.competencies || [])
    .filter((c) => c.decision !== 'rejected')
    .map((c) => c.competency_id);

  // ── Derive coverage from modules actually scheduled in the architecture,
  // cross-referenced against real module.competencies data — NOT from the
  // LLM's self-reported validation.competencies_covered, which is often
  // left empty and was previously making every architecture look like a
  // 0% coverage gap regardless of the real modules used. ──
  const scheduledModuleTitles = new Set(
    (architectureResult.phases || [])
      .flatMap((p) => p.blocks || [])
      .flatMap((b) => b.modules || [])
  );
  const scheduledModules = (opportunity.modules || [])
    .filter((m) => scheduledModuleTitles.has(m.title));
  const coveredByModules = new Set(
    scheduledModules.flatMap((m) => m.competencies_covered || [])
  );
  const missing = acceptedCompetencies.filter((id) => !coveredByModules.has(id));
  const covered = acceptedCompetencies.length - missing.length;

  // ── Faculty utilisation, computed from actual blocks, not self-reported ──
  const facultyHours = {};
  let totalHours = 0;
  (architectureResult.phases || []).forEach((phase) => {
    (phase.blocks || []).forEach((block) => {
      const hrs = Number(block.duration_hrs) || 0;
      totalHours += hrs;
      if (block.faculty) {
        facultyHours[block.faculty] = (facultyHours[block.faculty] || 0) + hrs;
      }
    });
  });
  const facultyUtilisation = Object.entries(facultyHours).map(([name, hours]) => ({
    name,
    hours,
    pct: totalHours ? Math.round((hours / totalHours) * 100) : 0
  }));

  const warnings = [];

  (architectureResult.phases || []).forEach((phase) => {
    const phaseHours = (phase.blocks || []).reduce((s, b) => s + (Number(b.duration_hrs) || 0), 0);
    if (phaseHours > 8) {
      warnings.push(`${phase.phase} is scheduled for ${phaseHours}h, above the 8h/day guideline`);
    }
  });

  if (missing.length > 0) {
    warnings.push(
      `${missing.length} accepted competenc${missing.length === 1 ? 'y is' : 'ies are'} not covered by any module: ${missing.join(', ')}`
    );
  }

  facultyUtilisation
    .filter((f) => f.pct > 35)
    .forEach((f) => warnings.push(`${f.name} carries ${f.pct}% of total contact hours, above the 35% guideline`));

  const durationDays = architectureResult.total_days || designParameters.total_duration_days;
  const hasCapstone = (architectureResult.phases || []).some(
    (p) =>
      /capstone/i.test(p.phase || '') ||
      (p.blocks || []).some((b) => /capstone/i.test(b.title || ''))
  );
  if (durationDays >= 3 && ['medium', 'heavy'].includes(designParameters.reinforcement) && !hasCapstone) {
    warnings.push('Programme is 3+ days with medium/heavy reinforcement but has no capstone element');
  }

  return {
    competency_coverage: { covered, total: acceptedCompetencies.length, missing },
    faculty_utilisation: facultyUtilisation,
    warnings
  };
};

module.exports = { inferDesignParameters, computeDerivedMetrics };