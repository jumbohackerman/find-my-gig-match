# Testability Status

## Approach

Stable `data-testid` attributes added to critical interactive elements. These survive text/translation changes, CSS refactors, and component restructuring — unlike selectors based on visible text or class names.

## Convention

- Format: `data-testid="area-element"` (e.g., `auth-submit`, `swipe-apply`, `nav-logout`)
- Only on interactive or structurally important elements
- Not on every DOM node — just the ones tests need to target

## Selectors Added

### Auth Flow (`src/pages/Auth.tsx`)
| Selector | Element |
|---|---|
| `auth-form` | Login/signup/forgot form element |
| `auth-role-candidate` | Role picker: candidate |
| `auth-role-employer` | Role picker: employer |
| `auth-fullname` | Full name input (signup) |
| `auth-email` | Email input |
| `auth-password` | Password input |
| `auth-submit` | Submit button |
| `auth-toggle-mode` | Switch between login/signup |

### Navigation (`src/components/Navbar.tsx`)
| Selector | Element |
|---|---|
| `navbar` | Top-level header |
| `nav-logo` | Logo / home link |
| `nav-profile` | "My profile" link (candidate) |
| `nav-notifications` | Notifications bell button |
| `nav-logout` | Logout button |

### Browse / Swipe (`src/pages/Index.tsx`, `src/components/SwipeCard.tsx`)
| Selector | Element |
|---|---|
| `tab-swipe` | Browse tab |
| `tab-applied` | Applications tab |
| `tab-saved` | Saved tab |
| `tab-recent` | Recently viewed tab |
| `swipe-skip` | Skip (left) button |
| `swipe-save` | Save (star) button |
| `swipe-apply` | Apply (right) button |
| `swipe-card` | Swipe card container |

### Employer Dashboard (`src/pages/Employer.tsx`)
| Selector | Element |
|---|---|
| `employer-dashboard` | Dashboard main area |
| `employer-add-job` | "Add job" button |
| `employer-submit-job` | Job form submit button |

### Messaging (`src/components/employer/ChatPanel.tsx`)
| Selector | Element |
|---|---|
| `chat-send` | Send message button |

### Profile (`src/pages/MyProfile.tsx`)
| Selector | Element |
|---|---|
| `profile-save` | Save profile button |

### Moderation (`src/components/ReportButton.tsx`)
| Selector | Element |
|---|---|
| `report-open` | Open report dialog button |
| `report-submit` | Submit report button |

## Flows Now Testable with Stable Selectors

1. **Auth** — login, signup with role selection, mode switching
2. **Browse/Swipe** — tab navigation, skip/save/apply actions
3. **Employer** — job creation, dashboard interaction
4. **Profile** — save profile
5. **Messaging** — send message
6. **Moderation** — report flow

## Usage in Playwright

```ts
// Stable — won't break on text changes
await page.getByTestId("auth-email").fill("user@test.com");
await page.getByTestId("auth-submit").click();

// Instead of fragile:
// await page.getByText("Zaloguj się").click();
```

## What's NOT Annotated (by design)

- Individual job cards in the employer list (dynamic, use `nth` or data attributes on the card level)
- Modal overlay backdrops
- Skeleton/loading states
- Footer links (low test priority)
- Notification list items (dynamic content)
