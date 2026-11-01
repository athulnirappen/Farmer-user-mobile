import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAddresses } from '@/api/addresses';
import { useCart } from '@/api/cart';
import { usePlaceOrder, useSlots } from '@/api/orders';
import type { CartItem, FulfilmentType } from '@/api/types';
import { useSession } from '@/auth/session';
import { Text } from '@/components/text';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  GradientPanel,
  Loading,
  Option,
  Section,
  Segmented,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { addressIcon, addressLines } from '@/utils/address';
import { errorMessage, formatDate, formatPrice } from '@/utils/format';

const FULFILMENT_OPTIONS = [
  { value: 'DELIVERY' as const, label: 'Delivery', icon: 'bicycle-outline' as const },
  { value: 'PICKUP' as const, label: 'Farm pickup', icon: 'storefront-outline' as const },
];

// The items as each farm will receive them, since every farm gets its own order
const groupByFarm = (items: CartItem[]) => {
  const farms = new Map<string, { farmName: string; items: CartItem[]; total: number }>();

  for (const item of items) {
    const { id, farmName } = item.product.farmer;
    const farm = farms.get(id) ?? { farmName, items: [], total: 0 };
    farm.items.push(item);
    farm.total += Number(item.lineTotal);
    farms.set(id, farm);
  }

  return [...farms.values()];
};

