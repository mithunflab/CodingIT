---
Date: 2025-06-06
TaskRef: "Fix GitHub sign-in - Pivot to Edge Function due to auth.users trigger permissions"

Learnings:
- Supabase restricts creating triggers directly on the `auth.users` table for the default `postgres` role (or roles without explicit ownership/superuser privileges on the `auth` schema), leading to "42501: must be owner of relation users" errors.
- The Supabase-recommended approach to react to `auth.users` changes (like new user inserts) is to use Database Webhooks that call Supabase Edge Functions.
- Supabase Edge Functions are Deno-based. TypeScript code for Edge Functions will show local linting/type errors in a Node.js/Next.js configured environment because Deno types/globals are not recognized. This is a tooling display issue and doesn't mean the Edge Function code is incorrect for its Deno deployment target.
- The solution was pivoted:
    1. Removed the direct database trigger/function from the SQL migration.
    2. Created a new Supabase Edge Function (`supabase/functions/create-user-profile/index.ts`) to handle profile creation. This function expects a webhook payload, extracts new user data, and inserts a record into `public.profiles`.
    3. The user needs to deploy this Edge Function and configure a Database Webhook in their Supabase dashboard to trigger this function on `INSERT` events in `auth.users`.
- The Edge Function needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables set in the Supabase project settings for the function.

Difficulties:
- Initial approach of using a direct database trigger on `auth.users` was incompatible with Supabase's permission model for the `auth` schema.
- Explaining the distinction between local TypeScript errors for Deno code versus the code's validity in its Deno runtime environment.

Successes:
- Identified the correct Supabase-idiomatic pattern (Edge Function + Webhook) for handling actions on `auth.users` events.
- Created the Edge Function logic to perform the profile creation.

Improvements_Identified_For_Consolidation:
- **Pattern (Supabase - Actions on Auth Events):** For reacting to events in the `auth.users` table (e.g., new user creation), the standard and most reliable method is:
    1. Create a Supabase Edge Function to perform the desired action (e.g., insert into `public.profiles`). This function will use the `SUPABASE_SERVICE_ROLE_KEY` for elevated privileges if needed.
    2. Configure a Database Webhook in the Supabase dashboard that listens for the specific event (e.g., `INSERT` on `auth.users`) and calls the deployed Edge Function via HTTP POST.
