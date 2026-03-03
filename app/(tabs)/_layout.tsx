import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function TabLayout() {
  // Esse hook descobre o tamanho exato dos botões do sistema na parte de baixo do celular
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1E',
          borderTopWidth: 1,
          borderTopColor: '#323238',
          // A mágica: adicionamos um espaçamento extra baseado no tamanho da barra do celular
          paddingBottom: Platform.OS === 'android' ? insets.bottom + 10 : insets.bottom,
          paddingTop: 8,
          // A altura agora é dinâmica para acomodar o espaçamento dos botões
          height: Platform.OS === 'android' ? 65 + insets.bottom : 60 + insets.bottom,
          elevation: 0, // Remove a sombra padrão do Android para ficar mais "flat"
        },
        tabBarActiveTintColor: '#8257E5',
        tabBarInactiveTintColor: '#7C7C8A',
        tabBarLabelStyle: {
          fontWeight: 'bold',
          marginTop: 4,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" size={size} color={color} />
          ),
        }}
      />
      
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