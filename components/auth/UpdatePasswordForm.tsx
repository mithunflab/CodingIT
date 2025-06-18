"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { KeyRound, Loader2 } from 'lucide-react';
import { UpdatePasswordFormProps } from './types';
import { AuthInput } from './AuthInput';
import { AUTH_TEXT } from './constants';

export function UpdatePasswordForm({
  supabaseClient,
  setLoading,
  setError,
  setMessage,
  clearMessages,
  loading,
}: UpdatePasswordFormProps) {
  const [password, setPassword] = useState('');

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) setError(error.message);
    else setMessage(AUTH_TEXT.SUCCESS_PASSWORD_UPDATED);
    setLoading(false);
    if (!error) setPassword('');
  };

  return (
    <form
      id="auth-update-password"
      onSubmit={handlePasswordUpdate}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold">{AUTH_TEXT.UPDATE_PASSWORD_TITLE}</h3>
      <AuthInput
        id="new-password"
        label={AUTH_TEXT.NEW_PASSWORD_LABEL}
        type="password"
        placeholder={AUTH_TEXT.NEW_PASSWORD_PLACEHOLDER}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        icon={<KeyRound />}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {AUTH_TEXT.UPDATE_PASSWORD_BUTTON}
      </Button>
    </form>
  );
}
