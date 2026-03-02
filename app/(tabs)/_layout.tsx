import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Esconde o cabeçalho padrão feio em cima
        tabBarStyle: {
          backgroundColor: '#1A1A1E',
          borderTopWidth: 1,
          borderTopColor: '#323238',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#8257E5', // Roxo quando selecionado
        tabBarInactiveTintColor: '#7C7C8A', // Cinza quando inativo
      }}
    >
      {/* ABA 1: O SEU DASHBOARD */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" size={size} color={color} />
          ),
        }}
      />
      
      {/* ABA 2: TELA DE AJUSTES/CONFIGURAÇÕES */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}