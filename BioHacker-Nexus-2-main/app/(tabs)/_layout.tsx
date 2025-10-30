
import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/dashboard',
      icon: 'house.fill',
      label: 'Home',
    },
    {
      name: 'medications',
      route: '/(tabs)/medications',
      icon: 'pills.fill',
      label: 'Meds',
    },
    {
      name: 'inventory',
      route: '/(tabs)/inventory',
      icon: 'cube.box.fill',
      label: 'Stock',
    },
    {
      name: 'settings',
      route: '/(tabs)/settings',
      icon: 'gearshape.fill',
      label: 'Settings',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="medications" />
        <Stack.Screen name="add-product" />
        <Stack.Screen name="edit-product" />
        <Stack.Screen name="product-details" />
        <Stack.Screen name="inventory" />
        <Stack.Screen name="edit-inventory" />
        <Stack.Screen name="settings" />
      </Stack>
      <FloatingTabBar tabs={tabs} containerWidth={340} />
    </>
  );
}
