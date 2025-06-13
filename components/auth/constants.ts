export const AUTH_TEXT = {
  // Labels
  EMAIL_LABEL: 'Email address',
  PASSWORD_LABEL: 'Password',
  CONFIRM_PASSWORD_LABEL: 'Confirm Password',
  NEW_PASSWORD_LABEL: 'New Password',

  // Placeholders
  EMAIL_PLACEHOLDER: 'you@example.com',
  EMAIL_PLACEHOLDER_GENERIC: 'your email',
  PASSWORD_PLACEHOLDER: '••••••••',
  NEW_PASSWORD_PLACEHOLDER: 'Enter new password',

  // Button Texts
  SIGN_IN_BUTTON: 'Sign In',
  SIGN_UP_BUTTON: 'Sign Up',
  SEND_MAGIC_LINK_BUTTON: 'Send Magic Link',
  SEND_RESET_INSTRUCTIONS_BUTTON: 'Send Reset Instructions',
  UPDATE_PASSWORD_BUTTON: 'Update Password',
  CONTINUE_WITH_PROVIDER: (provider: string) => `Continue with ${provider}`,

  // Link Texts
  FORGOT_PASSWORD_LINK: 'Forgot your password?',
  SIGN_IN_WITH_MAGIC_LINK: 'Sign in with magic link',
  SIGN_UP_LINK_TEXT: 'Sign up',
  SIGN_IN_LINK_TEXT: 'Sign in',
  SIGN_IN_WITH_PASSWORD_INSTEAD: 'Sign in with password instead',
  BACK_TO_SIGN_IN_LINK: 'Back to Sign In',

  // Descriptions/Helper texts
  DONT_HAVE_ACCOUNT_PREFIX: "Don't have an account?",
  ALREADY_HAVE_ACCOUNT_PREFIX: 'Already have an account?',
  OR_CONTINUE_WITH: 'Or continue with',

  // Titles
  UPDATE_PASSWORD_TITLE: 'Update Password',

  // Messages & Errors
  SUCCESS_MAGIC_LINK_SENT: 'Check your email for the magic link.',
  SUCCESS_PASSWORD_RESET_SENT: 'Check your email for password reset instructions.',
  SUCCESS_PASSWORD_UPDATED: 'Password updated successfully.',
  SUCCESS_CONFIRMATION_LINK_SENT: 'Check your email for the confirmation link.',

  ERROR_PASSWORD_MISMATCH: 'Passwords do not match.',
  ERROR_UNEXPECTED: 'An unexpected error occurred.',
  ERROR_INVALID_EMAIL_GENERIC: 'Invalid email address. Please use a different email.',
} as const;
