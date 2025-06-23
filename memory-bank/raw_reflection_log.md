---
Date: 2025-06-23
TaskRef: "Fix E2B tool panel error: template 'codinit-engineer' not found"

Learnings:
- Identified that the error was caused by hardcoded, non-existent E2B sandbox template names in `lib/e2b/toolPrompts.ts`.
- The valid templates are defined by the directories in `sandbox-templates/`.
- The `selectOptimalTemplate` function is a good pattern for dynamically choosing a template based on user input, but its default was incorrect.
- Several tool prompt generators were not using this dynamic selection, leading to errors.

Difficulties:
- Tracing the source of the template name required inspecting multiple files (`app/api/tools/route.ts` and `lib/e2b/toolPrompts.ts`).

Successes:
- Successfully identified the root cause of the error.
- Refactored the code to not only fix the immediate error but also to make the tool selection more robust by using the `selectOptimalTemplate` function across multiple tool generators.
- Corrected the default fallback template to a valid one (`nextjs-developer`).

Improvements_Identified_For_Consolidation:
- General pattern: When dealing with selectable items like templates, avoid hardcoding values. Use a dynamic selection function with a safe, valid default.
- Project Specific: The E2B tool implementation relies on template names matching directory names in `sandbox-templates/`. This is a key architectural detail to remember.
---
