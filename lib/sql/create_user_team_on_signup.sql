-- Function to create a new team for a user on signup
create or replace function public.create_user_team_on_signup()
returns trigger as $$
declare
  team_id uuid;
begin
  -- Create a new team
  insert into public.teams (name, tier, email)
  values ('My Team', 'free', new.email)
  returning id into team_id;

  -- Link the new user to the new team
  insert into public.users_teams (user_id, team_id, is_default)
  values (new.id, team_id, true);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_user_team_on_signup();
