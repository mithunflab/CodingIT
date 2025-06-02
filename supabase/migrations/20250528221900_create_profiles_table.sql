-- Create the profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  birth_year INTEGER,
  role TEXT,
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments to the table and columns
COMMENT ON TABLE public.profiles IS 'Stores user profile information, extending auth.users.';
COMMENT ON COLUMN public.profiles.id IS 'References the user ID from auth.users table.';
COMMENT ON COLUMN public.profiles.email IS 'User''s email address, must be unique.';
COMMENT ON COLUMN public.profiles.first_name IS 'User''s first name.';
COMMENT ON COLUMN public.profiles.last_name IS 'User''s last name.';
COMMENT ON COLUMN public.profiles.full_name IS 'User''s full name (optional, can be derived).';
COMMENT ON COLUMN public.profiles.birth_year IS 'User''s birth year (optional).';
COMMENT ON COLUMN public.profiles.role IS 'User''s role within the application (optional).';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to the user''s avatar image (optional).';
COMMENT ON COLUMN public.profiles.bio IS 'A short biography of the user (optional).';
COMMENT ON COLUMN public.profiles.preferences IS 'User-specific preferences stored as a JSON object.';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp of when the profile was created.';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp of when the profile was last updated.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Allow individual user read access"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Allow individual user update access"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile (should be handled by trigger, but good for direct API calls)
CREATE POLICY "Allow individual user insert access"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Trigger function to automatically update `updated_at` timestamp
CREATE OR REPLACE FUNCTION public.handle_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_updated_at();

-- Function to create a new profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_meta_data JSONB;
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_full_name TEXT;
  user_avatar_url TEXT;
BEGIN
  -- Extract email from the new user record
  user_email := NEW.email;

  -- Attempt to extract metadata if available (e.g., from OIDC provider)
  user_meta_data := NEW.raw_user_meta_data;

  IF user_meta_data IS NOT NULL THEN
    user_first_name := user_meta_data->>'given_name';
    user_last_name := user_meta_data->>'family_name';
    user_full_name := user_meta_data->>'name'; -- OIDC standard claim for full name
    IF user_full_name IS NULL THEN
        user_full_name := TRIM(CONCAT(user_first_name, ' ', user_last_name));
    END IF;
    user_avatar_url := user_meta_data->>'avatar_url';
    IF user_avatar_url IS NULL THEN
      user_avatar_url := user_meta_data->>'picture'; -- Another common OIDC claim for avatar
    END IF;
  END IF;

  -- Insert a new row into public.profiles
  INSERT INTO public.profiles (id, email, first_name, last_name, full_name, avatar_url, preferences)
  VALUES (
    NEW.id,
    user_email,
    user_first_name,
    user_last_name,
    user_full_name,
    user_avatar_url,
    '{
      "theme": "system",
      "emailNotifications": true,
      "newsletterFrequency": "weekly"
    }'::JSONB -- Default preferences
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on new user creation in auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Optional: Function to update profile email if auth.users email changes
-- This might be desired if you allow email changes and want them to cascade.
-- Ensure RLS allows this operation or run as security definer.
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email, updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_updated
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email) -- Only run if email actually changed
EXECUTE FUNCTION public.handle_user_email_update();

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_profile_updated_at() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_user_email_update() TO supabase_auth_admin;

-- Grant usage on schema to postgres and anon, authenticated roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;

-- Grant select, insert, update, delete on profiles table to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;

-- Grant all on profiles table to service_role (for admin tasks, bypasses RLS)
GRANT ALL ON TABLE public.profiles TO service_role;

-- Grant usage on all sequences in public schema (if any are used by profiles, e.g. for serials, though not in this setup)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
