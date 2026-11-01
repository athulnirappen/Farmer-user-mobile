import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '@/api/cart';
import { Text } from '@/components/text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice } from '@/utils/format';

export const BASKET_BAR_SPACE = 96;

export function BasketBar() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const cart = useCart();

  if (!cart.data?.itemCount) return null;
  const { itemCount, subtotal } = cart.data;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View cart, ${itemCount} items`}
      onPress={() => router.navigate('/cart')}
      style={[
        styles.bar,
        { backgroundColor: colors.heroStart, bottom: Spacing.three + insets.bottom },
      ]}>
      <View style={[styles.icon, { backgroundColor: colors.heroEnd }]}>
        <Ionicons name="basket-outline" size={20} color={colors.onHero} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.onHero }]}>
          Basket: {itemCount} {itemCount === 1 ? 'item' : 'items'} · {formatPrice(subtotal)}
        </Text>
        <Text style={[styles.detail, { color: colors.onHeroMuted }]}>Pay the farmer in cash</Text>
      </View>
      <Text style={[styles.action, { color: colors.accentBright }]}>View cart</Text>
      <Ionicons name="arrow-forward" size={18} color={colors.accentBright} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    paddingRight: 18,
    borderRadius: Radius.round,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 15, fontFamily: Fonts.semibold },
  detail: { fontSize: 12 },
  action: { fontSize: 15, fontFamily: Fonts.semibold },
});
