// ── COMPETENCY FRAMEWORK SERVICE ──────────────────
// Ensures every tenant has a usable competency framework:
//   - If the tenant has never set one up, the system default —
//     parsed live from app/data/defaults/PIS_Default_Competency_Framework.xlsx,
//     the same file an institution would otherwise upload themselves —
//     is copied in under their tenant_id.
//   - If the tenant has uploaded their own framework, that
//     uploaded set is used instead, and is never overwritten
//     by the default again unless the tenant explicitly resets it.
//
// Both the built-in default and any tenant upload go through the exact
// same Excel parser (competencyExcelParser.js), so there is one single
// code path for "load a competency framework from a spreadsheet" —
// the default file is simply read automatically instead of via an upload.

const fs = require('fs');
const path = require('path');
const Competency = require('../models/Competency');
const { parseCompetencyExcel } = require('./competencyExcelParser');

const DEFAULT_FRAMEWORK_PATH = path.join(__dirname, '../data/defaults/PIS_Default_Competency_Framework.xlsx');

// Parsed once per server process and cached, since the default file on
// disk does not change while the server is running.
let cachedDefaultRows = null;

const loadDefaultFrameworkRows = () => {
  if (cachedDefaultRows) return cachedDefaultRows;

  if (!fs.existsSync(DEFAULT_FRAMEWORK_PATH)) {
    throw new Error(
      `Default competency framework file is missing at ${DEFAULT_FRAMEWORK_PATH}. ` +
      `Place PIS_Default_Competency_Framework.xlsx in app/data/defaults/.`
    );
  }

  const buffer = fs.readFileSync(DEFAULT_FRAMEWORK_PATH);
  cachedDefaultRows = parseCompetencyExcel(buffer);

  console.log(`📚 Loaded system default competency framework: ${cachedDefaultRows.length} competencies`);
  return cachedDefaultRows;
};

// Returns the active competency list for a tenant, seeding the
// default framework on first use if the tenant has nothing yet.
const getCompetenciesForTenant = async (tenantId) => {
  let existing = await Competency.find({ tenant_id: tenantId })
    .select('id name definition cluster source');

  if (existing.length > 0) {
    return existing;
  }

  // First time this tenant has needed competencies — seed the default set
  // by parsing the real default Excel file.
  console.log(`📚 No competency framework found for tenant ${tenantId}, seeding system default`);

  const defaultRows = loadDefaultFrameworkRows();

  const seeded = defaultRows.map(c => ({
    tenant_id: tenantId,
    id: c.id,
    cluster: c.cluster,
    name: c.name,
    definition: c.definition,
    source: 'default'
  }));

  await Competency.insertMany(seeded);

  existing = await Competency.find({ tenant_id: tenantId })
    .select('id name definition cluster source');

  return existing;
};

// Replaces a tenant's competency framework with an uploaded one.
// This permanently removes their previous set (default or uploaded)
// and inserts the new rows in its place.
const replaceCompetenciesForTenant = async (tenantId, parsedRows) => {
  await Competency.deleteMany({ tenant_id: tenantId });

  const toInsert = parsedRows.map(row => ({
    tenant_id: tenantId,
    id: row.id,
    cluster: row.cluster,
    name: row.name,
    definition: row.definition,
    source: 'uploaded'
  }));

  await Competency.insertMany(toInsert);

  return toInsert.length;
};

// Resets a tenant back to the system default framework,
// discarding whatever they had uploaded.
const resetTenantToDefault = async (tenantId) => {
  await Competency.deleteMany({ tenant_id: tenantId });
  return getCompetenciesForTenant(tenantId);
};

module.exports = {
  getCompetenciesForTenant,
  replaceCompetenciesForTenant,
  resetTenantToDefault
};