import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useCategories } from '@/api/categories';
import { publicApi } from '@/api/client';
import type { Farm } from '@/api/types';
import { useSession } from '@/auth/session';
import { BASKET_BAR_SPACE, BasketBar } from '@/components/basket-bar';
import { ProductList } from '@/components/product-list';
import { Text } from '@/components/text';
import { Banner, Chip, ErrorState, Loading, Pill } from '@/components/ui';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function FarmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const { signedIn } = useSession();
  const [categoryId, setCategoryId] = useState<string>();
  const categories = useCategories();
  const farm = useQuery({
    queryKey: ['farm', id],
    queryFn: () => publicApi<Farm>(`/farmers/${id}`),
  });

  if (farm.isPending) return <Loading />;
  if (farm.isError) return <ErrorState error={farm.error} onRetry={() => farm.refetch()} />;

  const { farmName, farmLocation, productCount } = farm.data;

  return (
    <View style={styles.screen}>
      <ProductList
        filter={{ farmId: id, categoryId }}
        emptyMessage="This farm has no products listed right now."
        footerSpace={signedIn ? BASKET_BAR_SPACE : 0}
        header={
          <View style={styles.header}>
            <View style={styles.intro}>
              <Pill label="Approved farmer" tone="success" icon="checkmark-circle-outline" />
              <Text style={[styles.name, { color: colors.text }]}>{farmName}</Text>
              {farmLocation && (
                <View style={styles.place}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.location, { color: colors.textSecondary }]}>
                    {farmLocation}
                  </Text>
                </View>
              )}
            </View>

            {farmLocation && (
              <View style={styles.pickup}>
                <Banner
                  icon="storefront-outline"
                  tone="success"
                  title="Farm pickup available"
                  detail="Choose pickup at checkout, and pay the farmer in cash."
                />
              </View>
            )}

            <View style={styles.listHead}>
              <Text style={[styles.listTitle, { color: colors.text }]}>Products</Text>
              <Text style={{ color: colors.textSecondary }}>
                {productCount} {productCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}>
              <Chip
                label="All"
                selected={categoryId === undefined}
                onPress={() => setCategoryId(undefined)}
              />
              {categories.data?.items.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  selected={category.id === categoryId}
                  onPress={() => setCategoryId(category.id)}
                />
              ))}
            </ScrollView>
          </View>
        }
      />
      <BasketBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { gap: Spacing.three, marginBottom: Spacing.one },
  intro: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  name: { fontSize: 30, lineHeight: 36, fontFamily: Fonts.display },
  place: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  location: { flexShrink: 1, fontSize: 15 },
  pickup: { paddingHorizontal: Spacing.three },
  listHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  listTitle: { fontSize: 22, fontFamily: Fonts.display },
  chips: { paddingHorizontal: Spacing.three, gap: Spacing.two },
});
