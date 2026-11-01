import { Ionicons } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCart } from '@/api/cart';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabIconName = 'leaf' | 'basket' | 'receipt' | 'person';

const tabIcon = (name: TabIconName) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    const colors = useTheme();
    const icon: ComponentProps<typeof Ionicons>['name'] = focused ? name : `${name}-outline`;

    return (
      <View style={[styles.icon, focused && { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} color={color as string} size={21} />
      </View>
    );
  };

function AccountButton() {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Account"
      hitSlop={6}
      onPress={() => router.navigate('/account')}
      style={[styles.avatar, { backgroundColor: colors.heroEnd }]}>
      <Ionicons name="person-outline" size={19} color={colors.onHero} />
    </Pressable>
  );
}

function BrandMark() {
  const colors = useTheme();

  return (
    <View style={[styles.brand, { backgroundColor: colors.heroEnd }]}>
      <Ionicons name="leaf" size={20} color={colors.accentBright} />
    </View>
  );
}

export default function TabsLayout() {
  const colors = useTheme();
  const cart = useCart();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: Fonts.medium, fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.onPrimary, fontFamily: Fonts.bold, fontSize: 10 },
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontFamily: Fonts.display, fontSize: 26 },
        headerRight: () => <AccountButton />,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Browse', headerLeft: () => <BrandMark />, tabBarIcon: tabIcon('leaf') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: tabIcon('basket'),
          tabBarBadge: cart.data?.itemCount || undefined,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: tabIcon('receipt') }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', headerRight: undefined, tabBarIcon: tabIcon('person') }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    marginRight: 16,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    width: 40,
    height: 40,
    marginLeft: 16,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 54,
    height: 30,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
