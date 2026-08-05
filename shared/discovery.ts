/**
 * Shared types for Discovery Questions module
 */

export type QuestionState = 'answered' | 'skipped_by_rule' | 'system_confirmed' | 'pending';
export type SessionStatus = 'open' | 'in_progress' | 'submitted' | 'completed';
export type ProgrammeKind = 'new' | 'repeat' | 'new_content_same_cohort';
export type StageType = 'competency_mapping' | 'architecture_stage' | 'approach_note';

export interface DiscoveryQuestion {
  id: string;
  themeCode: string;
  text: string;
  rationale: string;
  downstreamUse: string;
}

export interface DiscoveryAnswerDTO {
  id: number;
  sessionId: number;
  opportunityId: string;
  themeCode: string;
  questionId: string;
  questionText: string;
  answerText: string | null;
  state: QuestionState;
  confidence: number;
  provenance: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscoverySessionDTO {
  id: number;
  opportunityId: string;
  userId: number;
  status: SessionStatus;
  programmeKind: ProgrammeKind;
  totalQuestions: number;
  answeredCount: number;
  skippedByRuleCount: number;
  systemConfirmedCount: number;
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
}

export interface CompetencyMappingPayload {
  opportunityId: string;
  suggestedCompetencies: Array<{
    competencyId: string;
    name: string;
    confidence: number;
  }>;
  themeAnswers: Record<string, string>;
  capturedAt: Date;
}

export interface ArchitectureStagePayload {
  opportunityId: string;
  facultyArchetype: string; // From BEH answer
  peerGroupingSensitivities: string; // From AUD answer
  capabilityBaseline: string; // From BAS answer
  excludedContent: string[]; // From PED question B
  capturedAt: Date;
}

export interface ApproachNotePayload {
  opportunityId: string;
  strategicTrigger: string; // BCS answer
  targetBehaviour: string; // BEH answer
  capturedAt: Date;
}

export interface DownstreamPayloadDTO {
  id: number;
  sessionId: number;
  opportunityId: string;
  stageType: StageType;
  payload: Record<string, unknown>;
  isValid: boolean;
  validationErrors: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionCompletionStatus {
  isComplete: boolean;
  totalRequired: number;
  totalAnswered: number;
  missingAnswers: Array<{
    questionId: string;
    themeCode: string;
    questionText: string;
  }>;
}
