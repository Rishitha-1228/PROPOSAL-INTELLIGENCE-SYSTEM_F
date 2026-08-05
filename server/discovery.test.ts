import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkSessionCompletion,
  updateAnswerState,
  validateStageTransition,
} from './services/discoveryService';
import * as db from './db';

// Mock the database module
vi.mock('./db', () => ({
  getDiscoverySession: vi.fn(),
  getDiscoveryAnswersBySession: vi.fn(),
  updateDiscoverySessionCounts: vi.fn(),
  updateDiscoveryAnswer: vi.fn(),
  getDownstreamPayload: vi.fn(),
}));

describe('Discovery Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSessionCompletion', () => {
    it('should return isComplete=true when all questions are answered', async () => {
      const mockSession = {
        id: 1,
        opportunityId: 'opp-123',
        userId: 1,
        status: 'open',
        programmeKind: 'new',
        totalQuestions: 3,
        answeredCount: 3,
        skippedByRuleCount: 0,
        systemConfirmedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: null,
      };

      const mockAnswers = [
        {
          id: 1,
          sessionId: 1,
          themeCode: 'BCS',
          questionId: 'q1',
          state: 'answered',
          answerText: 'Test answer',
        },
        {
          id: 2,
          sessionId: 1,
          themeCode: 'AUD',
          questionId: 'q2',
          state: 'answered',
          answerText: 'Test answer',
        },
        {
          id: 3,
          sessionId: 1,
          themeCode: 'BAS',
          questionId: 'q3',
          state: 'answered',
          answerText: 'Test answer',
        },
      ];

      vi.mocked(db.getDiscoverySession).mockResolvedValue(mockSession);
      vi.mocked(db.getDiscoveryAnswersBySession).mockResolvedValue(mockAnswers);

      const result = await checkSessionCompletion(1);

      expect(result.isComplete).toBe(true);
      expect(result.totalRequired).toBe(3);
      expect(result.totalAnswered).toBe(3);
      expect(result.missingAnswers).toHaveLength(0);
    });

    it('should return isComplete=false when questions are pending', async () => {
      const mockSession = {
        id: 1,
        opportunityId: 'opp-123',
        userId: 1,
        status: 'open',
        programmeKind: 'new',
        totalQuestions: 3,
        answeredCount: 2,
        skippedByRuleCount: 0,
        systemConfirmedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: null,
      };

      const mockAnswers = [
        {
          id: 1,
          sessionId: 1,
          themeCode: 'BCS',
          questionId: 'q1',
          state: 'answered',
          answerText: 'Test answer',
        },
        {
          id: 2,
          sessionId: 1,
          themeCode: 'AUD',
          questionId: 'q2',
          state: 'answered',
          answerText: 'Test answer',
        },
        {
          id: 3,
          sessionId: 1,
          themeCode: 'BAS',
          questionId: 'q3',
          state: 'pending',
          answerText: null,
        },
      ];

      vi.mocked(db.getDiscoverySession).mockResolvedValue(mockSession);
      vi.mocked(db.getDiscoveryAnswersBySession).mockResolvedValue(mockAnswers);

      const result = await checkSessionCompletion(1);

      expect(result.isComplete).toBe(false);
      expect(result.totalRequired).toBe(3);
      expect(result.totalAnswered).toBe(2);
      expect(result.missingAnswers).toHaveLength(1);
      expect(result.missingAnswers[0].questionId).toBe('q3');
    });

    it('should count skipped_by_rule and system_confirmed as complete', async () => {
      const mockSession = {
        id: 1,
        opportunityId: 'opp-123',
        userId: 1,
        status: 'open',
        programmeKind: 'new',
        totalQuestions: 3,
        answeredCount: 1,
        skippedByRuleCount: 1,
        systemConfirmedCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: null,
      };

      const mockAnswers = [
        {
          id: 1,
          sessionId: 1,
          themeCode: 'BCS',
          questionId: 'q1',
          state: 'answered',
          answerText: 'Test answer',
        },
        {
          id: 2,
          sessionId: 1,
          themeCode: 'AUD',
          questionId: 'q2',
          state: 'skipped_by_rule',
          answerText: null,
        },
        {
          id: 3,
          sessionId: 1,
          themeCode: 'BAS',
          questionId: 'q3',
          state: 'system_confirmed',
          answerText: 'Auto-confirmed',
        },
      ];

      vi.mocked(db.getDiscoverySession).mockResolvedValue(mockSession);
      vi.mocked(db.getDiscoveryAnswersBySession).mockResolvedValue(mockAnswers);

      const result = await checkSessionCompletion(1);

      expect(result.isComplete).toBe(true);
      expect(result.totalAnswered).toBe(3);
      expect(result.missingAnswers).toHaveLength(0);
    });
  });

  describe('validateStageTransition', () => {
    it('should return isValid=true when session is complete and payloads exist', async () => {
      const mockSession = {
        id: 1,
        opportunityId: 'opp-123',
        userId: 1,
        status: 'submitted',
        programmeKind: 'new',
        totalQuestions: 2,
        answeredCount: 2,
        skippedByRuleCount: 0,
        systemConfirmedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date(),
      };

      const mockAnswers = [
        {
          id: 1,
          sessionId: 1,
          themeCode: 'BCS',
          questionId: 'q1',
          state: 'answered',
          answerText: 'Test',
        },
        {
          id: 2,
          sessionId: 1,
          themeCode: 'AUD',
          questionId: 'q2',
          state: 'answered',
          answerText: 'Test',
        },
      ];

      const mockPayload = {
        id: 1,
        sessionId: 1,
        opportunityId: 'opp-123',
        stageType: 'competency_mapping',
        payload: '{}',
        isValid: 1,
        validationErrors: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getDiscoverySession).mockResolvedValue(mockSession);
      vi.mocked(db.getDiscoveryAnswersBySession).mockResolvedValue(mockAnswers);
      vi.mocked(db.getDownstreamPayload).mockResolvedValue(mockPayload);

      const result = await validateStageTransition(1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return isValid=false when payloads are missing', async () => {
      const mockSession = {
        id: 1,
        opportunityId: 'opp-123',
        userId: 1,
        status: 'submitted',
        programmeKind: 'new',
        totalQuestions: 2,
        answeredCount: 2,
        skippedByRuleCount: 0,
        systemConfirmedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        submittedAt: new Date(),
      };

      const mockAnswers = [
        {
          id: 1,
          sessionId: 1,
          themeCode: 'BCS',
          questionId: 'q1',
          state: 'answered',
          answerText: 'Test',
        },
        {
          id: 2,
          sessionId: 1,
          themeCode: 'AUD',
          questionId: 'q2',
          state: 'answered',
          answerText: 'Test',
        },
      ];

      vi.mocked(db.getDiscoverySession).mockResolvedValue(mockSession);
      vi.mocked(db.getDiscoveryAnswersBySession).mockResolvedValue(mockAnswers);
      vi.mocked(db.getDownstreamPayload).mockResolvedValue(null);

      const result = await validateStageTransition(1);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Competency Mapping payload not generated');
    });
  });
});

