# Cline Consolidated Learnings

## TypeScript Best Practices

**Pattern: Handling Potentially Heterogeneous Data Structures (e.g., from JSON)**
- **Context:** When working with data structures where TypeScript might infer a union type for values (e.g., `number | {prop: string}`), such as when using `Object.entries()` on data loaded from JSON that isn't strictly uniform. This is common when types are derived from flexible data sources like `templates.json`.
- **Problem:** Directly accessing object properties (e.g., `value.prop`) on such a union type will result in TypeScript compiler errors (e.g., `Type error: Property 'X' does not exist on type 'Y'`) because the property might not exist on all types in the union (e.g., `number` doesn't have `prop`).
- **Solution:**
    1.  **Implement Type Guards:** Before accessing potentially missing properties, use type guards to narrow down the type. Common guards include `typeof value === 'object' && value !== null` combined with `&& 'propertyName' in value`.
    2.  **Filter Non-Conforming Data:** For collections (arrays/objects being iterated), filter out entries that don't match the expected structure *before* mapping or processing them. This ensures subsequent operations only deal with valid data.
        - *Example:* `Object.entries(data).filter(([_, t]) => typeof t === 'object' && t !== null && 'expectedProp' in t).map(...)`
    3.  **Explicit Casting (Post-Guard):** After a type guard has confirmed the structure, consider explicitly casting the variable to a more specific type (e.g., `const item = value as ExpectedType;`). This can improve code clarity, enable better autocompletion, and further leverage TypeScript's type system.
- **Rationale:** Prevents runtime errors and ensures code robustness when dealing with data of uncertain or mixed structure. Filtering simplifies subsequent logic, and explicit casting (used judiciously) can enhance type safety within specific scopes.

**Best Practice: Proactive Code Review for Recurring Patterns**
- **Context:** After identifying and fixing a specific bug or error pattern (e.g., a type-related issue).
- **Recommendation:** Actively search the codebase for similar code patterns, data usages, or logic flows that might be susceptible to the same underlying issue.
- **Rationale:** Addressing similar instances proactively prevents future bugs, improves overall code quality, and ensures consistency in how such issues are handled. This is particularly important for type-related issues in TypeScript projects.

## CSS and Styling in Next.js/React Projects

**Pattern: Applying Component-Specific CSS Animations**
- **Context:** When needing to apply CSS animations (e.g., a rainbow border effect) to a specific React component.
- **Method:**
    1.  Define the animation keyframes and associated classes in a dedicated CSS file (e.g., `components/rainbow-animations.css`).
    2.  Import this CSS file directly into the TypeScript component file (e.g., `import "./rainbow-animations.css";` in `components/enhanced-chat-input.tsx`).
    3.  Apply the relevant CSS class(es) to the desired JSX element(s) within the component.
    4.  Ensure no conflicting base styles (e.g., a generic `border` class from Tailwind) override or interfere with the animated border styles. If necessary, remove such conflicting classes from the JSX.
- **Rationale:** This approach encapsulates component-specific styles and animations, making them easy to manage and apply. Direct import ensures the styles are bundled and available when the component is rendered. Removing conflicting utility classes ensures the custom animation is visible.
- **Example:** Adding a `rainbow-border` class from an imported CSS file to a `div` to give it an animated border, and removing a generic `border` class from the same `div`.

**Pattern: Modifying Specific CSS Effects (e.g., Hover, Focus) using Pseudo-elements**
- **Context:** When needing to create or alter conditional CSS effects like hover or focus glows, especially using pseudo-elements (`::before`, `::after`).
- **Method:**
    1.  Define a base style for the pseudo-elements (`.my-component::before`, `.my-component::after`) that includes their content, positioning, initial `opacity: 0;`, and any shared transitions.
    2.  For each desired conditional effect (e.g., focus), create specific rules using the relevant pseudo-class (`.my-component:focus-within::before`) that override properties like `opacity` to make the pseudo-element visible and apply any specific animations.
    3.  To remove an effect (e.g., hover), ensure no rules exist for that specific pseudo-class combination (e.g., delete any `.my-component:hover::before` rules).
- **Rationale:** CSS specificity is key. Defining a base (hidden) state for pseudo-elements and then conditionally revealing/animating them with more specific pseudo-class rules allows for clean separation of effects. This prevents unintended dependencies where, for example, a focus effect might rely on a hover style for its base structure.
- **Example:**
    - Base: `.rainbow-chat-input::before { opacity: 0; ... }`
    - Focus: `.rainbow-chat-input:focus-within::before { opacity: 1; animation: ... }`
    - Hover: (No rules for `.rainbow-chat-input:hover::before` if hover effect is not desired).

## Tool Usage Learnings

**`replace_in_file` vs. `write_to_file` Fallback:**
- **Context:** If `replace_in_file` fails multiple times, especially due to unexpected changes in the target file's content (e.g., file reversion or significant unrelated edits).
- **Strategy:** Use `write_to_file` as a fallback. This ensures the file is set to the exact desired state, bypassing potential issues with matching SEARCH blocks in a changed file.
- **Caution:** `write_to_file` overwrites the entire file. Ensure the provided content is complete and correct for the entire file.

## Supabase & Database Design

**Pattern: Identifying Backend Table Needs from Client-Side Stores**
- **Context:** When determining database table requirements for an application.
- **Strategy:** Always investigate client-side state management solutions (e.g., Zustand, Redux, Context API with `localStorage` persistence via middleware like `zustand/persist`). Data managed here, especially if persisted, often represents entities that are strong candidates for backend database tables if server-side persistence, multi-device sync, or sharing is required.
- **Example:** Discovering `chatSessions` and `projects` were managed in a Zustand store persisted to `localStorage` indicated these were prime candidates for new Supabase tables, rather than assuming they already had backend counterparts.

**Pattern: Handling Mocked or Placeholder Features**
- **Context:** When codebase analysis reveals types or variables suggesting a feature (e.g., `UserTeam` type for team functionality).
- **Strategy:** Verify the implementation. If the feature is currently mocked (e.g., client-side object generation without DB interaction, as seen with `UserTeam` in `lib/auth.ts`), avoid creating backend tables for it prematurely. Note it as a potential future extension. This prevents over-engineering for features not yet fully implemented on the backend.

**Pattern: Standard Supabase Table Practices**
- **New User Profile Trigger:** For tables like `profiles` linked to `auth.users`, implement a trigger on `auth.users` (e.g., `AFTER INSERT`) to automatically create a corresponding row in the `profiles` table. This ensures user profile data consistency from signup.
    - *Example:* `CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`
- **Idempotent Schema Changes:** Use `CREATE TABLE IF NOT EXISTS` (and similar for other DDL commands like `CREATE INDEX IF NOT EXISTS`) to make migration scripts runnable multiple times without error if objects already exist.
- **`updated_at` Timestamps:** For tables with mutable data, create a generic trigger function (e.g., `public.handle_updated_at()`) that sets `NEW.updated_at = now()` and apply it via a `BEFORE UPDATE` trigger on each relevant table.
- **Row Level Security (RLS):** For any table containing user-specific or sensitive data in Supabase, always `ENABLE ROW LEVEL SECURITY` and define appropriate policies (e.g., `USING (auth.uid() = user_id)`) to restrict data access.
- **JSONB for Flexible/Rich Data:** When a field needs to store complex, nested, or evolving structured data (e.g., chat message content with multiple types like text, code, images; or storing AI model responses), use the `JSONB` data type. This provides flexibility and efficient querying capabilities for JSON data.
    - *Example:* `chat_messages.content JSONB NOT NULL` to store an array of message parts.

## AI Persona Prompt Engineering

**Pattern: Structuring Complex AI Persona Prompts**
- **Context:** When designing or refining extensive instructional prompts for AI personas, especially those with specific operational environments and capabilities (like CodinIT).
- **Method:**
    1.  **Thematic Sections:** Organize the prompt into clear, logical sections using descriptive headings (e.g., `<master_operating_principles>`, `<e2b_environment_and_system_constraints>`, `<tool_use_and_artifact_instructions_e2b>`). XML-like tags can be effective for this.
    2.  **Explicit Constraints & Directives:** Clearly state non-negotiable rules, limitations, and mandatory requirements (e.g., "CRITICAL: WebContainer CANNOT execute diff/patch editing. Always write full files."). Use emphasis (bolding, capitalization) for key directives.
    3.  **Critical Reminders:** Include a summary section of the most crucial points that the AI must always adhere to.
    4.  **Illustrative Examples:** Provide concrete examples of inputs and expected outputs, especially for tool usage or complex interactions. This helps the AI understand the desired format and behavior.
    5.  **Layered Specificity:** Start with general principles, then drill down into environment-specific details, tool usage, language patterns, etc.
- **Rationale:** A well-structured prompt enhances the AI's ability to understand and adhere to complex instructions, leading to more consistent, accurate, and reliable performance. It also makes the prompt easier to maintain and update.

**Process: Merging, Refining, and Elaborating Instructional Text for AI**
- **Context:** When combining multiple source prompts or improving an existing one.
- **Steps:**
    1.  **Identify Core Themes & Overlaps:** Analyze source prompts to find common themes, unique contributions, and areas of redundancy.
    2.  **Establish a Primary Structure:** Define a logical flow for the combined prompt (see "Structuring Complex AI Persona Prompts" pattern).
    3.  **Merge Content:** Integrate information from source prompts into the new structure, prioritizing clarity and eliminating contradictions.
    4.  **Elaborate for Clarity:** Expand on key instructions, provide more context, and add details where ambiguity might exist. Define specific terms or operational constraints (e.g., "E2B WebContainer," "fragment execution timeout").
    5.  **Ensure Consistency:** Maintain consistent terminology, formatting, and level of detail throughout the prompt.
    6.  **Add Examples:** Where complex interactions or specific output formats are required, add illustrative examples.
    7.  **Review and Iterate:** Read through the combined prompt from the AI's perspective. Are there any ambiguities? Is anything missing? Is it too verbose in places? Refine as needed.
- **Rationale:** This systematic approach ensures that the final prompt is comprehensive, coherent, and effectively communicates the desired operational parameters and knowledge to the AI. It focuses on maximizing clarity and minimizing potential misunderstandings.

## CodinIT/E2B Specifics

**Key Operational Directives & Constraints (CodinIT Persona in E2B Environment)**
- **Full File Writes:** Due to E2B WebContainer limitations, `diff/patch` style edits are not possible. All file modifications MUST be done by writing the complete file content. This is a critical constraint for any tool that modifies files (e.g., `artifacts` tool).
- **Fragment Execution Timeout:** E2B fragments have a strict execution timeout (e.g., 10 minutes). Design fragments for efficiency and to complete well within this limit. Aim for sub-10 second latency for typical operations.
- **Preferred Tooling (Examples):**
    - **Package Management (JS/TS):** `bun` is the preferred package manager.
    - **Cloud Database:** Supabase is the primary recommendation.
    - **Local/Sandbox Database:** SQLite is preferred for E2B fragments or local development.
- **`CodinITArtifact` System:** This is the primary mechanism for code generation and file operations. Understand the structure of `<CodinITArtifact>` and its `<CodinITAction>` types (e.g., `file`, `shell`, `fragment`, `start`, `supabase`).
- **Technology Stack Detection:** Accurate and automatic detection of the project's technology stack is a foundational step before any code generation or modification.
- **E2B Environment Nuances:** Be aware of limitations like no direct Git access, Python standard library focus (pip not global), and Node.js preference for scripting.
