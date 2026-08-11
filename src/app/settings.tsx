import React from 'react';
import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/components/screens';

export default function SettingsRoute() {
  const router = useRouter();
  return <SettingsScreen onBack={() => router.back()} />;
}
