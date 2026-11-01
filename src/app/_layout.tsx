import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { ApiError } from '@/api/client';
import { SessionProvider } from '@/auth/session';

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
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StatusBar style="auto" />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ title: '' }} />
            <Stack.Screen name="farm/[id]" options={{ title: '' }} />
            <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
            <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
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
