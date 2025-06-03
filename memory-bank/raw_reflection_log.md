---
Date: 2025-06-03
TaskRef: "Fix Next.js GitHub Actions build failure due to API routes and static export"

Learnings:
- For Next.js static exports (`output: "export"`), API routes, especially those using `export const dynamic = "force-dynamic"`, must be removed *before* the `next build` command is executed. If removed after `next build` but before `next export`, the build process will still attempt to process them, leading to errors if they are incompatible with static export.
- The command `rm -rf ./app/api ./pages/api || true` is effective for removing these directories. The `|| true` ensures the step doesn't fail if one or both directories are already absent.
- Carefully analyzing build logs provided by the user is crucial for diagnosing CI/CD pipeline issues. The error message "export const dynamic = "force-dynamic" on page "/api/debug" cannot be used with "output: export"" was key.
- When modifying CI workflows, the exact placement of steps is critical.

Difficulties:
- Initial attempts to solve the problem were incorrect because the API routes were being removed too late in the process (after `next build` or not at all in the correct manner).
- Misinterpretation of the initial state of the workflow file led to an incorrect early assessment that no changes were needed.

Successes:
- Successfully diagnosed the root cause of the build failure based on user-provided build logs.
- Correctly modified the GitHub Actions workflow to remove the API directories at the appropriate stage (before `next build`).

Improvements_Identified_For_Consolidation:
- General Pattern: When dealing with build processes that have exclusion requirements (like Next.js static export and API routes), ensure exclusion steps (e.g., file/directory removal) occur *before* the main build/compilation command that would process those items.
- CI/CD Debugging: User-provided build logs are invaluable. Pay close attention to error messages as they often pinpoint the exact incompatibility or misconfiguration.
- Next.js Specific: `dynamic = "force-dynamic"` is incompatible with `output: "export"`. If static export is required, such routes must be excluded from the build input.
---
