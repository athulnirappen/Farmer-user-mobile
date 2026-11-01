import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Fraunces_500Medium_Italic, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { ApiError } from '@/api/client';
import { SessionProvider } from '@/auth/session';
import { Colors, Fonts } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retrying only helps network and server trouble; a 4xx will answer the same again
      retry: (failures, error) =>
        failures < 2 && !(error instanceof ApiError && error.status < 500),
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
  });
  const fontsSettled = fontsLoaded || !!fontError;
  useEffect(() => {
    if (fontsSettled) SplashScreen.hide();
  }, [fontsSettled]);

  const dark = useColorScheme() === 'dark';
  const colors = Colors[dark ? 'dark' : 'light'];
  const base = dark ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (!fontsSettled) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={theme}>
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerTitleStyle: { fontFamily: Fonts.display, fontSize: 20 },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ title: 'Product details' }} />
            <Stack.Screen name="farm/[id]" options={{ title: 'Farm' }} />
            <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
            <Stack.Screen name="order/[id]" options={{ title: 'Order detail' }} />
            <Stack.Screen name="addresses" options={{ title: 'Saved addresses' }} />
            <Stack.Screen name="address-form" options={{ title: 'Address' }} />
            <Stack.Screen name="farmer-application" options={{ title: 'Become a farmer' }} />
            <Stack.Screen name="farm-details" options={{ title: 'Farm details' }} />
            <Stack.Screen name="farm-products" options={{ title: 'My products' }} />
            <Stack.Screen name="farm-product-form" options={{ title: 'Product' }} />
            <Stack.Screen name="farm-orders" options={{ title: 'Farm orders' }} />
            <Stack.Screen
              name="sign-in"
              options={{ title: 'Sign in', presentation: 'modal' }}
            />
          </Stack>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
