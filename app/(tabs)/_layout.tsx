import { Tabs } from 'expo-router'
import { Colors } from '../../constants/colors'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
        },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarLabel: 'Inicio' }}
      />
      <Tabs.Screen
        name="agente"
        options={{ title: 'Agente IA', tabBarLabel: 'Agente' }}
      />
      <Tabs.Screen
        name="presupuestos"
        options={{ title: 'Presupuestos', tabBarLabel: 'Presupuestos' }}
      />
      <Tabs.Screen
        name="facturas"
        options={{ title: 'Facturas', tabBarLabel: 'Facturas' }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{ title: 'Ajustes', tabBarLabel: 'Ajustes' }}
      />
    </Tabs>
  )
}
