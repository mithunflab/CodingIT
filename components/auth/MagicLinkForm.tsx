import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { SubComponentProps } from './types'; // Assuming VIEWS is not needed directly
import { AuthInput } from './AuthInput';
import { SupabaseClient } from '@supabase/supabase-js';
import { AUTH_TEXT } from './constants';

export function MagicLink({ // Renaming to MagicLinkForm for consistency if preferred, or keep as MagicLink
  supabaseClient,
  // setAuthView, // Not used directly
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
  redirectTo,
}: SubComponentProps) {
  const [email, setEmail] = useState('');

  const handleMagicLinkSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) setError(error.message);
    else setMessage(AUTH_TEXT.SUCCESS_MAGIC_LINK_SENT);
    setLoading(false);
  };

  return (
    <form
      id="auth-magic-link"
      onSubmit={handleMagicLinkSignIn}
      className="space-y-4"
    >
      <AuthInput
        id="email"
        label={AUTH_TEXT.EMAIL_LABEL}
        type="email"
        placeholder={AUTH_TEXT.EMAIL_PLACEHOLDER}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        icon={<Mail />}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {AUTH_TEXT.SEND_MAGIC_LINK_BUTTON}
      </Button>
    </form>
  );
}
