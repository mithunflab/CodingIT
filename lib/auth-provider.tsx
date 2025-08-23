'use client'

import { createContext, useContext, useState } from 'react'
import { useAuth } from './auth'
import { Session } from '@supabase/supabase-js'

type UserTeam = {
  email: string
  id: string
  name: string
  tier: string
}

type AuthContextType = {
  session: Session | null
  userTeam: UserTeam | undefined
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authView, setAuthView] = useState<any>('sign_in')
  const [authDialog, setAuthDialog] = useState(false)
  const { session, userTeam, loading } = useAuth(setAuthDialog, setAuthView)

  return (
    <AuthContext.Provider value={{ session, userTeam, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
