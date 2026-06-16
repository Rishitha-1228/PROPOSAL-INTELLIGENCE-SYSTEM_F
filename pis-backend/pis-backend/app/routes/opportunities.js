const express = require('express');
const router = express.Router();
const Opportunity = require('../models/Opportunity');
const { interpretBrief } = require('../services/interpretationService');
const { generateQuestions } = require('../services/questionService');
const { protect, requireRole } = require('../middleware/auth');
const { buildArchitecture } = require('../services/architectureService');
const { writeApproachNote } = require('../services/approachNoteService');
const { scoreProposal } = require('../services/scoringService');
const { mapCompetencies } = require('../services/competencyService');
const { recommendModules } = require('../services/moduleService');

// ── POST /api/opportunities ───────────────────────
router.post('/',
  protect,
  requireRole('admin', 'editor'),
  async (req, res) => {
    const { client_name, brief_text, due_date } = req.body;

    if (!client_name || !brief_text) {
      return res.status(400).json({ error: 'client_name and brief_text are required' });
    }

    try {
      const opportunity = await Opportunity.create({
        tenant_id: req.user.id,
        client_name,
        brief_text,
        due_date,
        status: 'interpreting'
      });

      console.log(`📋 New opportunity: ${client_name} by ${req.user.email}`);
      console.log('🤖 Agent 1: Interpreting brief...');

      const interpreted = await interpretBrief(brief_text, req.user.id, opportunity._id);

      // ✅ FIXED: use findByIdAndUpdate to avoid version conflicts
      const updated = await Opportunity.findByIdAndUpdate(
        opportunity._id,
        { $set: { interpreted, status: 'interpreted' } },
        { new: true }
      );

      res.status(201).json({
        success: true,
        opportunity_id: updated._id,
        client_name: updated.client_name,
        interpreted,
        next_step: `POST /api/opportunities/${updated._id}/questions`
      });

    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── POST /api/opportunities/:id/questions ─────────
router.post('/:id/questions',
  protect,
  requireRole('admin', 'editor'),
  async (req, res) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);

      if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });

      if (!opportunity.interpreted || !opportunity.interpreted.goals) {
        return res.status(400).json({
          error: 'Run brief interpretation first',
          hint: `POST /api/opportunities/${req.params.id}/interpret`
        });
      }

      // ✅ GUARD: already has questions, don't re-run
      if (opportunity.questions && opportunity.questions.length > 0) {
        return res.json({
          success: true,
          message: 'Questions already generated',
          questions: opportunity.questions,
          count: opportunity.questions.length
        });
      }

      console.log(`🤖 Agent 2: Generating questions for ${opportunity.client_name}...`);

      const questions = await generateQuestions(opportunity.interpreted, req.user.id, opportunity._id);

      // ✅ FIXED: use findByIdAndUpdate
      const updated = await Opportunity.findByIdAndUpdate(
        opportunity._id,
        { $set: { questions, status: 'questions_ready' } },
        { new: true }
      );

      const grouped = questions.reduce((acc, q) => {
        if (!acc[q.theme_code]) acc[q.theme_code] = [];
        acc[q.theme_code].push(q);
        return acc;
      }, {});

      res.json({
        success: true,
        opportunity_id: updated._id,
        client_name: updated.client_name,
        total_questions: questions.length,
        questions_by_theme: grouped,
        next_step: `POST /api/opportunities/${updated._id}/competencies`
      });

    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── GET /api/opportunities ────────────────────────
router.get('/',
  protect,
  async (req, res) => {
    try {
      const filter = req.user.role === 'admin' ? {} : { tenant_id: req.user.id };

      const opportunities = await Opportunity.find(filter)
        .select('client_name status outcome due_date createdAt interpreted.goals')
        .sort({ createdAt: -1 });

      res.json({ success: true, count: opportunities.length, data: opportunities });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── GET /api/opportunities/:id ────────────────────
router.get('/:id',
  protect,
  async (req, res) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);
      if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });
      res.json({ success: true, data: opportunity });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── PATCH /api/opportunities/:id/questions/:questionIndex ──
router.patch('/:id/questions/:questionIndex',
  protect,
  requireRole('admin', 'editor'),
  async (req, res) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);
      if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });

      const index = parseInt(req.params.questionIndex);
      if (index < 0 || index >= opportunity.questions.length) {
        return res.status(400).json({ error: 'Invalid question index' });
      }

      const { answer_text, status, capture_state, question_text } = req.body;
      if (answer_text !== undefined)   opportunity.questions[index].answer_text   = answer_text;
      if (status !== undefined)        opportunity.questions[index].status        = status;
      if (capture_state !== undefined) opportunity.questions[index].capture_state = capture_state;
      if (question_text !== undefined) opportunity.questions[index].question_text = question_text;

      // questions subdoc patch still needs .save() — that's fine here since it's a single targeted update
      await opportunity.save();

      res.json({ success: true, question: opportunity.questions[index] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── POST /api/opportunities/:id/competencies ──────
router.post('/:id/competencies',
  protect,
  requireRole('admin', 'editor'),
  async (req, res) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);

      if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });

      if (!opportunity.interpreted?.goals) {
        return res.status(400).json({ error: 'Run brief interpretation first' });
      }

      // ✅ GUARD: already mapped, don't re-run
      if (opportunity.competencies && opportunity.competencies.length > 0) {
        return res.json({
          success: true,
          message: 'Competencies already mapped',
          opportunity_id: opportunity._id,
          client_name: opportunity.client_name,
          total_competencies: opportunity.competencies.length,
          competencies: opportunity.competencies,
          next_step: `POST /api/opportunities/${opportunity._id}/modules`
        });
      }

      console.log(`🤖 Agent 3: Mapping competencies for ${opportunity.client_name}...`);

      const competencies = await mapCompetencies(opportunity.interpreted, req.user.id, opportunity._id);

      // ✅ FIXED: use findByIdAndUpdate — eliminates version conflict
      const updated = await Opportunity.findByIdAndUpdate(
        opportunity._id,
        { $set: { competencies, status: 'competencies_mapped' } },
        { new: true }
      );

      res.json({
        success: true,
        opportunity_id: updated._id,
        client_name: updated.client_name,
        total_competencies: competencies.length,
        competencies,
        next_step: `POST /api/opportunities/${updated._id}/modules`
      });

    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── POST /api/opportunities/:id/modules ───────────
