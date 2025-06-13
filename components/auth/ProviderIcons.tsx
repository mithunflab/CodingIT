import React from 'react';
import { Provider } from '@supabase/supabase-js';
import * as SimpleIcons from 'simple-icons';
import { ProviderIconsMap } from './types';

export const ProviderIcons: ProviderIconsMap = {
  github: ({ className }) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: SimpleIcons.siGithub.svg }}
    />
  ),
  google: ({ className }) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: SimpleIcons.siGoogle.svg }}
    />
  ),
  // Add other providers here as needed
};
