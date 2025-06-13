import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, KeyRound, Loader2 } from 'lucide-react';
import { VIEWS, SignInFormProps } from './types';
import { AuthInput } from './AuthInput';
import { SupabaseClient } from '@supabase/supabase-js'; // Ensure SupabaseClient is imported if not through props
import { AUTH_TEXT } from './constants';

export function SignInForm({
  supabaseClient,
  setAuthView,
  setLoading,
  setError,
  clearMessages,
  loading,
}: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || AUTH_TEXT.ERROR_UNEXPECTED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="auth-sign-in" onSubmit={handleSignIn} className="space-y-4">
      <AuthInput
        id="email"
        label={AUTH_TEXT.EMAIL_LABEL}
        type="email"
        placeholder={AUTH_TEXT.EMAIL_PLACEHOLDER_GENERIC}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        icon={<Mail />}
      />
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="password">{AUTH_TEXT.PASSWORD_LABEL}</Label>
          <Button
            variant="link"
            type="button"
            onClick={() => setAuthView(VIEWS.FORGOTTEN_PASSWORD)}
            className="p-0 h-auto font-normal text-muted-foreground text-sm"
          >
            {AUTH_TEXT.FORGOT_PASSWORD_LINK}
          </Button>
        </div>
        <AuthInput
          id="password"
          label=""
          type="password"
          placeholder={AUTH_TEXT.PASSWORD_PLACEHOLDER}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          icon={<KeyRound />}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {AUTH_TEXT.SIGN_IN_BUTTON}
      </Button>
    </form>
  );
}
