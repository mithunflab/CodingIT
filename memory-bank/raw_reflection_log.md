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
---
Date: 2025-06-03
TaskRef: "Fix Next.js GitHub Actions build failure due to Server Actions and static export"

Learnings:
- Next.js Server Actions (files typically marked with `'use server'`, often located in `app/actions/` or co-located with components) are incompatible with static site generation (`output: "export"`).
- The `actions/configure-pages@v5` GitHub Action, when used with `static_site_generator: next`, automatically configures `output: "export"` in the `next.config.mjs` file. This is a common setup for deploying to static hosting platforms like GitHub Pages.
- To resolve build failures caused by the incompatibility between Server Actions and static export, the directory containing Server Actions (e.g., `app/actions/`) must be removed *before* the `next build` command is executed in the CI/CD pipeline.
- The command `rm -rf ./app/api ./pages/api ./app/actions || true` can be used to remove API routes and Server Action directories. The `|| true` ensures the step doesn't fail if any of these directories are already absent.
- Build logs are essential for diagnosis. The error message "Server Actions are not supported with static export" clearly indicated the problem.

Difficulties:
- No new difficulties encountered in this specific task; it was a direct application of principles learned from the previous similar task regarding API routes.

Successes:
- Accurately identified the incompatibility between Next.js Server Actions and the static export configuration from the build logs.
- Correctly located the Server Action files within the `app/actions/` directory.
- Successfully modified the GitHub Actions workflow file (`.github/workflows/nextjs.yml`) to include the `app/actions` directory in the removal step before the build, resolving the issue.

Improvements_Identified_For_Consolidation:
- Next.js Specific: Server Actions (identified by `'use server'`, commonly in `app/actions/` or co-located) are incompatible with `output: "export"`. For static deployments (e.g., GitHub Pages), these actions must be excluded from the build input, typically by removing their source directory before the `next build` command.
- CI/CD Pipeline Configuration: When a CI/CD step (like `actions/configure-pages@v5`) modifies project configuration for a specific deployment target (e.g., enabling static export), it's crucial to ensure all subsequent build steps are compatible with this modified configuration. If inherent incompatibilities exist (e.g., Server Actions with static export), add explicit steps to remove or disable the incompatible features *before* the primary build command.
---
