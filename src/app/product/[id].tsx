import { useQuery } from '@tanstack/react-query';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { addToCart, useCartUpdate } from '@/api/cart';
import { publicApi } from '@/api/client';
import type { Product } from '@/api/types';
import { useSession } from '@/auth/session';
import { ProductImage } from '@/components/product-image';
import { Button, ErrorState, Loading, Stepper } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage, formatPrice } from '@/utils/format';

const MAX_QUANTITY = 1000;

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const { signedIn } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addition = useCartUpdate();
  const product = useQuery({
    queryKey: ['product', id],
    queryFn: () => publicApi<Product>(`/products/${id}`),
  });

  const addItem = () => {
    if (!signedIn) {
      router.push('/sign-in');
      return;
    }
    setAdded(false);
    addition.mutate(() => addToCart(id, quantity), { onSuccess: () => setAdded(true) });
  };

  if (product.isPending) return <Loading />;
  if (product.isError)
    return <ErrorState error={product.error} onRetry={() => product.refetch()} />;

  const { data } = product;

  return (
    <View style={styles.screen}>
      <ScrollView>
        <Stack.Screen options={{ title: data.name }} />
        <ProductImage product={data} style={{ width, height: width * 0.7 }} />
        <Text style={[styles.name, { color: colors.text }]}>{data.name}</Text>
        <Text style={[styles.price, { color: colors.text }]}>
          {formatPrice(data.price)} / {data.unit}
        </Text>
        <Text
          style={[styles.body, { color: data.stock > 0 ? colors.textSecondary : colors.danger }]}>
          {data.stock > 0 ? `${data.stock} ${data.unit} available` : 'Out of stock'}
        </Text>
        {!!data.description && (
          <Text style={[styles.body, { color: colors.text }]}>{data.description}</Text>
        )}
        <Link href={`/farm/${data.farmer.id}`} style={[styles.farm, { color: colors.primary }]}>
          {data.farmer.farmName}
          {data.farmer.farmLocation ? `, ${data.farmer.farmLocation}` : ''}
        </Link>
      </ScrollView>
      {data.stock > 0 && (
        <View style={[styles.buy, { borderColor: colors.border }]}>
          {addition.isError && (
            <Text style={{ color: colors.danger }}>{errorMessage(addition.error)}</Text>
          )}
          {added && <Text style={{ color: colors.primary }}>Added to your cart</Text>}
          <View style={styles.buyRow}>
            <Stepper
              value={quantity}
              max={Math.min(data.stock, MAX_QUANTITY)}
              onChange={(next) => {
                setAdded(false);
                setQuantity(next);
              }}
            />
            <View style={styles.buyButton}>
              <Button
                label={signedIn ? 'Add to cart' : 'Sign in to buy'}
                busy={addition.isPending}
                onPress={addItem}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  buy: { padding: Spacing.three, gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  buyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  buyButton: { flex: 1 },
  name: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  price: { fontSize: 20, paddingHorizontal: Spacing.three, paddingTop: Spacing.one },
  body: { fontSize: 16, paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  farm: { fontSize: 16, fontWeight: '600', padding: Spacing.three },
});
