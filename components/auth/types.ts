import { Provider, SupabaseClient } from '@supabase/supabase-js';
import React from 'react';

export const VIEWS = {
  SIGN_IN: 'sign_in',
  SIGN_UP: 'sign_up',
  FORGOTTEN_PASSWORD: 'forgotten_password',
  MAGIC_LINK: 'magic_link',
  UPDATE_PASSWORD: 'update_password',
} as const;

export type ViewType = (typeof VIEWS)[keyof typeof VIEWS];

export type RedirectTo = undefined | string;

export interface AuthProps {
  supabaseClient: SupabaseClient;
  socialLayout?: 'horizontal' | 'vertical';
  providers?: Provider[];
  view?: ViewType;
  redirectTo?: RedirectTo;
  onlyThirdPartyProviders?: boolean;
  magicLink?: boolean;
  onSignUpValidate?: (
    email: string,
    password: string
  ) => Promise<boolean | { isValid: boolean; message?: string }>; // Updated for better error reporting
  metadata?: Record<string, any>;
}

export interface SubComponentProps {
  supabaseClient: SupabaseClient;
  setAuthView: (view: ViewType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMessage: (message: string | null) => void;
  clearMessages: () => void;
  loading: boolean;
  redirectTo?: RedirectTo;
}

export interface SocialAuthProps {
  supabaseClient: SupabaseClient;
  providers: Provider[];
  layout?: 'horizontal' | 'vertical';
  redirectTo?: RedirectTo;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearMessages: () => void;
  loading: boolean;
}

// This interface seems unused in the original code.
// If it's confirmed to be unused after refactoring other components, it can be removed.
export interface EmailAuthProps extends SubComponentProps {
  view: typeof VIEWS.SIGN_IN | typeof VIEWS.SIGN_UP;
  magicLink?: boolean;
  onSignUpValidate?: (
    email: string,
    password: string
  ) => Promise<boolean | { isValid: boolean; message?: string }>;
  metadata?: Record<string, any>;
}

export interface UseAuthFormReturn {
  loading: boolean;
  error: string | null;
  message: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMessage: (message: string | null) => void;
  clearMessages: () => void;
}

export interface ProviderIconProps {
  className?: string;
}

export type ProviderIconsMap = {
  [key in Provider]?: React.ComponentType<ProviderIconProps>;
};

export interface SignInFormProps extends SubComponentProps {
  magicLink?: boolean;
}

export interface SignUpFormProps extends SubComponentProps {
  onSignUpValidate?: (
    email: string,
    password: string
  ) => Promise<boolean | { isValid: boolean; message?: string }>;
  metadata?: Record<string, any>;
}

export interface MagicLinkFormProps extends SubComponentProps {}

export interface ForgottenPasswordFormProps extends Omit<SubComponentProps, 'setAuthView'> {} // Removed email and setEmail as they are local state

export interface UpdatePasswordFormProps extends Omit<SubComponentProps, 'setAuthView' | 'redirectTo'> {} // Removed email and setEmail
