import React from 'react';
import { useRouter } from 'expo-router';
import { useProgressStore } from '@/state';
import { OnboardingScreen } from '@/components/screens';

export default function OnboardingRoute() {
  const router = useRouter();
  const setOnboardingCompleted = useProgressStore((s) => s.setOnboardingCompleted);
  return (
    <OnboardingScreen
      onComplete={() => {
        setOnboardingCompleted(true);
        router.replace('/');
      }}
    />
  );
}
