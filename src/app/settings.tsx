import React from 'react';
import { useRouter } from 'expo-router';
import { SettingsScreen } from '@/components/screens';
import { safeBack } from '@/utils/safeBack';

export default function SettingsRoute() {
  const router = useRouter();
  return <SettingsScreen onBack={() => safeBack(router, '/')} />;
}
