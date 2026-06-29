// ── COMPETENCY EXCEL PARSER ────────────────────────
// Reads an uploaded .xlsx file and converts it into the same
// shape as the system default competencies: { id, cluster, name, definition }
//
// Column headers are matched flexibly (case-insensitive, common synonyms)
// so this works whether the sheet says "ID" or "Competency ID", etc.

const XLSX = require('xlsx');

const MAX_ROWS = 500; // sanity limit — a competency framework should never be larger than this

// Maps a variety of possible header spellings to our internal field names.
const HEADER_ALIASES = {
  id:         ['id', 'competency id', 'code', 'competency code', 'competency id (institution-defined)'],
  cluster:    ['cluster', 'category', 'theme', 'cluster name', 'group', 'cluster name (free text)'],
  name:       ['name', 'competency name', 'competency', 'title'],
  definition: ['definition', 'description', 'competency definition', 'details']
};

// If a sheet is named one of these (case-insensitive), use it directly
// instead of always defaulting to the first sheet. Listed in priority
// order — if a workbook has both a "Competencies" tab and an
// "Import_Template" tab (like the system default file does), the real
// data tab wins.
const PREFERRED_SHEET_NAMES = [
  'competencies',
  'competency framework',
  'framework',
  'data',
  'import_template',
  'import template'
];

const normaliseHeader = (header) => String(header || '').trim().toLowerCase();

// Picks the best sheet to read from: the highest-priority preferred-named
// sheet that actually has data rows, otherwise the first sheet in the workbook.
const selectSheet = (workbook) => {
  const namesLower = workbook.SheetNames.map(n => n.trim().toLowerCase());

  for (const preferred of PREFERRED_SHEET_NAMES) {
    const idx = namesLower.indexOf(preferred);
    if (idx === -1) continue;

    const candidateName = workbook.SheetNames[idx];
    const candidateSheet = workbook.Sheets[candidateName];
    const rows = XLSX.utils.sheet_to_json(candidateSheet, { header: 1, defaultValue: '' });

    // Skip sheets that exist by name but have no actual data rows
    // (e.g. an unfilled Import_Template), so we fall through to the
    // next preferred name or the default.
    const hasDataRow = rows.length > 1 && rows.slice(1).some(r => r.some(cell => String(cell).trim() !== ''));
    if (hasDataRow) {
      return { name: candidateName, sheet: candidateSheet };
    }
  }

  const fallbackName = workbook.SheetNames[0];
  return { name: fallbackName, sheet: workbook.Sheets[fallbackName] };
};

// Given the raw header row, build a map of { ourField: actualColumnIndex }
const resolveColumnMap = (headerRow) => {
  const normalised = headerRow.map(normaliseHeader);
  const map = {};

  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const colIndex = normalised.findIndex(h => aliases.includes(h));
    if (colIndex !== -1) map[field] = colIndex;
  }

  return map;
};

const parseCompetencyExcel = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded file has no sheets.');
  }

  const { name: sheetName, sheet } = selectSheet(workbook);
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defaultValue: '' });

  if (rows.length < 2) {
    throw new Error(
      `The "${sheetName}" sheet has no data rows below the header. ` +
      `If your competency data is on a different tab, rename that tab to "Competencies" and try again.`
    );
  }

  const headerRow = rows[0];
  const columnMap = resolveColumnMap(headerRow);

  const required = ['id', 'cluster', 'name', 'definition'];
  const missing = required.filter(f => columnMap[f] === undefined);

  if (missing.length > 0) {
    throw new Error(
      `On the "${sheetName}" sheet, could not find required column(s): ${missing.join(', ')}. ` +
      `Expected columns like Competency ID, Cluster Name, Competency Name, Definition.`
    );
  }

  const dataRows = rows.slice(1).filter(r => r.some(cell => String(cell).trim() !== ''));

  if (dataRows.length === 0) {
    throw new Error('No competency rows found below the header.');
  }

  if (dataRows.length > MAX_ROWS) {
    throw new Error(`This sheet has ${dataRows.length} rows, which exceeds the ${MAX_ROWS} row limit.`);
  }

  const parsed = dataRows.map((row, i) => {
    const id = String(row[columnMap.id] || '').trim();
    const cluster = String(row[columnMap.cluster] || '').trim();
    const name = String(row[columnMap.name] || '').trim();
    const definition = String(row[columnMap.definition] || '').trim();

    if (!id || !name || !definition) {
      throw new Error(`Row ${i + 2} is missing a required value (id, name, or definition).`);
    }

    return { id, cluster: cluster || 'Uncategorised', name, definition };
  });

  // Reject duplicate ids within the same upload
  const seen = new Set();
  for (const row of parsed) {
    if (seen.has(row.id)) {
      throw new Error(`Duplicate competency id "${row.id}" found in the uploaded sheet.`);
    }
    seen.add(row.id);
  }

  return parsed;
};

module.exports = { parseCompetencyExcel };