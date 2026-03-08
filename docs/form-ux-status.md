# Form UX & Validation Status

## ✅ Reviewed & Improved

| Area | Changes | File(s) |
|---|---|---|
| **Auth: password hint** | Placeholder "Min. 6 znaków", inline validation for short passwords during signup | `Auth.tsx` |
| **Auth: email placeholder** | "ty@przyklad.pl" → "jan@przyklad.pl" (more natural) | `Auth.tsx` |
| **Auth: double submit** | Already guarded via `loading` + `disabled` ✓ | `Auth.tsx` |
| **Employer: job form submit** | Button now shows "Publikuję…" while submitting | `Employer.tsx` |
| **Employer: optional fields** | Salary, Logo, Tags labeled as "(opcjonalne)" | `Employer.tsx` |
| **Employer: description** | Placeholder improved + char counter (2000 max) | `Employer.tsx` |
| **MyProfile: save button** | Added `aria-busy`, `disabled:pointer-events-none` to prevent double-submit | `MyProfile.tsx` |
| **ResetPassword: hint** | "Wprowadź poniżej nowe hasło" → includes "(min. 6 znaków)" | `ResetPassword.tsx` |
| **Onboarding: step 0** | Helper text when role title is empty | `OnboardingModal.tsx` |
| **Onboarding: step 1** | Hint "wybierz co najmniej 1" when no skills selected | `OnboardingModal.tsx` |
| **Report modal** | Already well-structured: reason required, sending state, disabled guard ✓ | `ReportButton.tsx` |

## ✅ Already Good (no changes needed)

- Auth form: `required` attributes, proper `autoComplete`, `minLength`, accessible labels
- MyProfile: completeness bar, character counters on summary/bullets/description
- Report modal: reason selection required before submit, loading state
- Onboarding: step validation via `canNext` disabling the Next button
- CV upload: PDF-only validation, uploading state feedback

## ⏳ Needs live backend verification

| Area | Notes |
|---|---|
| **Auth error messages** | Supabase error messages may appear in English — may need mapping to Polish |
| **Job creation validation** | Server-side constraints (title length, duplicate detection) untested |
| **CV upload size limit** | Storage bucket config may need max file size enforcement |
| **Profile save conflicts** | Concurrent edits not handled — low priority for single-user profiles |
