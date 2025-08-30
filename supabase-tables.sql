-- Supabase Tables Creation SQL

-- User Profiles Table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  work_description TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies for user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_assistance BOOLEAN DEFAULT TRUE,
  smart_suggestions BOOLEAN DEFAULT TRUE,
  theme TEXT DEFAULT 'system',
  font_family TEXT DEFAULT 'inter',
  email_notifications BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  security_alerts BOOLEAN DEFAULT TRUE,
  analytics_enabled BOOLEAN DEFAULT TRUE,
  data_sharing_enabled BOOLEAN DEFAULT FALSE,
  telemetry_enabled BOOLEAN DEFAULT TRUE,
  auto_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Integrations Table
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  is_connected BOOLEAN DEFAULT FALSE,
  connection_data JSONB,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, service_name)
);

-- Add RLS policies for user_integrations
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
  ON public.user_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.user_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON public.user_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Security Settings Table
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[],
  last_password_change TIMESTAMP WITH TIME ZONE,
  login_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies for user_security_settings
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security settings"
  ON public.user_security_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings"
  ON public.user_security_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security settings"
  ON public.user_security_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  template_id TEXT,
  status TEXT DEFAULT 'active',
  is_public BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON public.projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content JSONB NOT NULL,
  object_data JSONB,
  result_data JSONB,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their own projects"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = messages.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for their own projects"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = messages.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID,
  title TEXT,
  model TEXT,
  template TEXT,
  message_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat sessions"
  ON public.chat_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
  ON public.chat_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat sessions"
  ON public.chat_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chat Message Cache Table
CREATE TABLE IF NOT EXISTS public.chat_message_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT NOT NULL UNIQUE,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  template TEXT,
  token_count INTEGER,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for chat_message_cache
ALTER TABLE public.chat_message_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their own chat sessions"
  ON public.chat_message_cache
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_message_cache.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for their own chat sessions"
  ON public.chat_message_cache
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE chat_sessions.id = chat_message_cache.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON public.api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create search_user_messages function for message searching
CREATE OR REPLACE FUNCTION public.search_user_messages(
  p_user_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  message_id TEXT,
  session_id TEXT,
  session_title TEXT,
  role TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    cmc.message_id,
    cs.session_id,
    cs.title as session_title,
    cmc.role,
    cmc.content,
    cmc.created_at
  FROM
    public.chat_message_cache cmc
  JOIN
    public.chat_sessions cs ON cmc.session_id = cs.id
  WHERE
    cs.user_id = p_user_id
    AND cmc.content ILIKE '%' || p_query || '%'
  ORDER BY
    cmc.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON public.chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_cache_session_id ON public.chat_message_cache(session_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON public.user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON public.user_security_settings(user_id);