export default function CheckoutScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
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

  const { items, itemCount, subtotal, hasIssues } = cart.data;
  const { deliveryDate, isOpen, cutoffHour } = slots.data;
  const savedAddresses = addresses.data;
  const address =
    savedAddresses.find(({ id }) => id === addressId) ??
    savedAddresses.find(({ isDefault }) => isDefault);
  const isDelivery = fulfilment === 'DELIVERY';

  // Each farm fulfils its own order, so pickup means one stop per farm
  const farms = [...new Map(items.map(({ product }) => [product.farmer.id, product.farmer])).values()];
  const farmOrders = groupByFarm(items);
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
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.screen}>
        {isOpen ? (
          <Banner
            icon="time-outline"
            title={`Ordering for tomorrow closes at ${cutoffHour}:00`}
            detail={`Order before then for ${formatDate(deliveryDate)}.`}
          />
        ) : (
          <Banner
            icon="time-outline"
            tone="danger"
            title={`Ordering for tomorrow closed at ${cutoffHour}:00`}
            detail="It reopens at midnight."
          />
        )}

        <Section title="How do you want it?">
          <Segmented options={FULFILMENT_OPTIONS} value={fulfilment} onChange={setFulfilment} />
        </Section>

        {isDelivery ? (
          <Section title="Deliver to">
            {savedAddresses.map((saved) => (
              <Option
                key={saved.id}
                title={saved.label ?? 'Address'}
                detail={addressLines(saved)}
                icon={addressIcon(saved.label)}
                badge={saved.isDefault ? 'Default' : undefined}
                selected={saved.id === address?.id}
                onPress={() => setAddressId(saved.id)}
              />
            ))}
            <Button
              label="Add a new address"
              icon="add-circle-outline"
              variant="soft"
              onPress={() => router.push('/address-form')}
            />
          </Section>
        ) : (
          <Section title="Pick up from" card>
            {farms.map(({ id, farmName, farmLocation }) => (
              <Text key={id} style={{ color: colors.text }}>
                {farmName}: {farmLocation ?? 'pickup is not available from this farm'}
              </Text>
            ))}
          </Section>
        )}

        <Section title="Choose a time" aside={formatDate(deliveryDate)}>
          <View style={styles.slots}>
            {slots.data.slots.map(({ id, label }) => {
              const selected = id === slotId;
              const color = selected ? colors.onPrimary : colors.text;

              return (
                <Pressable
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setSlotId(id)}
                  style={[
                    styles.slot,
                    { backgroundColor: selected ? colors.primary : colors.surface },
                  ]}>
                  <Ionicons
                    name={label.includes('AM') ? 'sunny-outline' : 'partly-sunny-outline'}
                    size={18}
                    color={color}
                  />
                  <Text style={[styles.slotLabel, { color }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Your order" card>
          {farms.length > 1 && (
            <Banner
              icon="git-branch-outline"
              tone="success"
              title={`This becomes ${farms.length} separate orders`}
              detail="One for each farm."
            />
          )}
          {farmOrders.map(({ farmName, items: farmItems, total }, index) => (
            <View key={farmName} style={[styles.farmOrder, { backgroundColor: colors.primarySoft }]}>
              <View style={styles.line}>
                <Text style={[styles.farmName, { color: colors.text }]}>
                  {farms.length > 1 ? `Order ${index + 1}: ` : ''}
                  {farmName}
                </Text>
                <Text style={[styles.farmTotal, { color: colors.text }]}>
                  {formatPrice(String(total))}
                </Text>
              </View>
              {farmItems.map(({ productId, product, quantity, lineTotal }) => (
                <View key={productId} style={styles.line}>
                  <Text style={[styles.lineName, { color: colors.textSecondary }]}>
                    {product.name} × {quantity} {product.unit}
                  </Text>
                  <Text style={{ color: colors.textSecondary }}>{formatPrice(lineTotal)}</Text>
                </View>
              ))}
            </View>
          ))}
        </Section>

        {profile.data && (
          <Section title="Contact">
            <Card style={styles.contact}>
              <View style={[styles.contactIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.contactText}>
                <Text style={[styles.contactName, { color: colors.text }]}>{profile.data.name}</Text>
                <Text style={{ color: colors.textSecondary }}>{profile.data.phone}</Text>
              </View>
            </Card>
          </Section>
        )}

        <GradientPanel style={styles.payment}>
          <Ionicons name="cash-outline" size={28} color={colors.accentBright} />
          <View style={styles.paymentText}>
            <Text style={[styles.paymentTitle, { color: colors.onHero }]}>Cash on delivery</Text>
            <Text style={{ color: colors.onHeroMuted }}>
              Pay the farmer directly when you get your order.
            </Text>
          </View>
        </GradientPanel>

        <Card style={styles.bill}>
          <View style={styles.line}>
            <Text style={{ color: colors.textSecondary }}>
              Items ({itemCount})
            </Text>
            <Text style={{ color: colors.text }}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={[styles.line, styles.grandTotal, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.text }]}>{formatPrice(subtotal)}</Text>
          </View>
        </Card>

        {hasIssues && (
          <Text style={{ color: colors.danger }}>Something in your cart changed. Go back to fix it.</Text>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            boxShadow: colors.shadow,
            paddingBottom: Spacing.three + insets.bottom,
          },
        ]}>
        {placeOrder.isError && (
          <Text style={{ color: colors.danger }}>{errorMessage(placeOrder.error)}</Text>
        )}
        <Button
          label={`Place order · ${formatPrice(subtotal)}`}
          icon="bag-check-outline"
          busy={placeOrder.isPending}
          disabled={!ready}
          onPress={submit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  screen: { padding: Spacing.three, gap: 22 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 60,
    paddingHorizontal: 14,
    borderRadius: Radius.medium,
  },
  slotLabel: { fontSize: 15, fontFamily: Fonts.semibold },
  farmOrder: { padding: 14, gap: 6, borderRadius: Radius.medium },
  farmName: { flex: 1, fontSize: 16, fontFamily: Fonts.semibold },
  farmTotal: { fontSize: 17, fontFamily: Fonts.display },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  lineName: { flex: 1 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: { flex: 1 },
  contactName: { fontSize: 17, fontFamily: Fonts.semibold },
  payment: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  paymentText: { flex: 1, gap: 2 },
  paymentTitle: { fontSize: 20, fontFamily: Fonts.display },
  bill: { padding: Spacing.three, gap: 10 },
  grandTotal: { alignItems: 'center', padding: 14, borderRadius: Radius.medium },
  totalLabel: { fontSize: 20, fontFamily: Fonts.display },
  totalValue: { fontSize: 26, fontFamily: Fonts.display },
  footer: { padding: Spacing.three, gap: Spacing.two },
});
