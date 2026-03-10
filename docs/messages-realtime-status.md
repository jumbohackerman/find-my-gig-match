# Messages Realtime Status

**Date:** 2026-03-08

---

## What Is Live

| Feature | Status | Notes |
|---------|--------|-------|
| Message storage (CRUD) | ✅ Live | `supabaseMessageRepository` — `listByApplication`, `send` |
| Realtime subscription | ✅ Live | `messages` table is in `supabase_realtime` publication |
| RLS: SELECT (participants) | ✅ Live | Candidates + employers on related applications |
| RLS: INSERT (participants) | ✅ Live | `sender_id = auth.uid()` + application participant check |
| Registry wiring | ✅ Live | `getProvider("messages")` → `supabaseMessageRepository` |
| Employer hook (`useEmployerMessages`) | ✅ Live | Loads messages, sends with optimistic updates, realtime subscription per application |
| ChatPanel sender alignment | ✅ Fixed | Uses `currentUserId` (real UUID) instead of hardcoded `"employer"` |
| Message ordering | ✅ Live | Server-side `ORDER BY created_at ASC` + client-side sort in `getMessages()` |
| Optimistic updates | ✅ Live | Temp ID on send → replaced by server-confirmed message; removed on failure |
| Realtime dedup | ✅ Live | Incoming realtime messages are deduped against optimistic messages by ID |
| Subscription cleanup | ✅ Live | `useRef` tracks subscriptions; cleanup on unmount + per-application unsubscribe |

## What Is Stubbed / Missing

| Feature | Status | Blocker |
|---------|--------|---------|
| Candidate-side messaging UI | 🟡 Not implemented | No candidate chat component exists yet. The repository + realtime infra supports it. |
| Read/unread per message | 🟡 Not implemented | No `read_at` column on messages table. Would need migration + UPDATE RLS. |
| RLS: UPDATE messages | ❌ No policy | Currently blocked by design (messages are immutable). Add if read receipts needed. |
| RLS: DELETE messages | ❌ No policy | Messages cannot be deleted by users. |
| Typing indicators | ❌ Not implemented | Would use Supabase Presence (broadcast), not DB. |

## Architecture

```
Employer.tsx
  └── useEmployerMessages(employerId)
        ├── loadMessages(appId)     → repo.listByApplication()
        ├── sendMessage(appId, text) → repo.send() + optimistic update
        ├── unlockChat(appId)        → subscribes to realtime
        └── subscribe lifecycle      → useRef map, cleanup on unmount

ChatPanel.tsx
  └── Renders messages with sender alignment via currentUserId
  └── Employer-led: chat unlocked on first message or explicit unlock

supabaseMessageRepository
  ├── listByApplication() → SELECT ... ORDER BY created_at ASC
  ├── send()              → INSERT ... RETURNING *
  └── subscribe()         → postgres_changes INSERT filter by application_id
```

## DB Schema

```sql
TABLE messages (
  id uuid PK DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id),
  sender_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
)
-- Realtime: YES (supabase_realtime publication)
-- RLS: SELECT + INSERT for application participants
-- No UPDATE or DELETE policies
```
