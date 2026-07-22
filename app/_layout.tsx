import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { router, useSegments } from 'expo-router'
import { LogBox } from 'react-native'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

LogBox.ignoreLogs(['Failed to fetch'])

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const segments = useSegments()

  useEffect(() => {
    // Sesión inicial — si el refresh falla (token caducado), tratar como sin sesión
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setSession(null)
      else setSession(data.session)
    })

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
