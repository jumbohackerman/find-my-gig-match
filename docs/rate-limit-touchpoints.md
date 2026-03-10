# Rate-Limit Touchpoints

## Existing Infrastructure

An edge function stub exists at `supabase/functions/rate-limiter/index.ts` with in-memory rate limiting scoped per user. It accepts `{ key, maxRequests, windowMs }` and returns `{ allowed, remaining, resetAt }`.

## Touchpoint Checklist

### 🔴 Critical (implement before launch)

| # | Flow | Key pattern | Suggested limit | Where to enforce | Notes |
|---|---|---|---|---|---|
| 1 | **Login attempts** | `login:{ip-or-email}` | 5 / 15 min | Supabase Auth (built-in) + edge function for custom lockout UI | Auth has built-in rate limiting; add custom UI feedback |
| 2 | **Password reset** | `reset:{email}` | 3 / 60 min | Supabase Auth (built-in) + edge function | Prevent email bombing |
| 3 | **Report submit** | `report:{userId}` | 5 / 60 min | `rate-limiter` edge fn → before `reports` insert | Prevent abuse of moderation system |

### 🟡 High Priority (implement early in production)

| # | Flow | Key pattern | Suggested limit | Where to enforce | Notes |
|---|---|---|---|---|---|
| 4 | **Apply to job** | `apply:{userId}` | 30 / 60 min | `rate-limiter` edge fn → before `apply_to_job` RPC | Prevents mass-application spam |
| 5 | **Send message** | `msg:{userId}` | 20 / 5 min | `rate-limiter` edge fn → before `messages` insert | Already has frontend duplicate guard |
| 6 | **Upload CV** | `cv:{userId}` | 3 / 24 hr | `rate-limiter` edge fn → before storage upload | Large payload; cost-sensitive |

### 🟢 Moderate (can defer to post-launch)

| # | Flow | Key pattern | Suggested limit | Where to enforce | Notes |
|---|---|---|---|---|---|
| 7 | **Job creation** | `job-create:{userId}` | 10 / 24 hr | `rate-limiter` edge fn → before `jobs` insert | Only employers; low volume |
| 8 | **Job edit** | `job-edit:{userId}` | 30 / 60 min | `rate-limiter` edge fn → before `jobs` update | Rarely abused |
| 9 | **Signup** | `signup:{ip}` | 3 / 60 min | Supabase Auth built-in | Auth already rate-limits this |

## Integration Pattern

Client-side (pre-check before action):
```ts
const { data } = await supabase.functions.invoke("rate-limiter", {
  body: { key: "apply", maxRequests: 30, windowMs: 3600000 },
});
if (!data.allowed) {
  toast.error("Zbyt wiele prób. Spróbuj ponownie później.");
  return;
}
```

Or server-side (inside another edge function):
```ts
const result = checkRateLimit(`${userId}:apply`, 30, 3_600_000);
if (!result.allowed) {
  return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 });
}
```

## What's Already Protected (Frontend)

These flows have client-side duplicate guards (not rate limits):
- Apply → `actionPending` state in `useJobFeed`
- Save/unsave → `pendingOps` ref in `useSavedJobs`
- Message send → `sending` state in `ChatPanel`
- Report submit → `sending` state in `ReportButton`
- Profile save → `saving` state in `MyProfile`
- Job creation → `submitting` state in `useEmployerJobs`

Frontend guards prevent double-clicks but **not** intentional abuse. Server-side rate limiting is still required.

## What Can Remain Deferred

| Item | Reason |
|---|---|
| Job edit rate limiting | Low abuse potential, employer-only |
| Signup rate limiting | Supabase Auth handles this natively |
| Read-endpoint rate limiting | No sensitive writes; CDN/proxy can handle |
| IP-based limits | Requires proxy/CDN layer (Cloudflare, Vercel) |
| Persistent rate limit store | In-memory is acceptable for initial launch; move to Redis/KV if cold starts cause resets |
