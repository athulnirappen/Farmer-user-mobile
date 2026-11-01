import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { removeFromCart, setCartQuantity, useCart, useCartUpdate } from '@/api/cart';
import type { CartItem } from '@/api/types';
import { useSession } from '@/auth/session';
import {
  Button,
  EmptyState,
  ErrorState,
  Loading,
  SignInPrompt,
  Stepper,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
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
};

function CartRow({ item, busy, update }: RowProps) {
  const colors = useTheme();
  const { productId, product, quantity, issue, availableStock } = item;
  const message = issueMessage(item);
  const canChangeQuantity = issue !== 'UNAVAILABLE' && availableStock > 0;

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.rowTop}>
        <View style={styles.rowDetails}>
          <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
          <Text style={{ color: colors.textSecondary }}>{product.farmer.farmName}</Text>
          <Text style={{ color: colors.textSecondary }}>
            {formatPrice(item.unitPrice)} / {product.unit}
          </Text>
        </View>
        <Text style={[styles.lineTotal, { color: colors.text }]}>
          {issue === 'UNAVAILABLE' ? '—' : formatPrice(item.lineTotal)}
        </Text>
      </View>

      {message && <Text style={{ color: colors.danger }}>{message}</Text>}

      <View style={styles.rowActions}>
        {canChangeQuantity ? (
          <Stepper
            value={quantity}
            max={Math.min(Math.max(availableStock, quantity), MAX_QUANTITY)}
            disabled={busy}
            onChange={(next) => update(() => setCartQuantity(productId, next))}
          />
        ) : (
          <View />
        )}
        <View style={styles.rowButtons}>
          {issue === 'PRICE_CHANGED' && (
            // Saving the quantity records the current price as the one the buyer accepted
            <Button
              label="Accept price"
              variant="plain"
              disabled={busy}
              onPress={() => update(() => setCartQuantity(productId, quantity))}
            />
          )}
          {issue === 'INSUFFICIENT_STOCK' && availableStock > 0 && (
            <Button
              label={`Change to ${availableStock}`}
              variant="plain"
              disabled={busy}
              onPress={() => update(() => setCartQuantity(productId, availableStock))}
            />
          )}
          <Button
            label="Remove"
            variant="plain"
            disabled={busy}
            onPress={() => update(() => removeFromCart(productId))}
          />
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const colors = useTheme();
  const { signedIn } = useSession();
  const cart = useCart();
  const change = useCartUpdate();
  useRefreshOnFocus(cart.refetch, signedIn === true);

  if (signedIn === null) return <Loading />;
  if (!signedIn) return <SignInPrompt message="Sign in to see your cart" />;
  if (cart.isPending) return <Loading />;
  if (cart.isError) return <ErrorState error={cart.error} onRetry={() => cart.refetch()} />;

  const { items, subtotal, hasIssues } = cart.data;
  if (items.length === 0) return <EmptyState message="Your cart is empty." />;

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) => (
          <CartRow item={item} busy={change.isPending} update={change.mutate} />
        )}
        refreshing={cart.isRefetching}
        onRefresh={() => cart.refetch()}
      />
      <View style={[styles.footer, { borderColor: colors.border }]}>
        {change.isError && (
          <Text style={{ color: colors.danger }}>{errorMessage(change.error)}</Text>
        )}
        {hasIssues && (
          <Text style={{ color: colors.danger }}>Fix the items above to check out.</Text>
        )}
        <View style={styles.total}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.totalLabel, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
        </View>
        <Button
          label="Checkout"
          disabled={hasIssues || change.isPending}
          onPress={() => router.push('/checkout')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  row: { padding: Spacing.three, gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTop: { flexDirection: 'row', gap: Spacing.three },
  rowDetails: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '600' },
  lineTotal: { fontSize: 16, fontWeight: '600' },
  rowActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowButtons: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, flexWrap: 'wrap' },
  footer: { padding: Spacing.three, gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  total: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 18, fontWeight: '700' },
});
