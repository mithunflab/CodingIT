-- Ensure the function to update 'updated_at' exists if it was in a previous migration
-- This is often good practice to include if other parts of the schema depend on it,
-- though it's not strictly related to the new user trigger.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-apply or ensure the trigger for updated_at on profiles exists,
-- as creating/replacing functions or tables can sometimes affect triggers.
-- This assumes 'profiles' table already has 'updated_at' and 'created_at' columns.
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles; -- Drop if exists to avoid error
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add email column to profiles table if it doesn't exist,
-- or ensure it's compatible with the handle_new_user function.
-- The existing profiles table migration (20250604095300) does NOT have an email column.
-- This is a critical addition for the trigger to work as designed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    COMMENT ON COLUMN public.profiles.email IS 'User''s email, synced from auth.users. Should ideally be unique if used for lookups, but primary link is ID.';
  END IF;
END $$;

-- Note: If 'full_name' from raw_user_meta_data needs splitting into first_name and last_name,
-- the handle_new_user function would need more complex string manipulation logic.
-- For simplicity, this example puts the full name into 'first_name'.
-- Consider if 'last_name' should be derived or left NULL.
-- If 'email' is intended to be a primary contact detail in 'profiles' and not just for initial sync,
-- you might want to add a UNIQUE constraint, though 'id' is the primary key.
