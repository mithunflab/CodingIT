import React, { useCallback, useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  VIEWS,
  type ViewType,
  type AuthProps,
} from './auth/types'
import { useAuthForm } from '@/hooks/useAuthForm'
import { SocialAuth } from './auth/SocialAuth'
import { SignInForm } from './auth/SignInForm'
import { SignUpForm } from './auth/SignUpForm'
import { MagicLink } from './auth/MagicLinkForm'
import { ForgottenPasswordForm } from './auth/ForgottenPasswordForm'
import { UpdatePasswordForm } from './auth/UpdatePasswordForm'
import { AUTH_TEXT } from './auth/constants'


function Auth({
  supabaseClient,
  socialLayout = 'vertical',
  providers,
  view = VIEWS.SIGN_IN,
  redirectTo,
  onlyThirdPartyProviders = false,
  magicLink = false,
  onSignUpValidate,
  metadata,
}: AuthProps): JSX.Element | null {
  const [authView, setAuthView] = useState<ViewType>(view)
  const {
    loading,
    error,
    message,
    setLoading,
    setError,
    setMessage,
    clearMessages,
  } = useAuthForm()

  useEffect(() => {
    setAuthView(view)
    setError(null)
    setMessage(null)
  }, [view, setError, setMessage])

  const setAuthViewAndClearMessages = useCallback(
    (newView: ViewType) => {
      setAuthView(newView)
      setError(null)
      setMessage(null)
    },
    [setError, setMessage],
  )

  const commonProps = {
    supabaseClient,
    setAuthView: setAuthViewAndClearMessages,
    setLoading,
    setError,
    setMessage,
    clearMessages,
    loading,
    redirectTo,
  }

  let viewComponent: React.ReactNode = null

  switch (authView) {
    case VIEWS.SIGN_IN:
      viewComponent = <SignInForm {...commonProps} />
      break
    case VIEWS.SIGN_UP:
      viewComponent = (
        <SignUpForm
          {...commonProps}
          onSignUpValidate={onSignUpValidate}
          metadata={metadata}
        />
      )
      break
    case VIEWS.FORGOTTEN_PASSWORD:
      viewComponent = <ForgottenPasswordForm {...commonProps} />
      break
    case VIEWS.MAGIC_LINK:
      viewComponent = <MagicLink {...commonProps} />
      break
    case VIEWS.UPDATE_PASSWORD:
      viewComponent = <UpdatePasswordForm {...commonProps} />
      break
    default:
      viewComponent = null
  }

  const showSocialAuth = providers && providers.length > 0
  const showSeparator = showSocialAuth && !onlyThirdPartyProviders

  return (
    <div className="w-full space-y-4">
      {authView === VIEWS.UPDATE_PASSWORD ? (
        viewComponent
      ) : (
        <>
          {showSocialAuth && (
            <SocialAuth
              supabaseClient={supabaseClient}
              providers={providers || []}
              layout={socialLayout}
              redirectTo={redirectTo}
              setLoading={setLoading}
              setError={setError}
              clearMessages={clearMessages}
              loading={loading}
            />
          )}
          {showSeparator && (
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {AUTH_TEXT.OR_CONTINUE_WITH}
                </span>
              </div>
            </div>
          )}
          {!onlyThirdPartyProviders && viewComponent}
        </>
      )}

      {!onlyThirdPartyProviders && authView !== VIEWS.UPDATE_PASSWORD && (
        <div className="text-center text-sm space-y-1 mt-4">
          {authView === VIEWS.SIGN_IN && (
            <>
              {magicLink && (
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setAuthViewAndClearMessages(VIEWS.MAGIC_LINK)}
                  className="p-0 h-auto font-normal"
                >
                  {AUTH_TEXT.SIGN_IN_WITH_MAGIC_LINK}
                </Button>
              )}
              <p className="text-muted-foreground">
                {AUTH_TEXT.DONT_HAVE_ACCOUNT_PREFIX}{' '}
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setAuthViewAndClearMessages(VIEWS.SIGN_UP)}
                  className="p-0 h-auto underline"
                >
                  {AUTH_TEXT.SIGN_UP_LINK_TEXT}
                </Button>
              </p>
            </>
          )}
          {authView === VIEWS.SIGN_UP && (
            <p className="text-muted-foreground">
              {AUTH_TEXT.ALREADY_HAVE_ACCOUNT_PREFIX}{' '}
              <Button
                variant="link"
                type="button"
                onClick={() => setAuthViewAndClearMessages(VIEWS.SIGN_IN)}
                className="p-0 h-auto underline"
              >
                {AUTH_TEXT.SIGN_IN_LINK_TEXT}
              </Button>
            </p>
          )}
          {authView === VIEWS.MAGIC_LINK && (
            <Button
              variant="link"
              type="button"
              onClick={() => setAuthViewAndClearMessages(VIEWS.SIGN_IN)}
              className="p-0 h-auto font-normal"
            >
              {AUTH_TEXT.SIGN_IN_WITH_PASSWORD_INSTEAD}
            </Button>
          )}
          {authView === VIEWS.FORGOTTEN_PASSWORD && (
            <Button
              variant="link"
              type="button"
              onClick={() => setAuthViewAndClearMessages(VIEWS.SIGN_IN)}
              className="p-0 h-auto underline"
            >
              {AUTH_TEXT.BACK_TO_SIGN_IN_LINK}
            </Button>
          )}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert variant="default">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

export default Auth
