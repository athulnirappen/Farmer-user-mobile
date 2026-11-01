import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addToCart, useCartUpdate } from '@/api/cart';
import { publicApi } from '@/api/client';
import type { Product } from '@/api/types';
import { useSession } from '@/auth/session';
import { ProductImage } from '@/components/product-image';
import { Text } from '@/components/text';
import {
  Button,
  ErrorState,
  IconBadge,
  InfoRow,
  Loading,
  Pill,
  Stepper,
  useCardStyle,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage, formatPrice } from '@/utils/format';

const MAX_QUANTITY = 1000;

function Gallery({ product }: { product: Product }) {
  const colors = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const height = width * 0.78;
  const slides = product.images.length > 0 ? product.images.map((image) => [image]) : [[]];

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={({ nativeEvent }) =>
          setIndex(Math.round(nativeEvent.contentOffset.x / width))
        }>
        {slides.map((images, slide) => (
          <ProductImage key={slide} product={{ ...product, images }} style={{ width, height }} />
        ))}
      </ScrollView>
      <View style={[styles.imageTag, styles.tagTop, { backgroundColor: colors.surface }]}>
        <Text style={[styles.tagLabel, { color: colors.text }]}>{product.category.name}</Text>
      </View>
      <View style={[styles.imageTag, styles.tagBottom, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.stockDot,
            { backgroundColor: product.stock > 0 ? colors.accent : colors.danger },
          ]}
        />
        <Text style={[styles.tagLabel, { color: colors.text }]}>
          {product.stock > 0 ? `${product.stock} ${product.unit} available` : 'Out of stock'}
        </Text>
      </View>
      {slides.length > 1 && (
        <View style={[styles.imageTag, styles.tagCount]}>
          <Text style={[styles.tagLabel, { color: colors.onHero }]}>
            {index + 1} / {slides.length}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const cardStyle = useCardStyle();
  const insets = useSafeAreaInsets();
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
  const total = formatPrice(String(Number(data.price) * quantity));

  return (
    <View style={styles.screen}>
      <ScrollView>
        <Gallery product={data} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.text }]}>{data.name}</Text>
            <Text style={[styles.price, { color: colors.accent }]}>
              {formatPrice(data.price)}
              <Text style={[styles.unit, { color: colors.textSecondary }]}> / {data.unit}</Text>
            </Text>
          </View>

          <Link href={`/farm/${data.farmer.id}`} asChild>
            <Pressable style={StyleSheet.flatten([cardStyle, styles.farm])}>
              <IconBadge icon="leaf" size={52} />
              <View style={styles.farmText}>
                <Text style={[styles.farmName, { color: colors.text }]}>
                  {data.farmer.farmName}
                </Text>
                {data.farmer.farmLocation && (
                  <View style={styles.farmPlace}>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
                      {data.farmer.farmLocation}
                    </Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          </Link>

          <View style={[styles.promises, { backgroundColor: colors.primarySoft }]}>
            <InfoRow
              icon="calendar-outline"
              title="Order today for delivery tomorrow"
              detail="Choose a time slot at checkout"
            />
            <InfoRow
              icon="cash-outline"
              title="Cash on delivery"
              detail="Pay the farmer directly"
            />
          </View>

          {!!data.description && (
            <View style={styles.about}>
              <Text style={[styles.aboutTitle, { color: colors.text }]}>About this product</Text>
              <Text style={[styles.description, { color: colors.text }]}>{data.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {data.stock > 0 && (
        <View
          style={[
            styles.buy,
            {
              backgroundColor: colors.surface,
              boxShadow: colors.shadow,
              paddingBottom: Spacing.three + insets.bottom,
            },
          ]}>
          {addition.isError && (
            <Text style={{ color: colors.danger }}>{errorMessage(addition.error)}</Text>
          )}
          {added && <Pill label="Added to your cart" tone="success" icon="checkmark" />}
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
                label={signedIn ? `Add to cart · ${total}` : 'Sign in to buy'}
                icon={signedIn ? 'bag-handle-outline' : undefined}
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
  imageTag: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.round,
  },
  tagTop: { top: Spacing.three, left: Spacing.three },
  tagBottom: { bottom: Spacing.three, left: Spacing.three },
  tagCount: {
    bottom: Spacing.three,
    right: Spacing.three,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  tagLabel: { fontSize: 13, fontFamily: Fonts.medium },
  stockDot: { width: 8, height: 8, borderRadius: Radius.round },
  body: { padding: Spacing.three + 4, gap: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  name: { flex: 1, fontSize: 30, lineHeight: 36, fontFamily: Fonts.display },
  price: { fontSize: 25, fontFamily: Fonts.display },
  unit: { fontSize: 15, fontFamily: Fonts.body },
  farm: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  farmText: { flex: 1, gap: 2 },
  farmName: { fontSize: 18, fontFamily: Fonts.display },
  farmPlace: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  promises: { padding: Spacing.three, gap: 14, borderRadius: Radius.large },
  about: { gap: Spacing.two },
  aboutTitle: { fontSize: 21, fontFamily: Fonts.display },
  description: { fontSize: 16, lineHeight: 25 },
  buy: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
  },
  buyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  buyButton: { flex: 1 },
});
