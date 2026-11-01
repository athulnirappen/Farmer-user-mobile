import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { type ReactElement, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { addToCart, useCartUpdate } from '@/api/cart';
import { publicApi } from '@/api/client';
import type { Paginated, Product } from '@/api/types';
import { useSession } from '@/auth/session';
import { ProductImage } from '@/components/product-image';
import { Text } from '@/components/text';
import { EmptyState, ErrorState, Loading, Pill, useCardStyle } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage, formatPrice } from '@/utils/format';

const PAGE_SIZE = 20;
const CARD_GAP = 14;
const ADDED_TICK_MS = 1500;

export type ProductFilter = {
  search?: string;
  categoryId?: string;
  farmId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

function QuickAdd({ product }: { product: Product }) {
  const colors = useTheme();
  const { signedIn } = useSession();
  const addition = useCartUpdate();
  const { reset, isSuccess } = addition;
  const inStock = product.stock > 0;

  useEffect(() => {
    if (!isSuccess) return;
    const tick = setTimeout(reset, ADDED_TICK_MS);
    return () => clearTimeout(tick);
  }, [isSuccess, reset]);

  const add = () => {
    if (!signedIn) {
      router.push('/sign-in');
      return;
    }
    addition.mutate(() => addToCart(product.id, 1), {
      onError: (error) => Alert.alert("Couldn't add this", errorMessage(error)),
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${product.name} to cart`}
      accessibilityState={{ disabled: !inStock, busy: addition.isPending }}
      disabled={!inStock || addition.isPending}
      hitSlop={4}
      onPress={add}
      style={[styles.add, { backgroundColor: inStock ? colors.primary : colors.backgroundElement }]}>
      {addition.isPending ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Ionicons
          name={!inStock ? 'cart-outline' : isSuccess ? 'checkmark' : 'add'}
          size={inStock ? 24 : 20}
          color={inStock ? colors.onPrimary : colors.textSecondary}
        />
      )}
    </Pressable>
  );
}

function ProductCard({ product, width }: { product: Product; width: number }) {
  const colors = useTheme();
  const cardStyle = useCardStyle();
  const soldOut = product.stock === 0;
  const location = product.farmer.farmLocation;

  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable style={StyleSheet.flatten([cardStyle, styles.card, { width }])}>
        <View style={soldOut && styles.faded}>
          <ProductImage product={product} style={styles.image} />
        </View>
        <View style={[styles.overlayTop, { backgroundColor: colors.surface }]}>
          <Text style={[styles.overlayLabel, { color: colors.text }]}>{product.category.name}</Text>
        </View>
        {soldOut && (
          <View style={styles.stockBadge}>
            <Pill label="Out of stock" tone="danger" />
          </View>
        )}
        {product.distanceKm !== undefined && (
          <View style={[styles.overlayBottom, { backgroundColor: colors.surface }]}>
            <Ionicons name="navigate-outline" size={13} color={colors.text} />
            <Text style={[styles.overlayLabel, { color: colors.text }]}>
              {product.distanceKm} km
            </Text>
          </View>
        )}
        <View style={styles.details}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
            {product.farmer.farmName}
          </Text>
          {location && (
            <View style={styles.location}>
              <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.place, { color: colors.textSecondary }]} numberOfLines={1}>
                {location}
              </Text>
            </View>
          )}
          <View style={[styles.buyRow, { borderColor: colors.border }]}>
            <View style={styles.priceColumn}>
              <Text style={[styles.price, { color: soldOut ? colors.textSecondary : colors.text }]}>
                {formatPrice(product.price)}
              </Text>
              <Text style={[styles.unit, { color: colors.textSecondary }]}>/ {product.unit}</Text>
            </View>
            <QuickAdd product={product} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

type Props = {
  filter: ProductFilter;
  header?: ReactElement;
  emptyMessage: string;
  // Room for anything floating over the end of the list
  footerSpace?: number;
};

export function ProductList({ filter, header, emptyMessage, footerSpace = 0 }: Props) {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = (width - Spacing.three * 2 - CARD_GAP) / 2;
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
      renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
      numColumns={2}
      columnWrapperStyle={styles.column}
      ListHeaderComponent={header}
      ListEmptyComponent={
        products.isPending ? (
          <Loading />
        ) : products.isError ? (
          <ErrorState error={products.error} onRetry={() => products.refetch()} />
        ) : (
          <EmptyState message={emptyMessage} icon="search-outline" />
        )
      }
      ListFooterComponent={
        products.isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={colors.primary} />
        ) : undefined
      }
      contentContainerStyle={[styles.list, { paddingBottom: Spacing.three + footerSpace }]}
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
  list: { flexGrow: 1, gap: CARD_GAP, paddingTop: Spacing.three },
  column: { gap: CARD_GAP, paddingHorizontal: Spacing.three },
  card: { overflow: 'hidden' },
  faded: { opacity: 0.55 },
  image: { width: '100%', height: 136 },
  overlayTop: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.round,
  },
  overlayBottom: {
    position: 'absolute',
    top: 104,
    right: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.small - 4,
  },
  overlayLabel: { fontSize: 12, fontFamily: Fonts.medium },
  stockBadge: { position: 'absolute', top: 40, left: Spacing.two },
  details: { padding: 14, gap: 2 },
  name: { fontSize: 18, fontFamily: Fonts.display },
  meta: { fontSize: 14 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  place: { flexShrink: 1, fontSize: 12 },
  buyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  priceColumn: { flexShrink: 1 },
  price: { fontSize: 19, lineHeight: 23, fontFamily: Fonts.display },
  unit: { fontSize: 13 },
  add: {
    width: 44,
    height: 44,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { padding: Spacing.three },
});
