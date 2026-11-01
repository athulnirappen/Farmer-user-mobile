import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import type { ReactElement } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { publicApi } from '@/api/client';
import type { Paginated, Product } from '@/api/types';
import { EmptyState, ErrorState, Loading } from '@/components/ui';
import { ProductImage } from '@/components/product-image';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/utils/format';

const PAGE_SIZE = 20;

export type ProductFilter = {
  search?: string;
  categoryId?: string;
  farmId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

function ProductRow({ product }: { product: Product }) {
  const colors = useTheme();
  const distance = product.distanceKm === undefined ? '' : ` · ${product.distanceKm} km`;

  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable style={StyleSheet.flatten([styles.row, { borderColor: colors.border }])}>
        <ProductImage product={product} style={styles.image} />
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {product.farmer.farmName}
            {distance}
          </Text>
          <Text style={[styles.price, { color: colors.text }]}>
            {formatPrice(product.price)} / {product.unit}
          </Text>
          {product.stock === 0 && (
            <Text style={[styles.meta, { color: colors.danger }]}>Out of stock</Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

type Props = {
  filter: ProductFilter;
  header?: ReactElement;
  emptyMessage: string;
};

export function ProductList({ filter, header, emptyMessage }: Props) {
  const colors = useTheme();
  const products = useInfiniteQuery({
    queryKey: ['products', filter],
    queryFn: ({ pageParam }) =>
      publicApi<Paginated<Product>>('/products', {
        query: { ...filter, page: pageParam, limit: PAGE_SIZE },
      }),
    initialPageParam: 1,
    getNextPageParam: ({ page, limit, total }) => (page * limit < total ? page + 1 : undefined),
  });

  return (
    <FlatList
      data={products.data?.pages.flatMap((page) => page.items) ?? []}
      keyExtractor={(product) => product.id}
      renderItem={({ item }) => <ProductRow product={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={
        products.isPending ? (
          <Loading />
        ) : products.isError ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        ) : (
          <EmptyState message={emptyMessage} />
        )
      }
      ListFooterComponent={
        products.isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={colors.primary} />
        ) : undefined
      }
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      refreshing={products.isRefetching && !products.isFetchingNextPage}
      onRefresh={() => products.refetch()}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (products.hasNextPage && !products.isFetching) products.fetchNextPage();
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, paddingBottom: Spacing.four },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  image: { width: 84, height: 84, borderRadius: 10 },
  details: { flex: 1, gap: 2, justifyContent: 'center' },
  name: { fontSize: 17, fontWeight: '600' },
  meta: { fontSize: 14 },
  price: { fontSize: 16, fontWeight: '500', marginTop: Spacing.one },
  footer: { padding: Spacing.three },
});
