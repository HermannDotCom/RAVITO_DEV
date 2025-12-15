# E2E Tests for DISTRI-NIGHT

## Prerequisites

These E2E tests are designed to work with the **Landing Page** introduced in PR #80.

### Dependencies
- **PR #80** must be merged before these tests will pass
- The tests assume the following routing:
  - `/` → Landing Page (for unauthenticated users)
  - Landing Page → Click "Se connecter" → Auth Screen with login form
  - Landing Page → Links to `/cgu` and `/mentions-legales`

### Running Tests Locally

```bash
# Install Playwright browsers
npx playwright install chromium

# Run tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# View test report
npm run test:e2e:report
```

### Test Suite Overview

The `auth.spec.ts` file contains 9 comprehensive tests:

1. **Landing Page Display** - Verifies landing page loads with expected elements
2. **Login Navigation** - Tests navigation from landing page to login form
3. **Invalid Credentials** - Tests error handling for bad credentials
4. **Register Navigation** - Tests navigation to registration form
5. **Register Link from Login** - Verifies registration link exists in login form
6. **Demo Accounts** - Optional check for demo account visibility
7. **CGU Navigation** - Tests navigation to CGU (terms) page
8. **Mentions Légales Navigation** - Tests navigation to legal mentions page
9. **Return to Landing** - Tests navigation back to landing page from legal pages

### Current Status

⚠️ **Note**: These tests will FAIL on the main branch until PR #80 (Landing Page) is merged.

The tests are written to be compatible with the post-PR #80 state where:
- `/` shows a Landing Page with "Le ravitaillement qui ne dort jamais" tagline
- Users must click "Se connecter" to reach the auth form
- Legal pages (CGU, Mentions Légales) are accessible

### Troubleshooting

If tests fail:

1. **Check Landing Page exists**: Navigate to `/` and verify you see the Landing Page, not directly the login form
2. **Verify button text**: The "Se connecter" button should be visible in the header
3. **Check legal pages**: `/cgu` and `/mentions-legales` should exist and be accessible
