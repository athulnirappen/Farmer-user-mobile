import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAddresses } from '@/api/addresses';
import { useCart } from '@/api/cart';
import { usePlaceOrder, useSlots } from '@/api/orders';
import type { Address, FulfilmentType } from '@/api/types';
import { useSession } from '@/auth/session';
import { Button, EmptyState, ErrorState, Loading, Option } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { addressLines } from '@/utils/address';
import { errorMessage, formatDate, formatPrice } from '@/utils/format';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

const addressTitle = (address: Address) => address.label ?? address.line1;

export default function CheckoutScreen() {
  const colors = useTheme();
  const { profile } = useSession();
  const cart = useCart();
  const slots = useSlots();
  const addresses = useAddresses();
  const placeOrder = usePlaceOrder();
  const [fulfilment, setFulfilment] = useState<FulfilmentType>('DELIVERY');
  const [slotId, setSlotId] = useState<string>();
  const [addressId, setAddressId] = useState<string>();
  useRefreshOnFocus(slots.refetch);

  if (cart.isPending || slots.isPending || addresses.isPending) return <Loading />;

  const failed = [cart, slots, addresses].find((query) => query.isError);
  if (failed) return <ErrorState error={failed.error} onRetry={() => failed.refetch()} />;
  if (!cart.data || !slots.data || !addresses.data) return <Loading />;
  if (cart.data.items.length === 0) return <EmptyState message="Your cart is empty." />;

  const { items, subtotal, hasIssues } = cart.data;
  const { deliveryDate, isOpen, cutoffHour } = slots.data;
  const savedAddresses = addresses.data;
  const address =
    savedAddresses.find(({ id }) => id === addressId) ??
    savedAddresses.find(({ isDefault }) => isDefault);
  const isDelivery = fulfilment === 'DELIVERY';

  // Each farm fulfils its own order, so pickup means one stop per farm
  const farms = [...new Map(items.map(({ product }) => [product.farmer.id, product.farmer])).values()];
  const pickupBlocked = !isDelivery && farms.some(({ farmLocation }) => !farmLocation);
  const ready = isOpen && !hasIssues && slotId && (isDelivery ? address : !pickupBlocked);

  const submit = () => {
    if (!slotId) return;
    placeOrder.mutate(
      {
        fulfilmentType: fulfilment,
        timeSlot: slotId,
        ...(isDelivery && address && { addressId: address.id }),
      },
      {
        onSuccess: ({ orders }) => {
          Alert.alert(
            'Order placed',
            orders.length > 1
              ? `Your order was split into ${orders.length}, one for each farm. Pay each farmer in cash.`
              : 'Pay the farmer in cash.'
          );
          router.dismissTo('/orders');
        },
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {!isOpen && (
        <Text style={{ color: colors.danger }}>
          Ordering for tomorrow closed at {cutoffHour}:00. It reopens at midnight.
        </Text>
      )}

      <Section title="How do you want it?">
        <Option
          title="Delivery"
          selected={isDelivery}
          onPress={() => setFulfilment('DELIVERY')}
        />
        <Option
          title="Pick up from the farm"
          selected={!isDelivery}
          onPress={() => setFulfilment('PICKUP')}
        />
      </Section>

      {isDelivery ? (
        <Section title="Deliver to">
          {savedAddresses.map((saved) => (
            <Option
              key={saved.id}
              title={addressTitle(saved)}
              detail={addressLines(saved)}
              selected={saved.id === address?.id}
              onPress={() => setAddressId(saved.id)}
            />
          ))}
          <Button
            label="Add a new address"
            variant="plain"
            onPress={() => router.push('/address-form')}
          />
        </Section>
      ) : (
        <Section title="Pick up from">
          {farms.map(({ id, farmName, farmLocation }) => (
            <Text key={id} style={{ color: colors.text }}>
              {farmName}: {farmLocation ?? 'pickup is not available from this farm'}
            </Text>
          ))}
        </Section>
      )}

      <Section title={`Time on ${formatDate(deliveryDate)}`}>
        {slots.data.slots.map(({ id, label }) => (
          <Option key={id} title={label} selected={id === slotId} onPress={() => setSlotId(id)} />
        ))}
      </Section>

      <Section title="Your order">
        {items.map(({ productId, product, quantity, lineTotal }) => (
          <View key={productId} style={styles.line}>
            <Text style={[styles.lineName, { color: colors.text }]}>
              {product.name} × {quantity} {product.unit}
            </Text>
            <Text style={{ color: colors.text }}>{formatPrice(lineTotal)}</Text>
          </View>
        ))}
        <View style={styles.line}>
          <Text style={[styles.total, { color: colors.text }]}>Total</Text>
          <Text style={[styles.total, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
        </View>
        {farms.length > 1 && (
          <Text style={{ color: colors.textSecondary }}>
            This becomes {farms.length} orders, one for each farm.
          </Text>
        )}
        <Text style={{ color: colors.textSecondary }}>Payment: cash on delivery</Text>
        {profile.data && (
          <Text style={{ color: colors.textSecondary }}>
            Contact: {profile.data.name}, {profile.data.phone}
          </Text>
        )}
      </Section>

      {hasIssues && (
        <Text style={{ color: colors.danger }}>Something in your cart changed. Go back to fix it.</Text>
      )}
      {placeOrder.isError && (
        <Text style={{ color: colors.danger }}>{errorMessage(placeOrder.error)}</Text>
      )}
      <Button
        label="Place order"
        busy={placeOrder.isPending}
        disabled={!ready}
        onPress={submit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: Spacing.three, gap: Spacing.four },
  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  lineName: { flex: 1 },
  total: { fontSize: 18, fontWeight: '700' },
});
