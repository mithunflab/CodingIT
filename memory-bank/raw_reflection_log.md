---
Date: 2025-06-04
TaskRef: "Resolve ERR_BLOCKED_BY_CSP for sandbox preview"

Learnings:
- `ERR_BLOCKED_BY_CSP` indicates a Content Security Policy issue is preventing content from loading.
- In Next.js applications, CSP can be configured in `next.config.mjs` (via the `headers` async function) and also in `middleware.ts`.
- Middleware (`middleware.ts`) can define or override CSP headers, potentially taking precedence over `next.config.mjs` settings for matched paths.
- The `frame-src` directive within a CSP specifically controls which origins are permitted to be embedded as frames (e.g., iframes).
- When debugging `frame-src` issues, ensure the exact domain and subdomain patterns match the resource being framed. In this case, the sandbox URL was `https://[subdomain_part].e2b.app`, and `https://*.e2b.app` was needed in `frame-src`.
- The console logs provided the specific URL being blocked (`3000-iw56o1ebixbtc868ftvsl-9510f9f6.e2b.app`), which was crucial for identifying the missing part in the CSP.

Difficulties:
- The initial check of `next.config.mjs` showed a seemingly correct `frame-src` for `*.e2b.app`. This highlighted the importance of checking other potential sources of CSP headers, like middleware, as they can override or add to the policies.

Successes:
- Correctly hypothesized that middleware was another likely place for CSP definition after `next.config.mjs` didn't reveal the root cause.
- Successfully identified the discrepancy in `middleware.ts` where `frame-src` was missing `https://*.e2b.app` (it only had `https://*.e2b.dev`).
- The modification to `middleware.ts` to add `https://*.e2b.app` to the `frame-src` directive was successful.

Improvements_Identified_For_Consolidation:
- General pattern: When debugging `ERR_BLOCKED_BY_CSP` in a Next.js project, systematically check:
    1. `next.config.mjs` for `headers` configuration.
    2. `middleware.ts` for any CSP header modifications.
    3. Pay close attention to `frame-src` for issues related to iframes or embedded content.
    4. Verify that all necessary domain variations (e.g., `example.com`, `*.example.com`, `sub.example.net`) are correctly listed in the relevant CSP directives.
- Note: The `matcher` in `middleware.ts` config determines which paths the middleware CSP applies to.
---
