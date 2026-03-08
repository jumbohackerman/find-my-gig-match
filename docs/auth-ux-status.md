# Auth & Onboarding UX Status

> Last updated: 2026-03-08

## Role-Specific UX Issues Fixed

### 1. Post-Login Redirect (Auth.tsx)
- **Before**: Both roles redirected to `/` after login/signup.
- **After**: Login fetches profile role and redirects employer → `/employer`, candidate → `/`.
- Signup also uses selected role for immediate redirect.

### 2. Already-Authenticated Redirect (Auth.tsx)
- **Before**: Logged-in users could visit `/auth` and see login form.
- **After**: Auth page detects authenticated user+profile and redirects to role-appropriate home.

### 3. Employer Landing on `/` (App.tsx)
- **Before**: Employer landing on `/` saw candidate swipe UI (confusing).
- **After**: `HomeRedirect` wrapper on `/` route auto-redirects employer to `/employer`.

### 4. Navbar "Dla firm" for Candidates (Navbar.tsx)
- **Before**: Logged-in candidates saw "Dla firm" CTA pointing to `/auth` with employer default — confusing, since they can't switch roles.
- **After**: Removed "Dla firm" from candidate navbar. Only guests see it.

## Candidate vs Employer Onboarding

| Aspect | Candidate | Employer |
|--------|-----------|----------|
| Post-signup landing | `/` (job swipe feed) | `/employer` (dashboard) |
| Onboarding modal | ✅ Multi-step wizard (role, skills, salary, work mode) | ❌ None — straight to dashboard |
| Profile page | `/my-profile` — full candidate form with completeness bar | Blocked by RoleGate → redirects to `/employer` |
| Required fields at signup | Full name | Full name |
| Navbar CTAs | "Mój profil" | "Panel pracodawcy", "Znajdź talent" |

## Route Guards Summary

| Route | Guard | Behavior |
|-------|-------|----------|
| `/` | ProtectedRoute + HomeRedirect | Auth required; employer → `/employer` |
| `/auth` | Auto-redirect if authenticated | Sends to role-appropriate home |
| `/my-profile` | ProtectedRoute + RoleGate(candidate) | Employer → `/employer` |
| `/employer` | ProtectedRoute + RoleGate(employer) | Candidate → `/` |
| `/profiles` | ProtectedRoute + RoleGate(employer) | Candidate → `/` |

## Remaining Dependencies

- **Email confirmation flow**: Post-confirmation redirect depends on Supabase email template `redirectTo`. Currently points to origin root — user must re-login or gets auto-redirected by Auth page.
- **Role switching**: Not supported. Users cannot change role after signup. No UI affordance exists for this.
- **Employer onboarding wizard**: Not implemented. Employers go straight to dashboard. Consider adding a guided first-job-posting flow if needed.
