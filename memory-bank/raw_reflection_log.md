---
Date: 2025-07-03
TaskRef: "Fix changelog generation outputting JSON"

Learnings:
- When using `orhun/git-cliff-action` in a GitHub Actions workflow, the `GIT_CLIFF_CONFIG` environment variable uses `git-cliff`'s own templating engine, not GitHub Actions' expression syntax.
- To reference the repository name inside a `git-cliff` template, the correct variable is `{{ repository }}`, not `${{ github.repository }}`.
- An incorrect variable in the template can cause the entire tool to fail to parse the template, leading to unexpected output formats like raw JSON instead of the intended Markdown.

Difficulties:
- The initial error was not immediately obvious, as the workflow did not fail. It produced an incorrect output format, which required inspecting the template logic to debug.

Successes:
- Correctly identified the templating variable mismatch as the root cause of the issue.
- The fix was a simple, targeted change within the workflow file.

Improvements_Identified_For_Consolidation:
- General pattern: When a tool inside a CI/CD workflow produces malformed output, check for issues with templating syntax and variable scope (e.g., CI platform variables vs. tool-specific variables).
