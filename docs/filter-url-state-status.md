# Filter URL State — Status

## ✅ Implemented

All job filters are now reflected in URL query parameters.

### Supported params

| Param | Filter | Example |
|---|---|---|
| `loc` | Location | `/?loc=Warszawa` |
| `type` | Job type | `/?type=Contract` |
| `salary` | Min salary (thousands) | `/?salary=15` |
| `remote` | Work mode | `/?remote=Zdalnie` |
| `seniority` | Seniority level | `/?seniority=Senior` |
| `skills` | Required skills (comma-separated) | `/?skills=React,TypeScript` |

### Behavior

- **Default values are omitted** from the URL (clean URLs when no filters active)
- **Refresh preserves filters** — filters are restored from URL on mount
- **Shareable links** — `/?loc=Kraków&type=Full-time&skills=React` restores the exact filtered view
- **Combine with other params** — `/?tab=swipe&loc=Warszawa&job=abc123` works correctly
- **Clearing filters** removes all filter params from URL
- Filter changes use `replace: true` to avoid polluting browser history

### Files changed

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Added `filtersFromParams`/`filtersToParams` helpers, init-from-URL effect, `handleFiltersChange` wrapper |

### No changes needed

| File | Reason |
|---|---|
| `JobFilters.tsx` | Component is already controlled via props — no URL awareness needed |
| `useJobFeed.ts` | `updateFilters` already works as a pure setter — URL sync happens at the page level |

## ⏳ Limitations

| Area | Notes |
|---|---|
| **Swipe index not persisted in URL** | Restoring filters resets to first card — by design (swipe position is session-local) |
| **Skill names with special chars** | Comma-separated encoding works for current skills; would need URL encoding for skills containing commas |
| **No server-side filtering** | Filters run client-side against loaded jobs; URL params don't trigger server queries |
