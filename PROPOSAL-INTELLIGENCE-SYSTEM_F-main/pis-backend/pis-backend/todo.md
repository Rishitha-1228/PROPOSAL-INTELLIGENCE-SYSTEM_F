# PIS Discovery Member 3 - Implementation TODO

## Phase 1: Database Schema
- [x] Design discovery_sessions table
- [x] Design discovery_answers table
- [x] Design question_state_tracking table
- [x] Create Drizzle schema with all relations
- [x] Generate and apply migration SQL

## Phase 2: Answer Persistence API
- [x] POST /api/trpc/discovery.saveAnswer endpoint
- [x] PATCH /api/trpc/discovery.updateAnswer endpoint (updateAnswerState)
- [x] Answer validation logic
- [x] State transition logic (Pending → Answered/Skipped by Rule/System Confirmed)
- [x] Database query helpers in server/db.ts

## Phase 3: Discovery Session Controller
- [x] Session lifecycle management (Open → In Progress → Submitted → Completed)
- [x] Session initialization endpoint
- [x] Session submission endpoint
- [x] Completion validation logic
- [x] Question state aggregation

## Phase 4: Downstream Payload Transformers
- [x] Competency Mapping transformer (suggested_competencies + theme answers)
- [x] Architecture Stage transformer (faculty archetypes, peer grouping, capability baseline)
- [x] Approach Note transformer (BCS Strategic Trigger, BEH Target Behaviour)
- [x] Payload formatting and validation

## Phase 5: Proposal Scoring Integration
- [x] Completeness check endpoint
- [x] Required question validation
- [x] Stage transition validation
- [x] Scoring metadata

## Phase 6: Dashboard UI
- [x] Discovery sessions list page
- [x] Session detail view with question state tracking
- [x] Per-theme answer status display
- [x] Downstream payload preview panels
- [x] Session submission workflow
- [x] Elegant styling and visual polish

## Phase 7: Testing & Delivery
- [x] Unit tests for state transitions
- [x] Unit tests for validation logic
- [x] Tests for terminology compliance (Answered, Skipped by Rule, System Confirmed, Pending)
- [x] Tests for stage names (Competency Mapping, Architecture Stage, Approach Note)
- [x] Final checkpoint and documentation
