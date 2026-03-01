import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SystemUI.setBackgroundColorAsync('#121212');

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const CustomTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: '#121212',
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#121212' }}>
        <ThemeProvider value={CustomTheme}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: '#121212' },
              animation: 'slide_from_right',
              headerStyle: { backgroundColor: '#121212' },
              headerTintColor: '#8257E5',
              headerTitleStyle: { color: '#FFF' },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="game/new" options={{ title: 'Novo Jogo' }} />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </View>
    </GestureHandlerRootView>
  );
}