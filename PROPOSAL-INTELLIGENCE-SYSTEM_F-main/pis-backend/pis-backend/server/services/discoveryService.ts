/**
 * Discovery Service Layer
 * Handles business logic for discovery sessions, answers, and downstream payload transformations
 */

import {
  createDiscoverySession,
  getDiscoverySession,
  getDiscoveryAnswersBySession,
  updateDiscoverySessionStatus,
  updateDiscoverySessionCounts,
  updateDiscoveryAnswer,
  createDownstreamPayload,
  getDownstreamPayload,
  updateDownstreamPayload,
} from '../db';
import type {
  QuestionState,
  SessionStatus,
  ProgrammeKind,
  StageType,
  SessionCompletionStatus,
  CompetencyMappingPayload,
  ArchitectureStagePayload,
  ApproachNotePayload,
} from '../../shared/discovery';

/**
 * Initialize a new discovery session for an opportunity
 */
export async function initializeDiscoverySession(
  opportunityId: string,
  userId: number,
  programmeKind: ProgrammeKind,
  totalQuestions: number
) {
  return createDiscoverySession(opportunityId, userId, programmeKind, totalQuestions);
}

/**
 * Update answer state and recalculate session counts
 */
export async function updateAnswerState(
  answerId: number,
  answerText: string,
  newState: QuestionState,
  sessionId: number
) {
  // Update the answer
  await updateDiscoveryAnswer(answerId, answerText, newState);

  // Recalculate session counts
  const answers = await getDiscoveryAnswersBySession(sessionId);
  const counts = calculateStateCounts(answers);

  await updateDiscoverySessionCounts(
    sessionId,
    counts.answered,
    counts.skippedByRule,
    counts.systemConfirmed
  );
}

/**
 * Calculate state counts from answers array
 */
function calculateStateCounts(answers: any[]) {
  return {
    answered: answers.filter((a) => a.state === 'answered').length,
    skippedByRule: answers.filter((a) => a.state === 'skipped_by_rule').length,
    systemConfirmed: answers.filter((a) => a.state === 'system_confirmed').length,
    pending: answers.filter((a) => a.state === 'pending').length,
  };
}

/**
 * Check if a session is complete (all questions answered or skipped)
 */
export async function checkSessionCompletion(
  sessionId: number
): Promise<SessionCompletionStatus> {
  const session = await getDiscoverySession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const answers = await getDiscoveryAnswersBySession(sessionId);
  const counts = calculateStateCounts(answers);

  const totalAnsweredOrSkipped =
    counts.answered +
    counts.skippedByRule +
    counts.systemConfirmed;

  const isComplete = totalAnsweredOrSkipped === session.totalQuestions;

  const missingAnswers = isComplete
    ? []
    : answers
        .filter((a) => a.state === 'pending')
        .map((a) => ({
          questionId: a.questionId,
          themeCode: a.themeCode,
          questionText: a.questionText,
        }));

  return {
    isComplete,
    totalRequired: session.totalQuestions,
    totalAnswered: totalAnsweredOrSkipped,
    missingAnswers,
  };
}

/**
 * Submit a discovery session (transition to submitted status)
 */
export async function submitDiscoverySession(sessionId: number) {
  const completion = await checkSessionCompletion(sessionId);

  if (!completion.isComplete) {
    throw new Error(
      `Cannot submit session: ${completion.missingAnswers.length} questions still pending`
    );
  }

  await updateDiscoverySessionStatus(sessionId, 'submitted');

  // Generate all downstream payloads
  await generateAllDownstreamPayloads(sessionId);
}

/**
 * Generate all downstream payloads for a session
 */
async function generateAllDownstreamPayloads(sessionId: number) {
  const session = await getDiscoverySession(sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);

  const answers = await getDiscoveryAnswersBySession(sessionId);

  // Generate Competency Mapping payload
  const competencyPayload = transformToCompetencyMapping(answers);
  await createDownstreamPayload(
    sessionId,
    session.opportunityId,
    'competency_mapping',
    competencyPayload as unknown as Record<string, unknown>,
    true
  );

  // Generate Architecture Stage payload
  const architecturePayload = transformToArchitectureStage(answers);
  await createDownstreamPayload(
    sessionId,
    session.opportunityId,
    'architecture_stage',
    architecturePayload as unknown as Record<string, unknown>,
    true
  );

  // Generate Approach Note payload
  const approachNotePayload = transformToApproachNote(answers);
  await createDownstreamPayload(
    sessionId,
    session.opportunityId,
    'approach_note',
    approachNotePayload as unknown as Record<string, unknown>,
    true
  );
}

