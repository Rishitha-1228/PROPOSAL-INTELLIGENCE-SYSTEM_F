/**
 * Discovery tRPC Router
 * Handles all discovery question endpoints
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import {
  createDiscoveryAnswer,
  getDiscoveryAnswersBySession,
  getDiscoverySession,
  getDiscoverySessionsByOpportunity,
} from '../db';
import {
  initializeDiscoverySession,
  updateAnswerState,
  checkSessionCompletion,
  submitDiscoverySession,
  getDownstreamPayloadForStage,
  validateStageTransition,
} from '../services/discoveryService';

export const discoveryRouter = router({
  /**
   * Initialize a new discovery session for an opportunity
   */
  initializeSession: protectedProcedure
    .input(
      z.object({
        opportunityId: z.string(),
        programmeKind: z.enum(['new', 'repeat', 'new_content_same_cohort']),
        totalQuestions: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await initializeDiscoverySession(
          input.opportunityId,
          ctx.user.id,
          input.programmeKind,
          input.totalQuestions
        );

        return {
          success: true,
          sessionId: (result as any).insertId || 0,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to initialize discovery session',
        });
      }
    }),

  /**
   * Save or update a discovery answer
   */
  saveAnswer: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().int().positive(),
        opportunityId: z.string(),
        themeCode: z.string(),
        questionId: z.string(),
        questionText: z.string(),
        answerText: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify session exists and belongs to user
        const session = await getDiscoverySession(input.sessionId);
        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Discovery session not found',
          });
        }

        if (session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Unauthorized access to this session',
          });
        }

        // Check if answer already exists
        const existingAnswers = await getDiscoveryAnswersBySession(input.sessionId);
        const existingAnswer = existingAnswers.find(
          (a) => a.questionId === input.questionId
        );

        if (existingAnswer) {
          // Update existing answer
          await updateAnswerState(
            existingAnswer.id,
            input.answerText,
            'answered',
            input.sessionId
          );

          return {
            success: true,
            answerId: existingAnswer.id,
            action: 'updated',
          };
        } else {
          // Create new answer
          const result = await createDiscoveryAnswer(
            input.sessionId,
            input.opportunityId,
            input.themeCode,
            input.questionId,
            input.questionText,
            input.answerText,
            'answered'
          );

          // Recalculate session counts
          const answers = await getDiscoveryAnswersBySession(input.sessionId);
          const answeredCount = answers.filter((a) => a.state === 'answered').length;
          const skippedCount = answers.filter((a) => a.state === 'skipped_by_rule').length;
          const systemConfirmedCount = answers.filter((a) => a.state === 'system_confirmed').length;

          return {
            success: true,
            answerId: (result as any).insertId || 0,
            action: 'created',
          };
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save answer',
        });
      }
    }),

  /**
   * Update answer state (Answered, Skipped by Rule, System Confirmed, Pending)
   */
  updateAnswerState: protectedProcedure
    .input(
      z.object({
        answerId: z.number().int().positive(),
        sessionId: z.number().int().positive(),
        answerText: z.string().optional(),
        state: z.enum(['answered', 'skipped_by_rule', 'system_confirmed', 'pending']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify session ownership
        const session = await getDiscoverySession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Unauthorized access to this session',
          });
        }

        await updateAnswerState(
          input.answerId,
          input.answerText || '',
          input.state,
          input.sessionId
        );

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update answer state',
        });
      }
    }),

  /**
   * Get all answers for a discovery session
   */
  getSessionAnswers: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      try {
        const session = await getDiscoverySession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Unauthorized access to this session',
          });
        }

        const answers = await getDiscoveryAnswersBySession(input.sessionId);
        return answers;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch session answers',
        });
      }
    }),

  /**
   * Get discovery session details
   */
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      try {
        const session = await getDiscoverySession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Unauthorized access to this session',
          });
        }

        return session;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch session',
        });
      }
    }),

  /**
   * Get all sessions for an opportunity
   */
  getSessionsByOpportunity: protectedProcedure
    .input(z.object({ opportunityId: z.string() }))
    .query(async ({ input }) => {
      try {
        const sessions = await getDiscoverySessionsByOpportunity(input.opportunityId);
        return sessions;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch sessions',
        });
      }
    }),

  /**
   * Check session completion status
   */
  checkCompletion: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      try {
        const session = await getDiscoverySession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Unauthorized access to this session',
          });
        }

        const completion = await checkSessionCompletion(input.sessionId);
        return completion;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check completion status',
        });
      }
    }),

  /**
   * Submit discovery session and generate downstream payloads
   */
  submitSession: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await getDiscoverySession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Unauthorized access to this session',
          });
        }

        await submitDiscoverySession(input.sessionId);

        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot submit')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit session',
        });
      }
    }),

  /**
   * Get downstream payload for a specific stage
   */
  getDownstreamPayload: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().int().positive(),
        stageType: z.enum(['competency_mapping', 'architecture_stage', 'approach_note']),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const session = await getDiscoverySession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Unauthorized access to this session',
          });
        }

        const payload = await getDownstreamPayloadForStage(
          input.sessionId,
          input.stageType
        );

        if (!payload) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Payload for stage ${input.stageType} not found`,
          });
        }

        return payload;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch downstream payload',
        });
      }
    }),

  /**
   * Validate stage transition (completeness check)
   */
  validateTransition: protectedProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      try {
        const session = await getDiscoverySession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Unauthorized access to this session',
          });
        }

        const validation = await validateStageTransition(input.sessionId);
        return validation;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate transition',
        });
      }
    }),
});
