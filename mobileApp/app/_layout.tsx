import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade', // 🔥 transition fondu
        animationDuration: 300,
      }}
    />
  );
}