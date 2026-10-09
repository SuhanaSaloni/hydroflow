import { Platform } from 'react-native';

export const SERVER_PORT = 4000;

// Default to the Android emulator loopback when running on Android emulators,
// physical devices should set EXPO_PUBLIC_API_URL to the machine's LAN IP.
const defaultHost =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const API_BASE = `${
  process.env.EXPO_PUBLIC_API_URL ?? defaultHost
}/api`;

export const FAMILY_ID = 'H-1014';
export const DRIVER_ID = 'T-107';