import React from 'react';
import { Provider } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SocialAuthProps } from './types';
import { ProviderIcons } from './ProviderIcons';
import { AUTH_TEXT } from './constants';

export function SocialAuth({
  supabaseClient,
  providers,
  layout = 'vertical',
  redirectTo,
  setLoading,
  setError,
  clearMessages,
  loading,
}: SocialAuthProps) {
  const handleProviderSignIn = async (provider: Provider) => {
    clearMessages();
    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // If successful, a redirect usually happens.
  };

  return (
    <div
      className={cn(
        'space-y-3',
        layout === 'horizontal' && 'flex space-y-0 space-x-3'
      )}
    >
      {providers.map((provider) => {
        const IconComponent = ProviderIcons[provider];
        const providerName =
          provider.charAt(0).toUpperCase() + provider.slice(1);
        return (
          <Button
            key={provider}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => handleProviderSignIn(provider)}
            disabled={loading}
          >
            {IconComponent && <IconComponent className="h-4 w-4" />}
            {layout === 'vertical'
              ? AUTH_TEXT.CONTINUE_WITH_PROVIDER(providerName)
              : providerName}
          </Button>
        );
      })}
    </div>
  );
}
