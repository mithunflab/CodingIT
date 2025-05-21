---
Date: 2025-05-21
TaskRef: "Fix 'npm run protos' script errors on Windows"

Learnings:
- `new URL(import.meta.url).pathname` on Windows for Node.js scripts can create malformed paths (e.g., `/C:/...`). Use `fileURLToPath(import.meta.url)` from the `url` module for correct path conversion to avoid `ENOENT` errors with `fs.mkdir` (e.g., `C:\C:\...`).
- `protoc` plugins that are Node.js scripts (e.g., `protoc-gen-ts_proto`) can cause `%1 is not a valid Win32 application` on Windows if `protoc` attempts to execute the `.js` file directly.
- Prepending `node ` to the plugin path for `protoc` can lead to `The filename, directory name, or volume label syntax is incorrect` on Windows.
- The standard way to invoke Node.js-based `protoc` plugins is via their shims in `node_modules/.bin/`.
- For Windows, it's crucial to explicitly point `protoc` to the `.cmd` version of the plugin shim (e.g., `node_modules/.bin/protoc-gen-ts_proto.cmd`). This can be achieved by checking `process.platform === "win32"` and appending `.cmd` to the plugin path.
- JavaScript `ReferenceError: Cannot access 'X' before initialization` occurs if a constant is used in another constant's definition before its own definition. Ensure correct order of declarations.

Difficulties:
- Initial path creation error due to `URL.pathname` behavior on Windows.
- `protoc` failing to execute the Node.js plugin correctly, leading to "not a valid Win32 application" and "filename syntax incorrect" errors through various attempts.
- Order of constant initialization causing a `ReferenceError`.
- Underestimating the necessity of the `.cmd` extension for the plugin shim when invoked by `protoc` on Windows.

Successes:
- The `npm run protos` command now executes successfully on Windows.
- Iterative debugging based on error messages led to the correct sequence of fixes.
- Identified and resolved multiple platform-specific (Windows) issues related to path handling and script execution for `protoc` and Node.js.

Improvements_Identified_For_Consolidation:
- General pattern: Handling `file:` URLs to paths in Node.js on Windows (`fileURLToPath`).
- General pattern: Invoking Node.js-based `protoc` plugins on Windows (using `.bin` shims with `.cmd` extension).
- General pattern: Order of constant declarations in JavaScript.
---
