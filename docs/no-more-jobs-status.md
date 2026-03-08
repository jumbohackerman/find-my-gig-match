# No More Jobs / Exhausted Feed — Status

## ✅ Improved

### "All swiped" state (`isFinished`)
- **Headline**: "Wszystko przejrzane!" with 🎉 emoji
- **Stats**: Shows count of reviewed jobs + saved/applications summary
- **CTAs** (stacked, primary first):
  1. **Zacznij od nowa** — resets swipe history (primary/gradient button)
  2. **Zmień filtry** — clears active filters to broaden results (shown only when filters are active)
  3. **Przeglądaj zapisane** — jumps to saved tab with count (shown only when saved jobs exist)

### "No filter matches" state (`filteredJobs.length === 0`)
- **Headline**: "Brak pasujących ofert" with 🔍 emoji
- **Description**: "Spróbuj zmienić kryteria wyszukiwania."
- **CTAs**:
  1. **Wyczyść filtry** — resets all filters (primary button)
  2. **Zapisane oferty** — navigates to saved tab (shown when saved jobs exist)

## Files changed

| File | Change |
|---|---|
| `src/pages/Index.tsx` | Replaced both empty states with richer layouts, added `hasActiveFilters` check, imported additional icons |

## ⏳ Live-data dependencies

| Area | Notes |
|---|---|
| **Job count accuracy** | `filteredJobs.length` depends on client-side loaded jobs; with server-side filtering, the count would reflect the true dataset |
| **"Zacznij od nowa"** | Clears `swipe_events` in DB — works fully with live backend |
| **New job arrivals** | Currently no real-time subscription for new jobs; user must refresh or reset to see newly posted jobs |
