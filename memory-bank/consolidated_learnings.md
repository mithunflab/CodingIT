## Node.js - Native Module Compilation
**Pattern: Troubleshooting Native Module Compilation Failures (e.g., `better-sqlite3`, `node-gyp` errors)**
1.  **Check `.nvmrc`**: If present, this file indicates the project's recommended Node.js version. Use NVM to install and use this version.
2.  **Try LTS Versions**:
    *   If `.nvmrc` specifies `lts/*` or a general LTS, start with the *current* latest LTS version of Node.js.
    *   If the current LTS fails, try the *previous* LTS line (e.g., if Node 22.x fails, try Node 20.x). Older native modules or specific versions might have better prebuilt binary support or source compatibility with older LTS versions.
3.  **Clean Environment**: Before retrying `npm install` after a version change or failure:
    *   Clean npm cache: `npm cache clean --force`
    *   Delete `node_modules` directory.
    *   Delete `package-lock.json` (or `yarn.lock`).
4.  **Build Tools**: Ensure necessary build tools are installed and correctly configured for your OS (e.g., Python, C++ compiler like MSVC for Windows, Xcode command-line tools for macOS). `node-gyp` relies on these.
5.  **Check Dependency Versions**: Examine `package.json` for specific version constraints on the problematic native module and its `@types/*` counterpart. Sometimes, a very specific version of the module or Node.js is required.

## Project: CodinIt (c:/Users/Gerome/CodingIT)
**Sub-project: `evals/cli/`**
-   **Node.js Version**: Requires Node.js 20.x LTS (e.g., v20.19.2) for successful installation of `better-sqlite3@^8.0.0`. Node 22.x LTS and Node 23.x (current) caused compilation failures for this dependency as of May 2025.
-   **Installation**: `cd evals/cli && npm install` (after switching to Node 20.x).

**Main Extension (Root Directory)**
-   **Node.js Version**: Works with Node.js 20.x LTS (e.g., v20.19.2).
-   **Installation**: `npm install` in the root directory.
-   **Compilation**: `npm run compile` (this runs type checks, linting, and `node esbuild.js`).
-   **Entry Point**: `./dist/extension.js`

## Windows CLI Commands
**File/Directory Deletion:**
-   **cmd.exe**:
    -   Delete directory recursively and quietly: `rmdir /s /q directory_name`
    -   Delete file: `del file_name`
-   **PowerShell**:
    -   Delete directory recursively and quietly: `Remove-Item -Recurse -Force directory_name -ErrorAction SilentlyContinue`
    -   Delete file quietly: `Remove-Item -Force file_name -ErrorAction SilentlyContinue`
    *Rationale:* Using `-ErrorAction SilentlyContinue` prevents script interruption if a file/folder is already gone or locked, which can be useful in cleanup scripts.
