import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { useMyProducts } from '@/api/farmer';
import type { OwnedProduct } from '@/api/types';
import { useSession } from '@/auth/session';
import { ProductImage } from '@/components/product-image';
import { Text } from '@/components/text';
import {
  Button,
  EmptyState,
  ErrorState,
  Eyebrow,
  Loading,
  Pill,
  type Tone,
  useCardStyle,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/utils/format';

type Listing = { label: string; tone: Tone; action: string };

const listingState = ({ hiddenAt, isActive, stock }: OwnedProduct): Listing => {
  if (hiddenAt) return { label: 'Hidden by admin', tone: 'danger', action: 'Edit' };
  if (!isActive) return { label: 'Paused', tone: 'warning', action: 'Resume listing' };
  if (stock === 0) return { label: 'Out of stock', tone: 'danger', action: 'Update stock' };
  return { label: 'Active', tone: 'success', action: 'Edit' };
};

function ProductRow({ product }: { product: OwnedProduct }) {
  const colors = useTheme();
  const cardStyle = useCardStyle();
  const { label, tone, action } = listingState(product);
  const empty = product.stock === 0;

  return (
    <Link href={{ pathname: '/farm-product-form', params: { id: product.id } }} asChild>
      <Pressable style={StyleSheet.flatten([cardStyle, styles.row])}>
        <View style={styles.top}>
          <ProductImage product={product} style={styles.image} />
          <View style={styles.details}>
            <View style={styles.tags}>
              <Pill label={product.category.name} />
              <Pill label={label} tone={tone} />
            </View>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={[styles.price, { color: colors.text }]}>
              {formatPrice(product.price)}
              <Text style={[styles.unit, { color: colors.textSecondary }]}> / {product.unit}</Text>
            </Text>
          </View>
        </View>

        {!!product.hiddenAt && (
          <Text style={{ color: colors.danger }}>
            Reason: {product.hiddenReason ?? 'no reason given'}
          </Text>
        )}

        <View
          style={[
            styles.strip,
            { backgroundColor: empty ? colors.dangerSoft : colors.primarySoft },
          ]}>
          <View style={[styles.dot, { backgroundColor: empty ? colors.danger : colors.primary }]} />
          <Text
            style={[styles.stock, { color: empty ? colors.danger : colors.text }]}
            numberOfLines={1}>
            {product.stock} {product.unit} {empty ? '(sold out)' : 'available'}
          </Text>
          <Text style={[styles.action, { color: colors.text }]}>{action}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.text} />
        </View>
      </Pressable>
    </Link>
  );
}

export default function FarmProductsScreen() {
  const colors = useTheme();
  const { profile } = useSession();
  const products = useMyProducts();
  useRefreshOnFocus(products.refetch);

  if (products.isPending) return <Loading />;
  if (products.isError) {
    return <ErrorState error={products.error} onRetry={() => products.refetch()} />;
  }

  const items = products.data.pages.flatMap((page) => page.items);
  const total = products.data.pages[0]?.total ?? items.length;
  const live = items.filter(({ hiddenAt, isActive, stock }) => !hiddenAt && isActive && stock > 0);

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(product) => product.id}
        renderItem={({ item }) => <ProductRow product={item} />}
        ListHeaderComponent={
          total > 0 ? (
            <View style={styles.header}>
              <View>
                {profile.data?.farmer && <Eyebrow label={profile.data.farmer.farmName} />}
                <Text style={[styles.heading, { color: colors.text }]}>Farm catalog</Text>
              </View>
              <View style={[styles.summary, { backgroundColor: colors.primarySoft }]}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.surface }]}>
                  <Ionicons name="file-tray-full-outline" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>
                    {total} {total === 1 ? 'item' : 'items'} listed
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>
                    {live.length} showing to buyers
                  </Text>
                </View>
              </View>
            </View>
          ) : undefined
        }
        ListEmptyComponent={<EmptyState message="You haven't listed anything yet." icon="basket-outline" />}
        contentContainerStyle={styles.list}
        refreshing={products.isRefetching && !products.isFetchingNextPage}
        onRefresh={() => products.refetch()}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (products.hasNextPage && !products.isFetching) products.fetchNextPage();
        }}
      />
      <View style={styles.footer}>
        <Button label="Add a product" icon="add" onPress={() => router.push('/farm-product-form')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flexGrow: 1, padding: Spacing.three, gap: 14 },
  header: { gap: 12 },
  heading: { fontSize: 28, lineHeight: 34, fontFamily: Fonts.display },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.medium,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: { fontSize: 16, fontFamily: Fonts.semibold },
  row: { padding: 14, gap: 12 },
  top: { flexDirection: 'row', gap: 14 },
  image: { width: 92, height: 92, borderRadius: Radius.small },
  details: { flex: 1, gap: Spacing.one },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  name: { fontSize: 20, lineHeight: 25, fontFamily: Fonts.display },
  price: { fontSize: 20, fontFamily: Fonts.display },
  unit: { fontSize: 14, fontFamily: Fonts.body },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.small,
  },
  dot: { width: 9, height: 9, borderRadius: Radius.round },
  stock: { flex: 1, fontSize: 15 },
  action: { fontSize: 15, fontFamily: Fonts.semibold },
  footer: { padding: Spacing.three },
});
