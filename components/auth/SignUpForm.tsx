import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, KeyRound, Loader2, User } from 'lucide-react';
import { SignUpFormProps } from './types'; // Assuming VIEWS is also in types or not needed directly here
import { AuthInput } from './AuthInput';
import { SupabaseClient } from '@supabase/supabase-js'; // Ensure SupabaseClient is imported
import { AUTH_TEXT } from './constants';

export function SignUpForm({
  supabaseClient,
  // setAuthView, // Not used directly in this component's logic if view changes are handled by parent
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
  redirectTo,
  onSignUpValidate,
  metadata,
}: SignUpFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error(AUTH_TEXT.ERROR_PASSWORD_MISMATCH);
      }
      if (onSignUpValidate) {
        const validationResult = await onSignUpValidate(email, password);
        if (typeof validationResult === 'boolean' && !validationResult) {
          throw new Error(AUTH_TEXT.ERROR_INVALID_EMAIL_GENERIC);
        } else if (
          typeof validationResult === 'object' &&
          !validationResult.isValid
        ) {
          throw new Error(
            validationResult.message || AUTH_TEXT.ERROR_INVALID_EMAIL_GENERIC
          );
        }
      }
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            ...metadata,
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (error) throw error;
      if (data.user && !data.session) {
        setMessage(AUTH_TEXT.SUCCESS_CONFIRMATION_LINK_SENT);
      }
    } catch (error: any) {
      setError(error.message || AUTH_TEXT.ERROR_UNEXPECTED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form id="auth-sign-up" onSubmit={handleSignUp} className="space-y-4">
      <div className="flex space-x-4">
        <AuthInput
          id="first-name"
          label="First Name"
          type="text"
          placeholder="Your first name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          autoComplete="given-name"
          icon={<User />}
        />
        <AuthInput
          id="last-name"
          label="Last Name"
          type="text"
          placeholder="Your last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          autoComplete="family-name"
          icon={<User />}
        />
      </div>
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
      <AuthInput
        id="password"
        label={AUTH_TEXT.PASSWORD_LABEL}
        type="password"
        placeholder={AUTH_TEXT.PASSWORD_PLACEHOLDER}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        icon={<KeyRound />}
      />
      <AuthInput
        id="confirm-password"
        label={AUTH_TEXT.CONFIRM_PASSWORD_LABEL}
        type="password"
        placeholder={AUTH_TEXT.PASSWORD_PLACEHOLDER}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
        icon={<KeyRound />}
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {AUTH_TEXT.SIGN_UP_BUTTON}
      </Button>
    </form>
  );
}
