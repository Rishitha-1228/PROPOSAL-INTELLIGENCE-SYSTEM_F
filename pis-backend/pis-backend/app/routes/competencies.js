const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, requireRole } = require('../middleware/auth');
const { parseCompetencyExcel } = require('../services/competencyExcelParser');
const {
  getCompetenciesForTenant,
  replaceCompetenciesForTenant,
  resetTenantToDefault
} = require('../services/competencyFrameworkService');

// In-memory storage — we only need the buffer long enough to parse it,
// nothing is written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (req, file, cb) => {
    const okTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    if (!okTypes.includes(file.mimetype)) {
      return cb(new Error('Please upload a .xlsx or .xls file'));
    }
    cb(null, true);
  }
});

// ── GET /api/competencies ─────────────────────────
// Returns the current tenant's active competency framework,
// seeding the default set automatically on first use.
router.get('/', protect, async (req, res) => {
  try {
    const competencies = await getCompetenciesForTenant(req.user.id);
    const source = competencies[0]?.source || 'default';

    res.json({
      success: true,
      source,
      count: competencies.length,
      competencies
    });
  } catch (err) {
    console.error('Error loading competencies:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/competencies/upload ─────────────────
// Replaces the tenant's competency framework with an uploaded Excel file.
router.post('/upload',
  protect,
  requireRole('admin', 'editor'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log(`📤 Parsing uploaded competency framework: ${req.file.originalname}`);

      const parsedRows = parseCompetencyExcel(req.file.buffer);
      const count = await replaceCompetenciesForTenant(req.user.id, parsedRows);

      console.log(`✅ Replaced competency framework for tenant ${req.user.id} — ${count} competencies`);

      res.json({
        success: true,
        message: `Uploaded framework applied — ${count} competencies loaded`,
        source: 'uploaded',
        count
      });
    } catch (err) {
      console.error('Error uploading competency framework:', err.message);
      res.status(400).json({ error: err.message });
    }
  }
);

// ── POST /api/competencies/reset ──────────────────
// Discards the tenant's uploaded framework and restores the system default.
router.post('/reset',
  protect,
  requireRole('admin', 'editor'),
  async (req, res) => {
    try {
      const competencies = await resetTenantToDefault(req.user.id);

      res.json({
        success: true,
        message: 'Restored the default competency framework',
        source: 'default',
        count: competencies.length,
        competencies
      });
    } catch (err) {
      console.error('Error resetting competency framework:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;