### .CodinITignore Support

To give you more control over which files are accessible to CodinIT, we've implemented `.CodinITignore` functionality, similar to `.gitignore`. This allows you to specify files and directories that CodinIT should **not** access or process. This is useful for:

*   **Privacy:** Preventing CodinIT from accessing sensitive or private files in your workspace.
*   **Performance:**  Excluding large directories or files that are irrelevant to your tasks, potentially improving the efficiency of CodinIT.
*   **Context Management:**  Focusing CodinIT's attention on the relevant parts of your project.

**How to use `.CodinITignore`**

1.  **Create a `.CodinITignore` file:** In the root directory of your workspace (the same level as your `.vscode` folder, or the top level folder you opened in VS Code), create a new file named `.CodinITignore`.

2.  **Define ignore patterns:** Open the `.CodinITignore` file and specify the patterns for files and directories you want CodinIT to ignore. The syntax is the same as `.gitignore`:

    *   Each line in the file represents a pattern.
    *   **Standard glob patterns are supported:**
        *   `*` matches zero or more characters
        *   `?` matches one character
        *   `[]` matches a character range
        *   `**` matches any number of directories and subdirectories.

    *   **Directory patterns:** Append `/` to the end of a pattern to specify a directory.
    *   **Negation patterns:** Start a pattern with `!` to negate (un-ignore) a previously ignored pattern.
    *   **Comments:** Start a line with `#` to add comments.

    **Example `.CodinITignore` file:**

    ```
    # Ignore log files
    *.log

    # Ignore the entire 'node_modules' directory
    node_modules/

    # Ignore all files in the 'temp' directory and its subdirectories
    temp/**

    # But DO NOT ignore 'important.log' even if it's in the root
    !important.log

    # Ignore any file named 'secret.txt' in any subdirectory
    **/secret.txt
    ```

3.  **CodinIT respects your `.CodinITignore`:** Once you save the `.CodinITignore` file, CodinIT will automatically recognize and apply these rules.

    *   **File Access Control:** CodinIT will not be able to read the content of ignored files using tools like `read_file`. If you attempt to use a tool on an ignored file, CodinIT will inform you that access is blocked due to `.CodinITignore` settings.
    *   **File Listing:** When you ask CodinIT to list files in a directory (e.g., using `list_files`), ignored files and directories will still be listed, but they will be marked with a **🔒** symbol next to their name to indicate that they are ignored. This helps you understand which files CodinIT can and cannot interact with.

4.  **Dynamic Updates:** CodinIT monitors your `.CodinITignore` file for changes. If you modify, create, or delete your `.CodinITignore` file, CodinIT will automatically update its ignore rules without needing to restart VS Code or the extension.

**In Summary**

The `.CodinITignore` file provides a powerful and flexible way to control CodinIT's access to your workspace files, enhancing privacy, performance, and context management. By leveraging familiar `.gitignore` syntax, you can easily tailor CodinIT's focus to the most relevant parts of your projects.