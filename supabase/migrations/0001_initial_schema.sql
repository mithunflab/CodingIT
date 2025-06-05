-- Trigger function to automatically update `updated_at` columns
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles Table
-- Stores public user profile information.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  location TEXT,
  timezone TEXT,
  bio TEXT,
  work_description TEXT,
  preferences JSONB,
  personalized_responses BOOLEAN DEFAULT TRUE,
  activity_status BOOLEAN DEFAULT TRUE,
  profile_visibility TEXT DEFAULT 'private'::text CHECK (profile_visibility IN ('public', 'private', 'contacts')),
  avatar_url TEXT
);

-- Apply the trigger for `updated_at` on profiles
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, avatar_url, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- User API Keys Table
-- Stores API keys provided by users for different AI providers.
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL, -- e.g., 'openai', 'google_gemini', 'anthropic'
  api_key_encrypted TEXT NOT NULL, -- Key should be encrypted before storing
  key_name TEXT, -- User-defined friendly name for the key
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  scopes JSONB -- e.g., ["chat", "image_generation"] for granular permissions
);

-- Apply the trigger for `updated_at` on user_api_keys
CREATE TRIGGER on_user_api_keys_updated
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- RLS for user_api_keys
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own API keys"
  ON public.user_api_keys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Chat Sessions Table
-- Stores chat sessions initiated by users.
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID, -- Nullable, for future team functionality
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  tags TEXT[], -- PostgreSQL array of TEXT
  metadata JSONB -- e.g., for storing selected model, template at session creation
);

-- Apply the trigger for `updated_at` on chat_sessions
CREATE TRIGGER on_chat_sessions_updated
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- RLS for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat sessions"
  ON public.chat_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for faster querying by user
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);


-- Chat Messages Table
-- Stores individual messages within a chat session.
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- User who initiated the action leading to this message
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content JSONB NOT NULL, -- Stores rich message content (text, code, images, tool calls)
  name TEXT, -- For tool name if role is 'tool'
  tool_call_id TEXT,
  tool_calls JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  raw_response JSONB -- Store AI model's raw response or execution results if tied to a message
);
-- Note: `updated_at` is generally not needed for immutable messages.

-- RLS for chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages in their own sessions"
  ON public.chat_messages FOR ALL
  USING (auth.uid() = user_id AND session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()))
  WITH CHECK (auth.uid() = user_id AND session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()));

-- Index for faster querying by session
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);


-- Projects Table
-- Stores user-saved projects, potentially derived from chat sessions.
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID, -- Nullable, for future team functionality
  name TEXT NOT NULL,
  description TEXT,
  chat_session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL, -- Link to original chat if any
  tags TEXT[],
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  visibility TEXT DEFAULT 'private'::text CHECK (visibility IN ('private', 'shared_readonly', 'shared_editable')),
  fragment_data JSONB -- Store FragmentSchema and ExecutionResult if project has code/sandbox output
);

-- Apply the trigger for `updated_at` on projects
CREATE TRIGGER on_projects_updated
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for faster querying by user
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

COMMENT ON COLUMN public.user_api_keys.api_key_encrypted IS 'Store encrypted API key, e.g., using Supabase Vault or pgsodium.';
COMMENT ON COLUMN public.chat_messages.content IS 'Stores rich message content array, e.g., [{type: "text", text: "..."}, {type: "code", ...}].';
COMMENT ON COLUMN public.projects.fragment_data IS 'Stores FragmentSchema and ExecutionResult if the project involves code/sandbox output.';

END;
