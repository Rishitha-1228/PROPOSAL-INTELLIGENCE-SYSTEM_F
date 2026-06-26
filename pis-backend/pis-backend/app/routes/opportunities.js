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
const { resolveFromBrief, draftAssumption } = require('../services/answerResolutionService');

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
      // ── Reuse check: same tenant + same client_name + same brief_text ──
      // If this exact brief has already been analysed, return the EXISTING
      // opportunity (with its existing interpretation, questions, answers, etc.)
      // instead of creating a duplicate and re-running the AI agents.
      const existing = await Opportunity.findOne({
        tenant_id: req.user.id,
        client_name,
        brief_text
      }).sort({ createdAt: -1 });

      if (existing) {
        console.log(`♻️  Reusing existing opportunity for ${client_name} (same brief already analysed)`);
        return res.status(200).json({
          success: true,
          reused: true,
          opportunity_id: existing._id,
          client_name: existing.client_name,
          interpreted: existing.interpreted,
          next_step: existing.questions?.length
            ? `Questions already generated — go straight to the Questions page`
            : `POST /api/opportunities/${existing._id}/questions`
        });
      }

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

      const updated = await Opportunity.findByIdAndUpdate(
        opportunity._id,
        { $set: { interpreted, status: 'interpreted' } },
        { new: true }
      );

      res.status(201).json({
        success: true,
        reused: false,
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
        const groupedExisting = opportunity.questions.reduce((acc, q) => {
          if (!acc[q.theme_code]) acc[q.theme_code] = [];
          acc[q.theme_code].push(q);
          return acc;
        }, {});

        return res.json({
          success: true,
          message: 'Questions already generated',
          opportunity_id: opportunity._id,
          client_name: opportunity.client_name,
          total_questions: opportunity.questions.length,
          questions_by_theme: groupedExisting
        });
      }

      console.log(`🤖 Agent 2: Generating questions for ${opportunity.client_name}...`);

      const questions = await generateQuestions(opportunity.interpreted, req.user.id, opportunity._id);

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

      const { answer_text, status, capture_state, question_text, answer_source, framework_used } = req.body;
      if (answer_text !== undefined)    opportunity.questions[index].answer_text    = answer_text;
      if (status !== undefined)         opportunity.questions[index].status         = status;
      if (capture_state !== undefined)  opportunity.questions[index].capture_state  = capture_state;
      if (question_text !== undefined)  opportunity.questions[index].question_text  = question_text;
      if (answer_source !== undefined)  opportunity.questions[index].answer_source  = answer_source;
      if (framework_used !== undefined) opportunity.questions[index].framework_used = framework_used;

      await opportunity.save();

      res.json({ success: true, question: opportunity.questions[index] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── POST /api/opportunities/:id/questions/:questionIndex/resolve ──
// Powers the 3-option answer column.
// body: { mode: 'from_brief' | 'flagged_to_client' | 'draft_assumption' }
router.post('/:id/questions/:questionIndex/resolve',
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

      const { mode } = req.body;
      if (!['from_brief', 'flagged_to_client', 'draft_assumption'].includes(mode)) {
        return res.status(400).json({ error: 'mode must be from_brief, flagged_to_client, or draft_assumption' });
      }

      const question = opportunity.questions[index];

      if (mode === 'flagged_to_client') {
        question.answer_source = 'flagged_to_client';
        question.capture_state = 'pending_client';
        question.answer_text = question.answer_text || 'Not addressed in client brief — flagged to revert to client for input.';
        await opportunity.save();
        return res.json({ success: true, mode, question });
      }

      if (mode === 'from_brief') {
        console.log(`🤖 Resolving answer from brief for Q${index}...`);
        const result = await resolveFromBrief(
          question.question_text,
          opportunity.brief_text,
          req.user.id,
          opportunity._id
        );

        if (!result.found) {
          return res.json({
            success: true,
            mode,
            found: false,
            message: 'Brief does not clearly answer this question. Try "Draft assumption" or flag it to the client instead.'
          });
        }

        question.answer_source = 'from_brief';
        question.capture_state = 'answered';
        question.answer_text = result.answer;
        await opportunity.save();

        return res.json({ success: true, mode, found: true, source_snippet: result.source_snippet, question });
      }

      if (mode === 'draft_assumption') {
        console.log(`🤖 Drafting assumption for Q${index}...`);
        const result = await draftAssumption(
          question.question_text,
          opportunity.brief_text,
          req.user.id,
          opportunity._id
        );

        question.answer_source = 'draft_assumption';
        question.capture_state = 'draft';
        question.answer_text = result.draft_answer;
        await opportunity.save();

        return res.json({ success: true, mode, confidence: result.confidence, question });
      }

    } catch (err) {
      console.error('Error resolving answer:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

// ── PATCH /api/opportunities/:id/questions/:questionIndex/framework ──
router.patch('/:id/questions/:questionIndex/framework',
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

      opportunity.questions[index].framework_used = req.body.framework_used ?? null;
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
      // Return cached result if already built, unless force regenerate requested
if (opportunity.architecture?.phases?.length > 0 && req.query.regenerate !== 'true') {
  return res.json({
    success: true,
    message: 'Architecture already built',
    opportunity_id: opportunity._id,
    client_name: opportunity.client_name,
    architecture: opportunity.architecture,
    next_step: `POST /api/opportunities/${opportunity._id}/approach-note`
  });
}

      console.log(`🤖 Agent 5: Building architecture for ${opportunity.client_name}...`);

      const architecture = await buildArchitecture(opportunity);

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
      // Return cached result if already written, unless force regenerate requested
if (opportunity.approach_note?.sections && req.query.regenerate !== 'true') {
  return res.json({
    success: true,
    message: 'Approach note already written',
    opportunity_id: opportunity._id,
    client_name: opportunity.client_name,
    approach_note: opportunity.approach_note,
    next_step: `POST /api/opportunities/${opportunity._id}/score`
  });
}


      console.log(`🤖 Agent 6: Writing approach note for ${opportunity.client_name}...`);

      const approachNote = await writeApproachNote(opportunity);

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
      // Return cached result if already scored, unless force regenerate requested
if (opportunity.score?.total_score !== undefined && req.query.regenerate !== 'true') {
  return res.json({
    success: true,
    message: 'Proposal already scored',
    opportunity_id: opportunity._id,
    client_name: opportunity.client_name,
    score: opportunity.score,
    status: opportunity.status,
    next_step: opportunity.score.can_export
      ? 'Proposal ready to export'
      : 'Fix the gaps listed above then re-score'
  });
}

      console.log(`🤖 Scoring proposal for ${opportunity.client_name}...`);

      const score = await scoreProposal(opportunity);
      const status = score.can_export ? 'ready_to_export' : 'needs_improvement';

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