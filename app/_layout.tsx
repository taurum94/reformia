import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { router, useSegments } from 'expo-router'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const segments = useSegments()

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    // Escucha cambios de sesión (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return // Todavía cargando

    const enAuth = segments[0] === '(auth)'

    if (!session && !enAuth) {
      router.replace('/(auth)/login')
    } else if (session && enAuth) {
      router.replace('/(tabs)')
    }
  }, [session, segments])

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </>
  )
}
