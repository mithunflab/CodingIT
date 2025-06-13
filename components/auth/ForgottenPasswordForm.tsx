import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { ForgottenPasswordFormProps } from './types';
import { AuthInput } from './AuthInput';
import { SupabaseClient } from '@supabase/supabase-js';
import { AUTH_TEXT } from './constants';

export function ForgottenPasswordForm({
  supabaseClient,
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
  redirectTo,
}: ForgottenPasswordFormProps) {
  const [email, setEmail] = useState('');

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) setError(error.message);
    else setMessage(AUTH_TEXT.SUCCESS_PASSWORD_RESET_SENT);
    setLoading(false);
  };

  return (
    <form
      id="auth-forgot-password"
      onSubmit={handlePasswordReset}
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
        {AUTH_TEXT.SEND_RESET_INSTRUCTIONS_BUTTON}
      </Button>
    </form>
  );
}
