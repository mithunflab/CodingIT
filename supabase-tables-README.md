# Supabase Tables Setup

This document provides instructions for setting up the required Supabase tables for the CodingIT application.

## Prerequisites

1. A Supabase account and project
2. Access to the Supabase SQL Editor

## Setup Instructions

### 1. Configure Environment Variables

The `.env.local` file has been created with the following Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://jzythdghcezfmsvlqjbn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eXRoZGdoY2V6Zm1zdmxxamJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODAxMDQsImV4cCI6MjA3MjE1NjEwNH0.c2i58OTbxViZwMuQR0gZwDsMzDFyal5HbbiPXie8LoI
SUPABASE_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6eXRoZGdoY2V6Zm1zdmxxamJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODAxMDQsImV4cCI6MjA3MjE1NjEwNH0.c2i58OTbxViZwMuQR0gZwDsMzDFyal5HbbiPXie8LoI
```

Additionally, the following API keys have been configured:

```
E2B_API_KEY=e2b_61367642260eed0ac0813d98fd1e8dfd650b5e11
GOOGLE_AI_API_KEY=AIzaSyBamA2UYwEW2OwjEutyLtTRegCnBpAuOsk
```

### 2. Create Database Tables

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the `supabase-tables.sql` file
4. Paste the SQL into the editor and run it

This will create all the necessary tables with proper Row Level Security (RLS) policies.

### 3. Tables Created

The SQL script creates the following tables:

- `user_profiles` - User profile information
- `user_preferences` - User application preferences
- `user_integrations` - Third-party service connections
- `user_security_settings` - Security and 2FA settings
- `projects` - User projects
- `messages` - Project messages
- `chat_sessions` - Chat session metadata
- `chat_message_cache` - Chat message content
- `api_keys` - API key management

### 4. Testing the Connection

To verify the connection is working:

1. Start the application
2. Register a new user account
3. Check the Supabase dashboard to confirm user creation
4. Verify that profile tables are populated

### 5. Postman Testing

The Postman collection has been updated with instructions for setting the `supabase_access_token`. To use the API endpoints:

1. Run the "Login with Email" request in the Authentication folder
2. This will automatically set the `supabase_access_token` environment variable
3. All subsequent requests will use this token for authentication

## Troubleshooting

### Common Issues

- **401 Unauthorized**: Make sure you've set the `supabase_access_token` by running the login request
- **Table doesn't exist**: Verify that all SQL commands executed successfully
- **Permission denied**: Check that RLS policies are correctly configured

### Getting Help

If you encounter issues with the Supabase setup, refer to the [Supabase documentation](https://supabase.com/docs) or check the project's GitHub repository for support.