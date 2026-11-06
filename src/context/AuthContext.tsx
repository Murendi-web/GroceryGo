import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserProfile } from '../types'
import { isSupabaseConfigured, supabase } from '../services/supabase'
import { KEYS, loadJson, removeKey, saveJson } from '../services/storage'
import { titleCase } from '../utils/format'

export interface SignUpInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

export interface AuthResult {
  ok: boolean
  message?: string
}

interface AuthValue {
  user: UserProfile | null
  ready: boolean
  /** True when no Supabase keys are set. Accounts are then stored on the device only. */
  demoMode: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (input: SignUpInput) => Promise<AuthResult>
  continueAsGuest: () => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

function fromSession(session: Session | null): UserProfile | null {
  if (!session) return null
  const u = session.user
  const meta = (u.user_metadata ?? {}) as { full_name?: string; phone?: string }
  const email = u.email ?? ''
  const isGuest = Boolean(u.is_anonymous)
  return {
    id: u.id,
    name: isGuest ? 'Guest' : meta.full_name || titleCase(email.split('@')[0] ?? '') || 'Shopper',
    email,
    phone: meta.phone ?? '',
    isGuest,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return
        setUser(fromSession(data.session))
        setReady(true)
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(fromSession(session))
      })
      return () => {
        active = false
        sub.subscription.unsubscribe()
      }
    }
    loadJson<UserProfile | null>(KEYS.demoUser, null).then((stored) => {
      if (!active) return
      setUser(stored)
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [])

  const setDemoUser = useCallback(async (next: UserProfile) => {
    await saveJson(KEYS.demoUser, next)
    setUser(next)
  }, [])

  const signIn = useCallback<AuthValue['signIn']>(
    async (email, password) => {
      if (supabase) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        return error ? { ok: false, message: error.message } : { ok: true }
      }
      await setDemoUser({
        id: `demo:${email.trim().toLowerCase()}`,
        name: titleCase(email.split('@')[0] ?? ''),
        email: email.trim(),
        phone: '',
        isGuest: false,
      })
      return { ok: true }
    },
    [setDemoUser],
  )

  const signUp = useCallback<AuthValue['signUp']>(
    async (input) => {
      const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: input.email.trim(),
          password: input.password,
          options: { data: { full_name: fullName, phone: input.phone.trim() } },
        })
        if (error) return { ok: false, message: error.message }
        if (!data.session) {
          return { ok: false, message: 'Account created. Open the confirmation email, then sign in.' }
        }
        return { ok: true }
      }
      await setDemoUser({
        id: `demo:${input.email.trim().toLowerCase()}`,
        name: fullName,
        email: input.email.trim(),
        phone: input.phone.trim(),
        isGuest: false,
      })
      return { ok: true }
    },
    [setDemoUser],
  )

  const continueAsGuest = useCallback<AuthValue['continueAsGuest']>(async () => {
    if (supabase) {
      const { error } = await supabase.auth.signInAnonymously()
      return error ? { ok: false, message: error.message } : { ok: true }
    }
    await setDemoUser({ id: 'demo:guest', name: 'Guest', email: '', phone: '', isGuest: true })
    return { ok: true }
  }, [setDemoUser])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    else {
      await removeKey(KEYS.demoUser)
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ user, ready, demoMode: !isSupabaseConfigured, signIn, signUp, continueAsGuest, signOut }),
    [user, ready, signIn, signUp, continueAsGuest, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
