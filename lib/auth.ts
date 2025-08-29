import { createSupabaseBrowserClient } from './supabase-browser'
import { ViewType } from '@/components/auth'
import { randomString } from './utils'
import { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { usePostHog } from 'posthog-js/react'
import { useState, useEffect } from 'react'

const supabase = createSupabaseBrowserClient();

type UserTeam = {
  email: string
  id: string
  name: string
  tier: string
}

export async function getUserTeam(
  session: Session,
): Promise<UserTeam | undefined> {
  const { data: defaultTeam } = await supabase!
    .from('users_teams')
    .select('teams (id, name, tier, email)')
    .eq('user_id', session?.user.id)
    .eq('is_default', true)
    .single()

  return defaultTeam?.teams as unknown as UserTeam
}

export function useAuth(
  setAuthDialog: (value: boolean) => void,
  setAuthView: (value: ViewType) => void,
) {
  const [session, setSession] = useState<Session | null>(null)
  const [userTeam, setUserTeam] = useState<UserTeam | undefined>(undefined)
  const [recovery, setRecovery] = useState(false)
  const [loading, setLoading] = useState(true)
  const posthog = usePostHog()

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase is not initialized')
      return setSession({ user: { email: 'demo@codinit.dev' } } as Session)
    }

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session)
      if (session) {
        getUserTeam(session).then(setUserTeam)
        if (!session.user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture('sign_in')
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session)

      if (_event === 'PASSWORD_RECOVERY') {
        setRecovery(true)
        setAuthView('update_password')
        setAuthDialog(true)
      }

      if (_event === 'USER_UPDATED' && recovery) {
        setRecovery(false)
      }

      if (_event === 'SIGNED_IN' && !recovery) {
        getUserTeam(session as Session).then(setUserTeam)
        setAuthDialog(false)
        if (!session?.user.user_metadata.is_fragments_user) {
          supabase?.auth.updateUser({
            data: { is_fragments_user: true },
          })
        }
        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture('sign_in')
      }

      if (_event === 'SIGNED_OUT') {
        setAuthView('sign_in')
        posthog.capture('sign_out')
        posthog.reset()
        setRecovery(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [recovery, posthog, setAuthDialog, setAuthView])

  return {
    session,
    userTeam,
    loading,
  }
}
