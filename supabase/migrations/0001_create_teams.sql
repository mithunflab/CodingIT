-- Fix existing users who don't have teams
DO $$
DECLARE
    user_record RECORD;
    new_team_id UUID;
BEGIN
    -- Loop through users who don't have any teams
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN users_teams ut ON u.id = ut.user_id
        WHERE ut.user_id IS NULL
    LOOP
        -- Create a team for each user without one
        INSERT INTO teams (name, email, tier)
        VALUES (
            COALESCE(user_record.raw_user_meta_data->>'full_name', split_part(user_record.email, '@', 1)) || '''s Team',
            user_record.email,
            'free'
        )
        RETURNING id INTO new_team_id;
        
        -- Link the user to the team
        INSERT INTO users_teams (user_id, team_id, role, is_default)
        VALUES (user_record.id, new_team_id, 'owner', true);
        
        RAISE NOTICE 'Created team % for user %', new_team_id, user_record.email;
    END LOOP;
END $$;