router.post('/:id/modules',
  protect,
  requireRole('admin', 'editor'),
  async (req, res) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);

      if (!opportunity) return res.status(404).json({ error: 'Opportunity not found' });

      if (!opportunity.competencies?.length) {
        return res.status(400).json({ error: 'Run competency mapping first' });
      }

      // ✅ GUARD: already recommended
      if (opportunity.modules && opportunity.modules.length > 0) {
        return res.json({
          success: true,
          message: 'Modules already recommended',
          opportunity_id: opportunity._id,
          client_name: opportunity.client_name,
          total_modules: opportunity.modules.length,
          modules: opportunity.modules,
          next_step: `POST /api/opportunities/${opportunity._id}/approach-note`
        });
      }

      console.log(`🤖 Agent 4: Recommending modules for ${opportunity.client_name}...`);

      const modules = await recommendModules(opportunity.competencies, req.user.id, opportunity._id);

      // ✅ FIXED: use findByIdAndUpdate
      const updated = await Opportunity.findByIdAndUpdate(
        opportunity._id,
        { $set: { modules, status: 'modules_recommended' } },
        { new: true }
      );

      res.json({
        success: true,
        opportunity_id: updated._id,
        client_name: updated.client_name,
        total_modules: modules.length,
        modules,
        next_step: `POST /api/opportunities/${updated._id}/approach-note`
      });

    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── POST /api/opportunities/:id/architecture ──────
router.post('/:id/architecture',
  protect,
  requireRole('admin', 'editor'),
  async (req, res) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);
      if (!opportunity) return res.status(404).json({ error: 'Not found' });

      if (!opportunity.modules?.length) {
        return res.status(400).json({ error: 'Run module recommendation first' });
      }

      console.log(`🤖 Agent 5: Building architecture for ${opportunity.client_name}...`);

      const architecture = await buildArchitecture(opportunity);

      // ✅ FIXED: use findByIdAndUpdate
      const updated = await Opportunity.findByIdAndUpdate(
        opportunity._id,
        { $set: { architecture, status: 'architecture_built' } },
        { new: true }
      );

      res.json({
        success: true,
        opportunity_id: updated._id,
        client_name: updated.client_name,
        architecture,
        next_step: `POST /api/opportunities/${updated._id}/approach-note`
      });
    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── POST /api/opportunities/:id/approach-note ─────
router.post('/:id/approach-note',
  protect,
  requireRole('admin', 'editor'),
  async (req, res) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);
      if (!opportunity) return res.status(404).json({ error: 'Not found' });

      if (!opportunity.modules?.length) {
        return res.status(400).json({ error: 'Run module recommendation first' });
      }

      console.log(`🤖 Agent 6: Writing approach note for ${opportunity.client_name}...`);

      const approachNote = await writeApproachNote(opportunity);

      // ✅ FIXED: use findByIdAndUpdate
      const updated = await Opportunity.findByIdAndUpdate(
        opportunity._id,
        { $set: { approach_note: approachNote, status: 'approach_note_written' } },
        { new: true }
      );

      res.json({
        success: true,
        opportunity_id: updated._id,
        client_name: updated.client_name,
        approach_note: approachNote,
        next_step: `POST /api/opportunities/${updated._id}/score`
      });
    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── POST /api/opportunities/:id/score ─────────────
router.post('/:id/score',
  protect,
  requireRole('admin', 'editor'),
  async (req, res) => {
    try {
      const opportunity = await Opportunity.findById(req.params.id);
      if (!opportunity) return res.status(404).json({ error: 'Not found' });

      if (!opportunity.approach_note?.sections) {
        return res.status(400).json({ error: 'Write approach note first' });
      }

      console.log(`🤖 Scoring proposal for ${opportunity.client_name}...`);

      const score = await scoreProposal(opportunity);
      const status = score.can_export ? 'ready_to_export' : 'needs_improvement';

      // ✅ FIXED: use findByIdAndUpdate
      const updated = await Opportunity.findByIdAndUpdate(
        opportunity._id,
        { $set: { score, status } },
        { new: true }
      );

      res.json({
        success: true,
        opportunity_id: updated._id,
        client_name: updated.client_name,
        score,
        status: updated.status,
        next_step: score.can_export
          ? `GET /api/opportunities/${updated._id} to see full proposal`
          : 'Fix the gaps listed above then re-score'
      });
    } catch (err) {
      console.error('Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;