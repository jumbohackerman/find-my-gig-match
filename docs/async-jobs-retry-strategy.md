# Async Jobs & Retry Strategy

**Status**: Active  
**Last updated**: 2026-03-09  

This document outlines the strategy for handling synchronous vs. asynchronous operations, retry logic, and fallback mechanisms for the live production stack of the JobSwipe application.

---

## 1. Decision Framework

When designing new features or transitioning existing mock flows to live providers, apply the following framework to decide how the workload should be executed:

- **Remain Synchronous**: Operations on the critical path for user experience where immediate feedback is mandatory. Examples: Authentication, core CRUD (posting a job, swiping, sending a chat message), and atomic state changes (applying to a job).
- **Make Asynchronous**: Operations involving heavy computation, third-party API dependencies (AI, Email, Analytics), or non-critical side effects. These should not block the main thread or database transaction.
- **Automatic Retry**: Operations that are idempotent and prone to transient failures (e.g., network timeouts, third-party rate limits). Implement exponential backoff.
- **Fallback Handling**: When an async process permanently fails, the system must degrade gracefully. Examples: falling back to basic string matching if AI scoring fails, or requiring manual data entry if CV parsing fails.
- **Manual Review**: High-risk failures, moderation flags, or automated system anomalies (e.g., an account flagged for spamming applications).
- **Execution Context**:
  - *Edge Functions (Direct Invoke)*: User-triggered heavy tasks (e.g., CV upload).
  - *Edge Functions (Database Webhooks)*: Immediate side effects (e.g., sending an email when a row is inserted).
  - *pg_cron / Scheduled Edge Functions*: Batch processing, daily match recomputations, storage cleanup.

---

## 2. Core Flows Strategy

### 2.1 Job Apply Flow
- **Execution Strategy**: **Synchronous** (Primary) + **Asynchronous** (Side effects).
- **Implementation**: The core apply action uses the `apply_to_job` RPC to atomically create the application and link the job synchronously. This ensures the user gets immediate visual feedback and prevents duplicate applications.
- **Async Side Effects**: Database webhooks trigger Edge Functions to generate employer notifications and send "New Applicant" emails.

### 2.2 Message Sending Side Effects
- **Execution Strategy**: **Synchronous** DB Write -> **Asynchronous** Notifications.
- **Implementation**: Real-time chat inserts a row into `messages` synchronously. A Supabase Database Webhook listens for `INSERT` on `messages` and invokes an Edge Function to trigger email/push notifications if the recipient is offline.
- **Retry/Fallback**: The Edge Function should retry the email provider API up to 3 times. If it fails, log the error (Sentry). Do not show an error to the sender; in-app delivery is the fallback.

### 2.3 CV Processing (`process-cv` Edge Function)
- **Execution Strategy**: **Asynchronous**.
- **Implementation**: Client uploads PDF to Supabase Storage -> invokes `process-cv` -> Edge Function calls Lovable AI Gateway -> saves structured data to the `candidates` profile.
- **Retry/Fallback**: If the AI gateway times out or fails to parse, return an error to the client. The fallback is prompting the user to manually fill in their profile fields.
- **Future State**: Implement a polling or WebSocket pattern to stream parsing progress to the UI.

### 2.4 Email Sending (`send-email` Edge Function)
- **Execution Strategy**: **Asynchronous**.
- **Implementation**: Invoked via DB Webhooks (e.g., on application status change) or directly for transactional events.
- **Retry/Fallback**: Use a resilient provider (like Resend) that handles its own internal retries. For the Edge Function call itself, implement a basic retry wrapper for 5xx responses. Failures must be logged for manual admin review.

### 2.5 Notification Generation
- **Execution Strategy**: **Synchronous** (In-app) / **Asynchronous** (Push/Email).
- **Implementation**: Database Triggers should synchronously insert rows into the `notifications` table (e.g., when `applications.status` changes, insert a notification row). Push notifications triggered off these inserts should be asynchronous via Edge Functions.
- **Retry/Fallback**: In-app notifications are guaranteed by the DB transaction. Push notifications can fail silently (user will see it in-app next time they open it).

### 2.6 Match Recomputation
- **Execution Strategy**: **Asynchronous** (Batch/Cron).
- **Implementation**: As new jobs are posted or candidates update their profiles, scores need updating. For the soft-launch, this runs on-the-fly. For scale, this should move to a scheduled Edge Function or `pg_cron` job running periodically.
- **Retry/Fallback**: If AI recomputation fails, gracefully degrade to basic keyword matching until the next batch run succeeds.

### 2.7 Moderation & Report Side Effects
- **Execution Strategy**: **Synchronous** (Submit) / **Manual Review** (Action).
- **Implementation**: Users reporting a job synchronously inserts into the `reports` table. A moderation Edge Function can run async to flag obvious spam, but final action (hiding an account) goes to an Admin dashboard for manual review.
- **Retry/Fallback**: Fallback is entirely human-in-the-loop (moderators).
