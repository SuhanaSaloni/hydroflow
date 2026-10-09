import { Tabs } from 'expo-router';
import { House, Users, Truck } from 'lucide-react-native';
import { colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.hydro[600],
        tabBarInactiveTintColor: colors.slate[400],
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: colors.slate[200] },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pool"
        options={{
          title: 'Pools',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="driver"
        options={{
          title: 'Fleet',
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}