- **Tooling (Supabase Edge Functions & Local Dev):** When developing Supabase Edge Functions (Deno/TypeScript) within a Node.js/Next.js project, expect local TypeScript errors for Deno-specific code. This is a local linting issue; the code should be validated against the Deno environment.
- **Edge Function Deployment (Supabase CLI):** `supabase functions deploy <function_name> [--no-verify-jwt]`
- **Edge Function Environment Variables:** Set necessary secrets (like `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) in the Supabase project dashboard for the function.
---
Date: 2025-06-06
TaskRef: "Fix GitHub sign-in - Supabase trigger already exists error"

Learnings:
- When applying Supabase migrations that create database objects like triggers, if the object might already exist from a previous (possibly manual or failed) attempt, the `CREATE` statement will fail.
- To make migration scripts idempotent for such objects, use `DROP <OBJECT_TYPE> IF EXISTS <object_name> ...;` before the `CREATE <OBJECT_TYPE> <object_name> ...;` statement.
- Specifically for the `on_auth_user_created` trigger, adding `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;` before its creation resolved the "trigger already exists" error.

Difficulties:
- Initial migration script did not account for the trigger potentially existing.

Successes:
- Quickly identified the cause of the Supabase migration error.
- Applied the correct fix by making the trigger creation idempotent.

Improvements_Identified_For_Consolidation:
- **Pattern (Supabase Migrations):** For database objects like triggers, functions, policies, etc., always include `DROP <OBJECT_TYPE> IF EXISTS ...;` before `CREATE <OBJECT_TYPE> ...;` in migration scripts to ensure idempotency and prevent errors if the script is run multiple times or if the object was created manually.
---
Date: 2025-06-06
TaskRef: "Fix GitHub sign-in and import - 'Database error saving new user' (https://codingit.vercel.app/?error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user) - Part 2: Update Auth Dialog"

Learnings:
- Added "First Name" and "Last Name" input fields to the `SignUpForm` in `components/auth.tsx`.
- Modified `handleSignUp` in `components/auth.tsx` to pass `first_name` and `last_name` in the `data` option of `supabaseClient.auth.signUp`. This makes them available in `NEW.raw_user_meta_data` for the database trigger.
- Updated the `handle_new_user` database function in `supabase/migrations/20250606063500_add_create_profile_trigger.sql`.
  - The function now uses `COALESCE` to prioritize `NEW.raw_user_meta_data->>'first_name'` and `NEW.raw_user_meta_data->>'last_name'`.
  - If direct `first_name`/`last_name` are not available (e.g., OAuth like GitHub), it falls back to parsing `NEW.raw_user_meta_data->>'full_name'` using `SPLIT_PART` and `SUBSTRING` to populate these fields in the `public.profiles` table.
- This change ensures that user-provided names during email sign-up are correctly stored and provides a reasonable fallback for OAuth sign-ups.

Difficulties:
- Ensuring the SQL logic for parsing `full_name` is robust enough for common name formats and handles cases where `full_name` might be missing or have no spaces. The current implementation is a common approach.

Successes:
- Successfully integrated first and last name collection into the email sign-up flow.
- Adapted the database trigger to utilize this new information while maintaining compatibility with OAuth providers.

Improvements_Identified_For_Consolidation:
- **Pattern (Supabase Auth & User Metadata):** When collecting additional user information at sign-up (e.g., first name, last name), pass it via the `data` option in `supabaseClient.auth.signUp`. This makes it available in `NEW.raw_user_meta_data` within database triggers on `auth.users`, allowing for seamless population of related tables like `public.profiles`.
- **SQL (PostgreSQL - Parsing Names):** When `first_name` and `last_name` are not provided separately but a `full_name` is, `SPLIT_PART(full_name, ' ', 1)` can extract the first name, and `SUBSTRING(full_name from POSITION(' ' IN full_name) + 1)` can extract the remainder as the last name. `COALESCE` is useful for providing fallbacks.
---
Date: 2025-06-06
TaskRef: "Fix GitHub sign-in and import - 'Database error saving new user' (https://codingit.vercel.app/?error=server_error&error_code=unexpected_failure&error_description=Database+error+saving+new+user)"

Learnings:
- Identified that the application was missing an automatic profile creation mechanism in the `public.profiles` table upon new user signup in `auth.users`. This was the likely root cause of the "Database error saving new user".
- Client-side stubs, like the `createDefaultTeam` function in `lib/auth.ts`, were not performing necessary database write operations for profile/team creation, potentially masking data inconsistencies.
- The GitHub OAuth callback route (`app/api/github/callback/route.ts`) acted only as a passthrough for the auth code to the client and did not handle user creation or database operations itself.
- Server actions for profiles (`app/actions/profile.ts`) handled fetching and updating existing profiles but lacked a function for creating new profiles.
- Existing Supabase migrations for the `profiles` table did not include a trigger to automatically create a profile upon new user registration.
- A robust solution for ensuring related records (like profiles) are created with new users in Supabase is to use a database function triggered `AFTER INSERT ON auth.users`.
- The `public.profiles` table was missing an `email` column, which is useful for syncing initial data from `auth.users`. The new migration `20250606063500_add_create_profile_trigger.sql` adds this column and the creation trigger.

Difficulties:
- Tracing the exact point of failure required inspecting multiple layers of the application: client-side authentication logic (`lib/auth.ts`), API callback routes (`app/api/github/callback/route.ts`), server actions (`app/actions/profile.ts`), and database migrations (`supabase/migrations/`).

Successes:
- Successfully diagnosed the root cause of the database error as a missing profile creation step.
- Implemented a standard best-practice solution by creating a Supabase database trigger (`on_auth_user_created`) and function (`handle_new_user`) to automatically populate the `public.profiles` table for new users.
- Ensured the `profiles` table schema is updated (added `email` column) to support the new trigger logic.

Improvements_Identified_For_Consolidation:
- **Pattern (Supabase Auth):** When using Supabase for authentication, ensure that essential related records in public tables (e.g., user profiles, default teams) are automatically created. Database triggers on `auth.users` (specifically `AFTER INSERT`) are a reliable method for this, decoupling core auth events from application-specific data setup.
- **Checklist for New User Signup Flow:**
    1. User authenticates (OAuth, email/password, etc.).
    2. Supabase creates a record in `auth.users`.
    3. **Crucial Step:** A database trigger/function automatically creates corresponding records in `public.profiles` (and other essential related tables like `public.teams` if applicable), pulling initial data from `NEW.id`, `NEW.email`, `NEW.raw_user_meta_data`, etc.
    4. Client-side code, after session establishment, can then reliably query for this profile/team data.
- **Project Specific (codingit.vercel.app):**
    - The client-side `lib/auth.ts` (specifically `createDefaultTeam` and `getUserTeam`) should be reviewed. Now that profiles are created by a DB trigger, `getUserTeam` should ideally fetch this real data (e.g., by calling the `getProfile` server action) rather than relying on local stubs for team/profile information.
    - The `profiles` table schema required an `email` column for better synchronization with `auth.users`; this was added in the new migration.
---
