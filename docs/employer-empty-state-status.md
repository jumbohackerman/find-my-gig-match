# Employer Empty States Status

## Overview
Added instructive and actionable empty states across the employer dashboard to guide users through the product when data is sparse.

## Improved States
1. **No Jobs (`Employer.tsx`)**
   - **Context:** Employer has not posted any jobs yet.
   - **Change:** Clearer copy ("Twoja tablica jest pusta...") with a primary CTA button to "Dodaj ogłoszenie" (Add job), which directly opens the creation form.

2. **Incomplete Employer Setup (`Employer.tsx`)**
   - **Context:** Employer is missing profile details (e.g. company name) or has no jobs.
   - **Change:** Added inline action buttons ("Dodaj ogłoszenie", "Przejdź do profilu") below the list of missing steps to immediately resolve the setup issues.

3. **No Shortlist Yet (`Employer.tsx`)**
   - **Context:** An employer expands a job with applications but no candidates have been shortlisted yet.
   - **Change:** Instead of hiding the section entirely, an empty state is shown inside the expanded view guiding them to use AI. Includes a "Wygeneruj przez AI" CTA button.

4. **No Candidates Yet (`Employer.tsx`)**
   - **Context:** Job exists but has no applications.
   - **Change:** Updated wording to suggest optimizing tags and description rather than just saying "share link", since there's no share feature yet. Same improvement applied to the "Analiza" empty state.

5. **No Messages Yet (`ChatPanel.tsx`)**
   - **Context:** Chat unlocked but no messages exchanged.
   - **Change:** Wording improved to point users to the input field below.

## Dependencies on Live Data
- Job existence check relies on `domainJobs.length` from Supabase (via `useEmployerDashboardData`).
- Application existence relies on `jobApps.length`.
- Messages check relies on `messages.length` passed into `ChatPanel` from `useEmployerMessages`.