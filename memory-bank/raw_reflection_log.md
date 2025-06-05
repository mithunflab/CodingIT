---
Date: 2025-06-05
TaskRef: "Fix GET /api/github/repositories 401 error"

Learnings:
- Supabase `createServerClient` in Next.js App Router API routes needs a correctly configured `cookies` object. The methods (`get`, `set`, `remove`) within this object must correctly interface with the `cookies()` store from `next/headers`.
- `cookies()` from `next/headers` is synchronous.
- TypeScript errors regarding Promise types for `cookieStore` (when it should be synchronous `ReadonlyRequestCookies`) can be tricky. An iterative approach to satisfy the linter while maintaining correct runtime logic is needed.
- The pattern `const cookieStore = await cookies();` (at the top of the route handler) and then, within the `createServerClient`'s `cookies` methods (which are `async`): `const store = await cookieStore; return store.get(name)?.value;` (and similar for `set`/`remove`) resolved TypeScript errors. This works because `await` on a non-Promise is a no-op. This structure seems to satisfy linters that might incorrectly infer `cookieStore` or `cookies()` as a Promise in certain contexts.
- The key for Supabase cookie methods is using the correct signatures, e.g., `store.set({ name, value, ...options })` and `store.set({ name, value: '', ...options })` for remove.
- A 401 error in a Supabase server-side route often points to `supabase.auth.getUser()` failing, which is commonly due to issues reading session cookies.

Difficulties:
- Initial attempts to fix the cookie handling logic by making it strictly synchronous (based on `cookies()` being sync) led to TypeScript errors, suggesting the type checker perceived `cookieStore` as a Promise in the context of the `createServerClient` options.
- An unexpected modification by the `replace_in_file` tool's post-processing (adding `await` to `const cookieStore = cookies()`) needed to be analyzed. This change, combined with my subsequent adjustments, led to a state with no TS errors.

Successes:
- Diagnosed the 401 as an authentication issue within the server-side route handler due to `supabase.auth.getUser()` not finding a user.
- Iteratively adjusted the Supabase `createServerClient` cookie configuration to align with documentation and satisfy TypeScript, which should resolve the 401 error.

Improvements_Identified_For_Consolidation:
- Pattern for Supabase `createServerClient` cookie handling in Next.js App Router API routes, especially when encountering confusing TypeScript errors related to Promise types for `cookieStore`.
- Importance of verifying `final_file_content` after `replace_in_file` for unexpected auto-formatter changes.
---
