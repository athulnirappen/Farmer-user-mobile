import { Link, router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useMyProducts } from '@/api/farmer';
import type { OwnedProduct } from '@/api/types';
import { ProductImage } from '@/components/product-image';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/utils/format';

const listingStatus = ({ hiddenAt, hiddenReason, isActive, stock }: OwnedProduct) => {
  if (hiddenAt) return `Hidden by admin: ${hiddenReason ?? 'no reason given'}`;
  if (!isActive) return 'Paused';
  if (stock === 0) return 'Out of stock';
  return null;
};

function ProductRow({ product }: { product: OwnedProduct }) {
  const colors = useTheme();
  const status = listingStatus(product);

  return (
    <Link
      href={{ pathname: '/farm-product-form', params: { id: product.id } }}
      asChild>
      <Pressable style={StyleSheet.flatten([styles.row, { borderColor: colors.border }])}>
        <ProductImage product={product} style={styles.image} />
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            {formatPrice(product.price)} / {product.unit} · {product.stock} left
          </Text>
          {status && <Text style={{ color: colors.danger }}>{status}</Text>}
        </View>
      </Pressable>
    </Link>
  );
}

export default function FarmProductsScreen() {
  const products = useMyProducts();
  useRefreshOnFocus(products.refetch);

  if (products.isPending) return <Loading />;
  if (products.isError) {
    return <ErrorState error={products.error} onRetry={() => products.refetch()} />;
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={products.data.pages.flatMap((page) => page.items)}
        keyExtractor={(product) => product.id}
        renderItem={({ item }) => <ProductRow product={item} />}
        ListEmptyComponent={<EmptyState message="You haven't listed anything yet." />}
        contentContainerStyle={styles.list}
        refreshing={products.isRefetching && !products.isFetchingNextPage}
        onRefresh={() => products.refetch()}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (products.hasNextPage && !products.isFetching) products.fetchNextPage();
        }}
      />
      <View style={styles.footer}>
        <Button label="Add a product" onPress={() => router.push('/farm-product-form')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  image: { width: 64, height: 64, borderRadius: 10 },
  details: { flex: 1, gap: 2, justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '600' },
  footer: { padding: Spacing.three },
});
