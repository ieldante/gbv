# Demo Walkthrough

## Prerequisites

```bash
corepack prepare pnpm@10.4.1 --activate
corepack pnpm bootstrap
corepack pnpm dev
```

## Manual Verification Flow

1. Load `apps/extension/build` as an unpacked extension in Chrome (`chrome://extensions`).
2. Open `http://localhost:3000/hub`.
3. Open the extension popup.
4. Choose a course in the dropdown.
5. Click **Verify**.

## What You Should See

- A structured summary (state, status, score, decision code, identifiers, timing).
- Grouped protocol sections (session/challenge, commitments, semantic findings).
- Expandable **Raw Response** containing the verbatim server payload.

## Expected Baseline Outcomes

- `csk_7r2q9p`: accepted.
- `csk_0a81lm`: semantic verification failure (`module_count_consistency`).
- `csk_3z19tt`: semantic verification failure (`certificate_id_consistency`).
- `csk_t1mix`: semantic verification failure (`grade_threshold`, `course_key_consistency`).
