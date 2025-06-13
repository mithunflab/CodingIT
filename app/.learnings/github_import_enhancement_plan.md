# GitHub Import Enhancement Plan

## 1. Introduction and Goals

This document outlines a plan to address the "incorrect import" issue with the GitHub repository import functionality. The primary goal is to make the import process more comprehensive, configurable, and reliable by addressing the limitations in the current file fetching mechanism.

## 2. Analysis Summary

The GitHub import process currently works as follows:

1.  **UI (`components/modals/github-import-modal.tsx`):**
    *   The modal initiates the import by calling the `/api/github/import` endpoint.
    *   It passes the selected repository's `owner` and `repo` name, along with a `maxFiles` parameter, which is hardcoded to `50`.

2.  **API Endpoint (`app/api/github/import/route.ts`):**
    *   This Next.js route handler receives the request.
    *   It retrieves the user's GitHub access token.
    *   It instantiates `GitHubIntegration` from `lib/github-integration.ts`.
    *   It calls the `downloadRepository` method of `GitHubIntegration`, passing the `owner`, `repo`, and the `maxFiles` (50) parameter.
    *   The files returned by `downloadRepository` are then passed to `ProjectAnalyzer` from `lib/project-analyzer.ts`.
    *   The `ProjectAnalyzer` analyzes the content of the files it receives but does not appear to filter out files itself.

3.  **Core Import Logic (`lib/github-integration.ts` - `downloadRepository` method):**
    *   This method is responsible for fetching the repository contents.
    *   **This is the primary source of the "incorrect import" due to several hardcoded limitations:**
        *   **`maxFiles` limit:** Defaults to 50.
        *   **`allowedExtensions`:** A specific, limited list of file extensions.
        *   **Directory Depth Limit:** Recursion depth is limited to 5 levels.
        *   **Directory Exclusion:** `node_modules` and dot-prefixed directories (e.g., `.github`, `.vscode`) are skipped.
        *   **File Size Limit:** Individual files larger than 1MB are skipped.

## 3. Hypothesis for "Incorrect Import"

The "incorrect import" is caused by the restrictive filters and limits in the `GitHubIntegration.downloadRepository` method. These limitations lead to relevant files being excluded from the download, resulting in an incomplete import for repositories that exceed these limits or contain important files outside these criteria.

## 4. Proposed Implementation Steps

The plan is to make the GitHub import more flexible by allowing user configuration for these limits.

### Phase 1: Backend Modifications (`lib/github-integration.ts`)

1.  **Enhance `GitHubIntegration.downloadRepository` Method:**
    *   **Modify Signature:** Update the method signature to accept an optional `options` object:
        ```typescript
        async downloadRepository(
          owner: string,
          repo: string,
          options?: {
            maxFiles?: number;
            allowedExtensions?: string[];
            maxDepth?: number;
            includeDotFolders?: boolean; // To specifically allow dot-folders if true
            maxFileSizeMB?: number;
          }
        ): Promise<{ name: string; path: string; content: string }[]>
        ```
    *   **Default Values:** Set reasonable defaults within the method if options are not provided (e.g., `maxFiles = 50`, `maxDepth = 5`, `includeDotFolders = false`, `maxFileSizeMB = 1`). The existing `allowedExtensions` can serve as a default.
    *   **Apply Options:**
        *   Use `options.maxFiles` instead of the hardcoded `maxFiles`.
        *   Use `options.allowedExtensions` if provided, otherwise use the default list.
        *   Use `options.maxDepth` for the recursion depth check.
        *   Modify the directory skipping logic: if `options.includeDotFolders` is `false` (or not set), skip dot-folders. If `true`, include them (still skip `node_modules`).
        *   Use `options.maxFileSizeMB` to check file content length (e.g., `content.length < (options.maxFileSizeMB || 1) * 1024 * 1024`).
    *   **Logging:** Add more detailed logging within `downloadRepository` to show which files are being processed, skipped (and why), and included, especially when options are active.

### Phase 2: API Endpoint Modifications (`app/api/github/import/route.ts`)

1.  **Update `POST` Handler:**
    *   Modify the request body parsing to accept the new optional configuration parameters: `maxFiles`, `allowedExtensions`, `maxDepth`, `includeDotFolders`, `maxFileSizeMB`.
        ```typescript
        const {
          owner,
          repo,
          maxFiles, // Will be passed from client
          allowedExtensions, // Will be passed from client
          maxDepth, // Will be passed from client
          includeDotFolders, // Will be passed from client
          maxFileSizeMB // Will be passed from client
        } = await request.json();
        ```
    *   Construct the `options` object based on these parameters.
    *   Pass this `options` object to `github.downloadRepository(owner, repo, options)`.

### Phase 3: Frontend UI Modifications (`components/modals/github-import-modal.tsx`)

1.  **Add Advanced Settings UI:**
    *   Introduce a collapsible section or a separate "Advanced Settings" area in the modal.
    *   Add input fields/controls for:
        *   `maxFiles` (number input)
        *   `allowedExtensions` (text input for comma-separated values, or a multi-select if more advanced UI is desired)
        *   `maxDepth` (number input)
        *   `includeDotFolders` (checkbox/switch)
        *   `maxFileSizeMB` (number input)
    *   Provide reasonable default values in the UI, matching the backend defaults.
2.  **Update `handleImport` Function:**
    *   Collect the values from these new UI controls.
    *   Include them in the `body` of the `fetch` request to `/api/github/import`.
        ```typescript
        body: JSON.stringify({
          owner,
          repo,
          maxFiles: /* value from UI */,
          allowedExtensions: /* value from UI, parsed into array */,
          maxDepth: /* value from UI */,
          includeDotFolders: /* value from UI */,
          maxFileSizeMB: /* value from UI */
        }),
        ```

### Phase 4: Testing and Verification

1.  **Unit Tests (Optional but Recommended):**
    *   Add unit tests for `GitHubIntegration.downloadRepository` to verify behavior with different option combinations.
2.  **Manual Testing:**
    *   Test with various repositories:
        *   Small repositories (should still work).
        *   Large repositories (exceeding default limits but within new configurable limits).
        *   Repositories with various file types (some outside default `allowedExtensions`).
        *   Repositories with deep directory structures.
        *   Repositories with important files in dot-folders (e.g., `.github/workflows`).
        *   Repositories with large files.
    *   Verify that the UI controls for advanced settings work correctly and pass the values to the API.
    *   Check console logs for detailed tracing from `downloadRepository`.

## 5. Future Considerations

*   **Preset Configurations:** Offer presets for common scenarios (e.g., "Quick Scan," "Full Import").
*   **More Granular File/Folder Selection:** For very large repositories, a more interactive file tree browser within the modal could allow users to select specific files/folders to import, rather than relying solely on global filters.

This plan aims to provide a robust solution to the GitHub import limitations.
