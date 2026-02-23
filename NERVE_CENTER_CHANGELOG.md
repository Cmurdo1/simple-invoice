# The Nerve Center — Changelog

## Files Added

| File | Description |
|------|-------------|
| `src/pages/NerveCenter.tsx` | The Nerve Center page — hidden workflow hub with sections for Incoming Signals, Outgoing Pulses, Activity Feed, and AI Task Queue. |
| `src/components/auth/NerveCenterGate.tsx` | Auth gate component that re-authenticates the user before granting access. Only allows `murdochcpm_08@yahoo.com`. Mimics the sign-in page UI. |

## Files Modified

| File | What Changed |
|------|--------------|
| `src/App.tsx` | Added import for `NerveCenter` page. Added `/nerve-center` route wrapped in `ProtectedRoute`. |
| `src/pages/Settings.tsx` | Added `BrainCircuit` icon import. Added `user` from `useAuth()`. Added `NERVE_CENTER_EMAIL` constant. Added "The Nerve Center" card visible only to `murdochcpm_08@yahoo.com`, placed above the Save button. |

## Access Control Summary

- **Route**: `/nerve-center` (unlisted — not in nav, not linked anywhere public)
- **Visibility in Settings**: Only rendered when `user.email === 'murdochcpm_08@yahoo.com'`
- **Auth Gate**: After clicking through from Settings, the user must re-enter their email and password (mimics sign-in page) before the Nerve Center content loads
- **Other users**: The card, route content, and gate all return `null` for non-authorized emails — completely invisible
