import { Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import '../../global.css';

function CloseButton() {
  return (
    <Pressable onPress={() => router.back()} className="mr-2 rounded-full bg-slate-100 p-1.5">
      <X size={16} color="#0f172a" />
    </Pressable>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShadowVisible: false, headerTitleStyle: { fontWeight: '700' } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="book"
          options={{
            title: 'Book a Tanker',
            presentation: 'card',
            headerStyle: { backgroundColor: '#f8fafc' },
            headerTintColor: '#0f172a',
          }}
        />
        <Stack.Screen
          name="passport"
          options={{
            title: 'Water Passport',
            presentation: 'modal',
            headerLeft: () => <CloseButton />,
            headerStyle: { backgroundColor: '#f8fafc' },
            headerTintColor: '#0f172a',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}