import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, discoverySessions, discoveryAnswers, downstreamPayloads } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Discovery Session Queries
export async function createDiscoverySession(
  opportunityId: string,
  userId: number,
  programmeKind: 'new' | 'repeat' | 'new_content_same_cohort',
  totalQuestions: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(discoverySessions).values({
    opportunityId,
    userId,
    programmeKind,
    totalQuestions,
    status: 'open',
  });

  return result;
}

export async function getDiscoverySession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(discoverySessions)
    .where(eq(discoverySessions.id, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getDiscoverySessionsByOpportunity(opportunityId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(discoverySessions)
    .where(eq(discoverySessions.opportunityId, opportunityId));
}

export async function updateDiscoverySessionStatus(
  sessionId: number,
  status: 'open' | 'in_progress' | 'submitted' | 'completed'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(discoverySessions)
    .set({ status, updatedAt: new Date() })
    .where(eq(discoverySessions.id, sessionId));
}

export async function updateDiscoverySessionCounts(
  sessionId: number,
  answeredCount: number,
  skippedByRuleCount: number,
  systemConfirmedCount: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(discoverySessions)
    .set({
      answeredCount,
      skippedByRuleCount,
      systemConfirmedCount,
      updatedAt: new Date(),
    })
    .where(eq(discoverySessions.id, sessionId));
}

// Discovery Answer Queries
export async function createDiscoveryAnswer(
  sessionId: number,
  opportunityId: string,
  themeCode: string,
  questionId: string,
  questionText: string,
  answerText?: string,
  state: 'answered' | 'skipped_by_rule' | 'system_confirmed' | 'pending' = 'pending'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(discoveryAnswers).values({
    sessionId,
    opportunityId,
    themeCode,
    questionId,
    questionText,
    answerText,
    state,
  });
}

export async function getDiscoveryAnswersBySession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(discoveryAnswers)
    .where(eq(discoveryAnswers.sessionId, sessionId));
}

export async function updateDiscoveryAnswer(
  answerId: number,
  answerText: string,
  state: 'answered' | 'skipped_by_rule' | 'system_confirmed' | 'pending'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(discoveryAnswers)
    .set({ answerText, state, updatedAt: new Date() })
    .where(eq(discoveryAnswers.id, answerId));
}

export async function getDiscoveryAnswer(answerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(discoveryAnswers)
    .where(eq(discoveryAnswers.id, answerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Downstream Payload Queries
export async function createDownstreamPayload(
  sessionId: number,
  opportunityId: string,
  stageType: 'competency_mapping' | 'architecture_stage' | 'approach_note',
  payload: Record<string, unknown>,
  isValid: boolean = true,
  validationErrors?: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(downstreamPayloads).values({
    sessionId,
    opportunityId,
    stageType,
    payload: JSON.stringify(payload),
    isValid: isValid ? 1 : 0,
    validationErrors: validationErrors ? JSON.stringify(validationErrors) : null,
  });
}

export async function getDownstreamPayload(
  sessionId: number,
  stageType: 'competency_mapping' | 'architecture_stage' | 'approach_note'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(downstreamPayloads)
    .where(
      and(
        eq(downstreamPayloads.sessionId, sessionId),
        eq(downstreamPayloads.stageType, stageType)
      )
    )
    .limit(1);

  if (result.length === 0) return null;
  
  const payload = result[0];
  return {
    ...payload,
    payload: typeof payload.payload === 'string' ? JSON.parse(payload.payload) : payload.payload,
    validationErrors: payload.validationErrors ? JSON.parse(payload.validationErrors) : null,
  };
}

export async function updateDownstreamPayload(
  payloadId: number,
  payload: Record<string, unknown>,
  isValid: boolean = true,
  validationErrors?: string[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .update(downstreamPayloads)
    .set({
      payload: JSON.stringify(payload),
      isValid: isValid ? 1 : 0,
      validationErrors: validationErrors ? JSON.stringify(validationErrors) : null,
      updatedAt: new Date(),
    })
    .where(eq(downstreamPayloads.id, payloadId));
}
