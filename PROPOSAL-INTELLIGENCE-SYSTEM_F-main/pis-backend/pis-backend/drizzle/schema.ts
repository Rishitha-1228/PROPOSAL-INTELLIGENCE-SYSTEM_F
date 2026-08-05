import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Discovery Sessions table
 * Tracks the lifecycle of a discovery question session for an opportunity
 */
export const discoverySessions = mysqlTable('discovery_sessions', {
  id: int('id').autoincrement().primaryKey(),
  opportunityId: varchar('opportunity_id', { length: 64 }).notNull(),
  userId: int('user_id').notNull().references(() => users.id),
  status: mysqlEnum('status', ['open', 'in_progress', 'submitted', 'completed']).default('open').notNull(),
  programmeKind: mysqlEnum('programme_kind', ['new', 'repeat', 'new_content_same_cohort']).notNull(),
  totalQuestions: int('total_questions').default(0).notNull(),
  answeredCount: int('answered_count').default(0).notNull(),
  skippedByRuleCount: int('skipped_by_rule_count').default(0).notNull(),
  systemConfirmedCount: int('system_confirmed_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  submittedAt: timestamp('submitted_at'),
});

export type DiscoverySession = typeof discoverySessions.$inferSelect;
export type InsertDiscoverySession = typeof discoverySessions.$inferInsert;

/**
 * Discovery Answers table
 * Stores the actual answers provided by users for discovery questions
 */
export const discoveryAnswers = mysqlTable('discovery_answers', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').notNull().references(() => discoverySessions.id, { onDelete: 'cascade' }),
  opportunityId: varchar('opportunity_id', { length: 64 }).notNull(),
  themeCode: varchar('theme_code', { length: 10 }).notNull(), // BCS, AUD, BAS, BEH, PED, DEC, FOL
  questionId: varchar('question_id', { length: 64 }).notNull(),
  questionText: text('question_text').notNull(),
  answerText: text('answer_text'),
  state: mysqlEnum('state', ['answered', 'skipped_by_rule', 'system_confirmed', 'pending']).default('pending').notNull(),
  confidence: int('confidence').default(0), // 0-100 scale for system-confirmed answers
  provenance: varchar('provenance', { length: 50 }), // client_stated, inferred, assumed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type DiscoveryAnswer = typeof discoveryAnswers.$inferSelect;
export type InsertDiscoveryAnswer = typeof discoveryAnswers.$inferInsert;

/**
 * Question State Tracking table
 * Tracks state transitions and metadata for each question
 */
export const questionStateTracking = mysqlTable('question_state_tracking', {
  id: int('id').autoincrement().primaryKey(),
  answerId: int('answer_id').notNull().references(() => discoveryAnswers.id, { onDelete: 'cascade' }),
  previousState: varchar('previous_state', { length: 50 }),
  currentState: mysqlEnum('current_state', ['answered', 'skipped_by_rule', 'system_confirmed', 'pending']).notNull(),
  reason: text('reason'), // Why the state changed
  transitionedAt: timestamp('transitioned_at').defaultNow().notNull(),
  transitionedBy: int('transitioned_by').references(() => users.id),
});

export type QuestionStateTracking = typeof questionStateTracking.$inferSelect;
export type InsertQuestionStateTracking = typeof questionStateTracking.$inferInsert;

/**
 * Downstream Payloads table
 * Caches the formatted payloads for downstream stages
 */
export const downstreamPayloads = mysqlTable('downstream_payloads', {
  id: int('id').autoincrement().primaryKey(),
  sessionId: int('session_id').notNull().references(() => discoverySessions.id, { onDelete: 'cascade' }),
  opportunityId: varchar('opportunity_id', { length: 64 }).notNull(),
  stageType: mysqlEnum('stage_type', ['competency_mapping', 'architecture_stage', 'approach_note']).notNull(),
  payload: text('payload').notNull(), // JSON string
  isValid: int('is_valid').default(1).notNull(), // 0 or 1 for boolean
  validationErrors: text('validation_errors'), // JSON array of errors
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type DownstreamPayload = typeof downstreamPayloads.$inferSelect;
export type InsertDownstreamPayload = typeof downstreamPayloads.$inferInsert;