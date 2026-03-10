# Pre-Stack, Pre-Sync & Pre-Cutover Checklist

**Status**: Active  
**Last updated**: 2026-03-09  

This operational checklist defines the required verification steps before moving code across environments or switching critical infrastructure.

---

## 1. Before Sync to GitHub
*Mandatory Reference: `docs/source-of-truth-sync-discipline.md`, `docs/migration-discipline.md`*

- [ ] **Type Check**: Run `npx tsc --noEmit` locally/in-editor to ensure no TypeScript errors.
- [ ] **Lint**: Run `npm run lint` and resolve critical warnings.
- [ ] **Domain Alignment**: Verify `src/domain/models.ts` matches any recent Supabase schema changes.
- [ ] **Migration Scripts**: Ensure any manual DB changes are captured in `supabase/migrations/`.
- [ ] **Documentation**: Ensure `docs/*.md` are updated in the same prompt/commit as the code.

## 2. After Sync to GitHub
*Mandatory Reference: `docs/source-of-truth-sync-discipline.md`*

- [ ] **CI Verification**: Check GitHub Actions (`.github/workflows/ci.yml`) - must be green.
- [ ] **Migration Check**: Verify `supabase/migrations/` files are present in the `main` branch.
- [ ] **Commit Alignment**: Confirm the latest commit timestamp matches the final Lovable workspace action.

## 3. Before Supabase Connection (Staging/Production)
*Mandatory Reference: `docs/supabase-schema-plan.md`, `docs/rls-plan.md`, `docs/security-prelaunch.md`*

- [ ] **Environment Variables**: Populate `.env` with actual Supabase URL and Anon Key.
- [ ] **Migration Execution**: Apply all `supabase/migrations/*.sql` in order lexicographically.
- [ ] **RLS Verification**: Manually verify `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies on critical tables (`profiles`, `jobs`, `applications`).
- [ ] **Function Check**: Verify `apply_to_job` and other RPCs exist and use `SECURITY DEFINER` safely.
- [ ] **Storage Setup**: Ensure buckets (`cvs`, `logos`) exist and have appropriate RLS.

## 4. Before Cloudflare Pages Connection
*Mandatory Reference: `docs/cloudflare-pages-checklist.md`, `docs/production-readiness-report.md`*

- [ ] **Build Check**: Run `npm run build` locally; ensure it completes without memory or resolution errors.
- [ ] **Environment Variables**: Configure all required secrets in Cloudflare Pages dashboard.
- [ ] **Routing**: Ensure SPA routing fallback (`_redirects` or Cloudflare settings) is configured for React Router.
- [ ] **Asset Check**: Verify `public/` and `src/assets/` paths resolve correctly in the compiled output.

## 5. Before Mock → Live Provider Cutover
*Mandatory Reference: `docs/provider-integration-plan.md`, `docs/supabase-cutover-plan.md`*

- [ ] **Registry Update**: Change `src/providers/registry.ts` from `mock` to `supabase` implementations.
- [ ] **Smoke Test 1 (Auth)**: Sign up as Candidate, complete profile, verify `profiles` and `candidates` table records.
- [ ] **Smoke Test 2 (Employer)**: Sign up as Employer, post a job, verify `jobs` table record and RLS.
- [ ] **Smoke Test 3 (Application)**: Candidate swipes right → applies to job. Verify `applications` table and RPC success.
- [ ] **Smoke Test 4 (Storage)**: Upload CV as candidate. Verify file lands in `cvs` bucket with UUID path.
- [ ] **Error Fallback**: Disconnect network, verify `LocalErrorBoundary` handles offline state gracefully.

---

## High-Risk Manual Verification
If you only have time to check three things, check these:
1. **RLS Bypass Risk**: Attempt to fetch a candidate's CV URL as an unauthenticated user or an unrelated candidate. Must fail.
2. **Role Escalation Risk**: Attempt to update `user_roles` or the `role` field on `profiles` from the client. Must be ignored or rejected.
3. **Provider State Drift**: Check network tab during the swipe flow; ensure actual Supabase POST/RPC requests are firing, not local mock resolutions.