/**
 * Transform discovery answers to Competency Mapping payload
 * Includes suggested competencies and theme answers
 */
function transformToCompetencyMapping(
  answers: any[]
): CompetencyMappingPayload {
  const themeAnswers: Record<string, string> = {};

  // Group answers by theme and extract text
  answers.forEach((answer) => {
    if (answer.state === 'answered' || answer.state === 'system_confirmed') {
      themeAnswers[answer.themeCode] = answer.answerText || '';
    }
  });

  return {
    opportunityId: answers[0]?.opportunityId || '',
    suggestedCompetencies: [], // This would be populated from Member A's context
    themeAnswers,
    capturedAt: new Date(),
  };
}

/**
 * Transform discovery answers to Architecture Stage payload
 * Includes faculty archetype, peer grouping sensitivities, and capability baseline
 */
function transformToArchitectureStage(
  answers: any[]
): ArchitectureStagePayload {
  const answersByTheme: Record<string, string> = {};

  answers.forEach((answer) => {
    if (answer.state === 'answered' || answer.state === 'system_confirmed') {
      answersByTheme[answer.themeCode] = answer.answerText || '';
    }
  });

  return {
    opportunityId: answers[0]?.opportunityId || '',
    facultyArchetype: answersByTheme['PED'] || '', // Pedagogical Approach
    peerGroupingSensitivities: answersByTheme['AUD'] || '', // Audience Politics
    capabilityBaseline: answersByTheme['BAS'] || '', // Capability Baseline
    excludedContent: answersByTheme['PED'] ? [answersByTheme['PED']] : [], // Exclusions from PED Q2
    capturedAt: new Date(),
  };
}

/**
 * Transform discovery answers to Approach Note payload
 * Includes Strategic Trigger (BCS) and Target Behaviour (BEH)
 */
function transformToApproachNote(
  answers: any[]
): ApproachNotePayload {
  const answersByTheme: Record<string, string> = {};

  answers.forEach((answer) => {
    if (answer.state === 'answered' || answer.state === 'system_confirmed') {
      answersByTheme[answer.themeCode] = answer.answerText || '';
    }
  });

  return {
    opportunityId: answers[0]?.opportunityId || '',
    strategicTrigger: answersByTheme['BCS'] || '', // Business Context and Strategic Trigger
    targetBehaviour: answersByTheme['BEH'] || '', // Target Behaviour
    capturedAt: new Date(),
  };
}

/**
 * Get downstream payload for a specific stage
 */
export async function getDownstreamPayloadForStage(
  sessionId: number,
  stageType: StageType
) {
  return getDownstreamPayload(sessionId, stageType);
}

/**
 * Validate completeness for stage transition
 */
export async function validateStageTransition(
  sessionId: number
): Promise<{ isValid: boolean; errors: string[] }> {
  const completion = await checkSessionCompletion(sessionId);

  if (!completion.isComplete) {
    return {
      isValid: false,
      errors: [
        `Session incomplete: ${completion.missingAnswers.length} questions pending`,
        ...completion.missingAnswers.map(
          (q) => `Q${q.questionId} (${q.themeCode}): ${q.questionText}`
        ),
      ],
    };
  }

  // Verify all downstream payloads exist and are valid
  const payloads = await Promise.all([
    getDownstreamPayload(sessionId, 'competency_mapping'),
    getDownstreamPayload(sessionId, 'architecture_stage'),
    getDownstreamPayload(sessionId, 'approach_note'),
  ]);

  const errors: string[] = [];

  if (!payloads[0]) errors.push('Competency Mapping payload not generated');
  if (!payloads[1]) errors.push('Architecture Stage payload not generated');
  if (!payloads[2]) errors.push('Approach Note payload not generated');

  return {
    isValid: errors.length === 0,
    errors,
  };
}
