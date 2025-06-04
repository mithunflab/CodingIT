-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  location TEXT,
  timezone TEXT,
  bio TEXT,
  work_description TEXT,
  preferences TEXT, -- For AI interaction preferences
  personalized_responses BOOLEAN DEFAULT TRUE,
  activity_status BOOLEAN DEFAULT TRUE,
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private', 'contacts')),
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can select their own profile
CREATE POLICY "Allow individual user select access"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Allow individual user insert access"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Allow individual user update access"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Optional: Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Optional: Trigger to update updated_at on profile update
CREATE TRIGGER on_profile_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.profiles IS 'Stores user profile information and preferences.';
COMMENT ON COLUMN public.profiles.id IS 'User ID, references auth.users.id.';
COMMENT ON COLUMN public.profiles.first_name IS 'User''s first name.';
COMMENT ON COLUMN public.profiles.last_name IS 'User''s last name.';
COMMENT ON COLUMN public.profiles.company IS 'User''s company name.';
COMMENT ON COLUMN public.profiles.job_title IS 'User''s job title.';
COMMENT ON COLUMN public.profiles.location IS 'User''s location.';
COMMENT ON COLUMN public.profiles.timezone IS 'User''s timezone (e.g., America/Los_Angeles).';
COMMENT ON COLUMN public.profiles.bio IS 'A short biography of the user.';
COMMENT ON COLUMN public.profiles.work_description IS 'Description of the user''s work area/industry.';
COMMENT ON COLUMN public.profiles.preferences IS 'User''s preferences for AI interaction.';
COMMENT ON COLUMN public.profiles.personalized_responses IS 'Flag to enable/disable personalized AI responses based on profile.';
COMMENT ON COLUMN public.profiles.activity_status IS 'Flag to share user''s online activity status.';
COMMENT ON COLUMN public.profiles.profile_visibility IS 'Controls who can see the user''s profile (public, private, contacts).';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL of the user''s avatar image.';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp of the last update to the profile.';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp of when the profile was created.';
