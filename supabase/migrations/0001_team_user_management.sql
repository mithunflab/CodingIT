-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    tier TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users_teams junction table
CREATE TABLE IF NOT EXISTS users_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, team_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_teams_user_id ON users_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_users_teams_team_id ON users_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_users_teams_default ON users_teams(user_id, is_default);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for teams table
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create a team for new users
CREATE OR REPLACE FUNCTION create_user_team()
RETURNS TRIGGER AS $$
DECLARE
    new_team_id UUID;
BEGIN
    -- Create a new team for the user
    INSERT INTO teams (name, email, tier)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Team',
        NEW.email,
        'free'
    )
    RETURNING id INTO new_team_id;
    
    -- Link the user to the team
    INSERT INTO users_teams (user_id, team_id, role, is_default)
    VALUES (NEW.id, new_team_id, 'owner', true);
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically create team for new users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_team();

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teams
CREATE POLICY "Users can view their own teams" ON teams
    FOR SELECT USING (
        id IN (
            SELECT team_id FROM users_teams 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own teams" ON teams
    FOR UPDATE USING (
        id IN (
            SELECT team_id FROM users_teams 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Create RLS policies for users_teams
CREATE POLICY "Users can view their own team memberships" ON users_teams
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Team owners can manage memberships" ON users_teams
    FOR ALL USING (
        team_id IN (
            SELECT team_id FROM users_teams 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );
