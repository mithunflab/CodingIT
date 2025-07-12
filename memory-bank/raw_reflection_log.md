---
Date: 2025-07-12
TaskRef: "Configure conventional commits for release.yml"

Learnings:
- The `mathieudutour/github-tag-action` supports conventional commits by default for determining the version bump.
- To make the configuration more explicit, the `release_branches` input can be used to specify which branches trigger a release.
- The `default_bump` input sets the version bump level (e.g., "patch", "minor") to be used when no conventional commit messages are found that would trigger a higher-level bump.

Difficulties:
- The user's initial request about versioning (0.0.9 -> 0.1.0) required clarification to distinguish between a fixed versioning rule and a dynamic one based on commit history. Asking for clarification was key.

Successes:
- The workflow is now explicitly configured for conventional commits on the `main` branch, which makes the process clearer for future maintenance.

Improvements_Identified_For_Consolidation:
- When configuring versioning in CI/CD, make the process as explicit as possible in the workflow file.
- For `mathieudutour/github-tag-action`, explicitly setting `release_branches` and `default_bump` improves clarity even if it matches the default behavior.
---
Date: 2025-07-12
TaskRef: "Fix release.yml annotations errors"

Learnings:
- The `set-output` command in GitHub Actions is deprecated.
- A robust alternative to the `actions/create-release` action is to use the `gh` CLI directly for creating releases (`gh release create`).
- This approach avoids dependencies on how third-party actions handle their outputs (e.g., `set-output` vs. environment files).
- The syntax `gh release create <tag> --title <title> --notes <notes>` is effective and uses the GitHub CLI's capabilities well.

Difficulties:
- The GitHub Actions log was slightly misleading, attributing the `set-output` warning to the `Create a GitHub release` step, when the command was actually used in the preceding `mathieudutour/github-tag-action` step. The key was understanding that the warning appears on the consumer of the deprecated output.

Successes:
- The final workflow is cleaner, more modern, and less likely to break due to third-party action changes. It relies on the stable and well-supported `gh` CLI.

Improvements_Identified_For_Consolidation:
- General pattern: When a GitHub Action shows a `set-output` deprecation warning, and the action causing it cannot be updated, consider replacing the consuming action with a direct CLI call (e.g., using `gh`) to decouple the steps.
