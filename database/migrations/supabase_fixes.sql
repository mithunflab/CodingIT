-- Fix for function_search_path_mutable: public.update_chat_sessions_updated_at
ALTER FUNCTION public.update_chat_sessions_updated_at() SET search_path = 'public';

-- Fix for function_search_path_mutable: public.log_file_uploads_changes
ALTER FUNCTION public.log_file_uploads_changes() SET search_path = 'public';

-- Fix for function_search_path_mutable: public.enforce_file_size_limit
ALTER FUNCTION public.enforce_file_size_limit() SET search_path = 'public';

-- Fix for function_search_path_mutable: public.cleanup_expired_uploads
ALTER FUNCTION public.cleanup_expired_uploads() SET search_path = 'public';

-- Fix for function_search_path_mutable: public.set_projects_created_at
ALTER FUNCTION public.set_projects_created_at() SET search_path = 'public';

-- Fix for function_search_path_mutable: public.update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';

-- Fix for function_search_path_mutable: public.handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
