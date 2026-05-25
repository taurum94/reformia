import { Stack } from 'expo-router'
import { Colors } from '../../constants/colors'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Iniciar sesión', headerShown: false }} />
      <Stack.Screen name="registro" options={{ title: 'Crear cuenta', headerShown: false }} />
    </Stack>
  )
}