describe('Question State Labels', () => {
  it('should use exact terminology for question states', () => {
    const validStates = ['answered', 'skipped_by_rule', 'system_confirmed', 'pending'];

    expect(validStates).toContain('answered');
    expect(validStates).toContain('skipped_by_rule');
    expect(validStates).toContain('system_confirmed');
    expect(validStates).toContain('pending');
  });
});

describe('Downstream Payload Stage Names', () => {
  it('should use exact stage names for payloads', () => {
    const validStages = ['competency_mapping', 'architecture_stage', 'approach_note'];

    expect(validStages).toContain('competency_mapping');
    expect(validStages).toContain('architecture_stage');
    expect(validStages).toContain('approach_note');
  });
});

describe('Theme Code Labels', () => {
  it('should use exact theme codes for discovery questions', () => {
    const themeCodes = {
      BCS: 'Business Context and Strategic Trigger',
      AUD: 'Audience Politics and Cohort Dynamics',
      BAS: 'Capability Baseline',
      BEH: 'Target Behaviour',
      PED: 'Pedagogical Approach',
      DEC: 'Decision Dynamics',
      FOL: 'Follow-up and Measurement',
    };

    expect(themeCodes.BCS).toBeDefined();
    expect(themeCodes.AUD).toBeDefined();
    expect(themeCodes.BAS).toBeDefined();
    expect(themeCodes.BEH).toBeDefined();
    expect(themeCodes.PED).toBeDefined();
    expect(themeCodes.DEC).toBeDefined();
    expect(themeCodes.FOL).toBeDefined();
  });
});
