import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { removeFromCart, setCartQuantity, useCart, useCartQuantity, useCartUpdate } from '@/api/cart';
import type { CartItem } from '@/api/types';
import { useSession } from '@/auth/session';
import { Text } from '@/components/text';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Eyebrow,
  Loading,
  SignInPrompt,
  Stepper,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage, formatPrice } from '@/utils/format';

const MAX_QUANTITY = 1000;

const issueMessage = (item: CartItem) => {
  switch (item.issue) {
    case 'UNAVAILABLE':
      return 'No longer available';
    case 'INSUFFICIENT_STOCK':
      return item.availableStock > 0
        ? `Only ${item.availableStock} ${item.product.unit} left`
        : 'Out of stock';
    case 'PRICE_CHANGED':
      return `Price changed from ${formatPrice(item.unitPriceAtAdd)}`;
    default:
      return null;
  }
};

type RowProps = {
  item: CartItem;
  busy: boolean;
  update: (change: () => ReturnType<typeof setCartQuantity>) => void;
  onQuantity: (quantity: number) => void;
};

function CartRow({ item, busy, update, onQuantity }: RowProps) {
  const colors = useTheme();
  const { productId, product, quantity, issue, availableStock } = item;
  const message = issueMessage(item);
  const canChangeQuantity = issue !== 'UNAVAILABLE' && availableStock > 0;

  // Saving the quantity records the current price as the one the buyer accepted
  const fix =
    issue === 'PRICE_CHANGED'
      ? { label: 'Accept price', onPress: () => update(() => setCartQuantity(productId, quantity)) }
      : issue === 'INSUFFICIENT_STOCK' && availableStock > 0
        ? {
            label: `Change to ${availableStock}`,
            onPress: () => update(() => setCartQuantity(productId, availableStock)),
          }
        : undefined;

  return (
    <Card style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.rowDetails}>
          <View style={styles.farm}>
            <View style={[styles.farmDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.farmName, { color: colors.textSecondary }]} numberOfLines={1}>
              {product.farmer.farmName}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
          <Text style={{ color: colors.textSecondary }}>
            {formatPrice(item.unitPrice)} per {product.unit}
          </Text>
        </View>
        <View style={styles.lineTotalColumn}>
          <Text style={[styles.lineTotal, { color: colors.text }]}>
            {issue === 'UNAVAILABLE' ? '—' : formatPrice(item.lineTotal)}
          </Text>
          <Text style={[styles.lineTotalLabel, { color: colors.textSecondary }]}>Line total</Text>
        </View>
      </View>

      {message && (
        <Banner
          icon={issue === 'PRICE_CHANGED' ? 'trending-up-outline' : 'alert-circle-outline'}
          title={message}
          action={fix && { ...fix, disabled: busy }}
        />
      )}

      <View style={styles.rowActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${product.name}`}
          disabled={busy}
          hitSlop={10}
          onPress={() => update(() => removeFromCart(productId))}
          style={styles.remove}>
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
          <Text style={[styles.removeLabel, { color: colors.danger }]}>Remove</Text>
        </Pressable>
        {canChangeQuantity && (
          <Stepper
            value={quantity}
            max={Math.min(Math.max(availableStock, quantity), MAX_QUANTITY)}
            onChange={onQuantity}
          />
        )}
      </View>
    </Card>
  );
}

export default function CartScreen() {
  const colors = useTheme();
  const { signedIn } = useSession();
  const cart = useCart();
  const change = useCartUpdate();
  const quantity = useCartQuantity();
  useRefreshOnFocus(cart.refetch, signedIn === true);

  if (signedIn === null) return <Loading />;
  if (!signedIn) return <SignInPrompt message="Sign in to see your cart" icon="basket-outline" />;
  if (cart.isPending) return <Loading />;
  if (cart.isError) return <ErrorState error={cart.error} onRetry={() => cart.refetch()} />;

  const { items, itemCount, subtotal, hasIssues } = cart.data;
  if (items.length === 0) return <EmptyState message="Your cart is empty." icon="basket-outline" />;

  const error = quantity.error ?? change.error;
  // A removal or fix must not overtake a quantity still waiting to be sent
  const update: RowProps['update'] = async (next) => {
    await quantity.flush();
    change.mutate(next);
  };

  const farmCount = new Set(items.map(({ product }) => product.farmer.id)).size;

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) => (
          <CartRow
            item={item}
            busy={change.isPending}
            update={update}
            onQuantity={(next) => quantity.change(item.productId, next)}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Eyebrow label="Your basket" />
              <Text style={{ color: colors.textSecondary }}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
            {farmCount > 1 && (
              <Banner
                icon="git-branch-outline"
                tone="success"
                title={`This becomes ${farmCount} orders`}
                detail="Each farm fulfils its own order, and you pay each farmer in cash."
              />
            )}
          </View>
        }
        contentContainerStyle={styles.list}
        refreshing={cart.isRefetching}
        onRefresh={() => cart.refetch()}
      />
      <View style={[styles.footer, { backgroundColor: colors.surface, boxShadow: colors.shadow }]}>
        {!!error && <Text style={{ color: colors.danger }}>{errorMessage(error)}</Text>}
        <View style={styles.total}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
        </View>
        {hasIssues && (
          <Text style={[styles.fixNote, { color: colors.warning }]}>
            Fix the items above to check out.
          </Text>
        )}
        <Button
          label="Checkout"
          trailingIcon="arrow-forward"
          disabled={hasIssues}
          onPress={async () => {
            await quantity.flush();
            router.navigate('/checkout');
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { padding: Spacing.three, gap: 14 },
  header: { gap: 12, marginBottom: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { padding: Spacing.three, gap: 12 },
  rowTop: { flexDirection: 'row', gap: Spacing.three },
  rowDetails: { flex: 1, gap: 2 },
  farm: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  farmDot: { width: 8, height: 8, borderRadius: Radius.round },
  farmName: { flexShrink: 1, fontSize: 13 },
  name: { fontSize: 21, fontFamily: Fonts.display },
  lineTotalColumn: { alignItems: 'flex-end' },
  lineTotal: { fontSize: 20, fontFamily: Fonts.display },
  lineTotalLabel: { fontSize: 12 },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  remove: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  removeLabel: { fontSize: 14, fontFamily: Fonts.medium },
  footer: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
  },
  total: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalLabel: { fontSize: 22, fontFamily: Fonts.display },
  totalValue: { fontSize: 26, fontFamily: Fonts.display },
  fixNote: { textAlign: 'center' },
});
