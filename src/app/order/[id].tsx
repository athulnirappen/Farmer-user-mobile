import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { useCancelOrder, useOrder, useSlots, useUpdateOrderStatus } from '@/api/orders';
import { useSession } from '@/auth/session';
import { Text } from '@/components/text';
import {
  Banner,
  Button,
  Card,
  ErrorState,
  Eyebrow,
  Field,
  Loading,
  Pill,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addressLines } from '@/utils/address';
import { errorMessage, formatDate, formatPrice } from '@/utils/format';
import {
  FARM_ORDER_STATUS,
  ORDER_ICON,
  ORDER_STATUS,
  ORDER_TONE,
  orderReference,
} from '@/utils/order';

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const order = useOrder(id);
  const slots = useSlots();
  const cancel = useCancelOrder(id);
  const updateStatus = useUpdateOrderStatus(id);
  const { profile } = useSession();
  const [reason, setReason] = useState('');

  if (order.isPending) return <Loading />;
  if (order.isError) return <ErrorState error={order.error} onRetry={() => order.refetch()} />;

  const { data } = order;
  const slot = slots.data?.slots.find((option) => option.id === data.timeSlot)?.label ?? data.timeSlot;
  const isDelivery = data.fulfilmentType === 'DELIVERY';
  // The same screen serves both sides of the order; the API already limits who can open it
  const isFarmer = profile.data?.farmer?.id === data.farmer.id;
  const statusLabels = isFarmer ? FARM_ORDER_STATUS : ORDER_STATUS;
  const canCancel = data.status === 'PLACED' || (isFarmer && data.status === 'CONFIRMED');
  const busy = cancel.isPending || updateStatus.isPending;
  const error = cancel.error ?? updateStatus.error;

  const confirmCancel = () =>
    Alert.alert('Cancel this order?', 'This cannot be undone.', [
      { text: 'Keep order', style: 'cancel' },
      { text: 'Cancel order', style: 'destructive', onPress: () => cancel.mutate(reason.trim() || undefined) },
    ]);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card style={styles.head}>
        <View style={styles.headTop}>
          <Eyebrow label={`Order ${orderReference(data.id)}`} color={colors.textSecondary} />
          <Pill
            label={statusLabels[data.status]}
            tone={ORDER_TONE[data.status]}
            icon={ORDER_ICON[data.status]}
          />
        </View>
        <Text style={[styles.farm, { color: colors.text }]}>{data.farmer.farmName}</Text>
        {data.cancelReason && (
          <Text style={{ color: colors.danger }}>{data.cancelReason}</Text>
        )}
      </Card>

      <Card style={styles.block}>
        <View style={styles.blockHead}>
          <Ionicons name="time-outline" size={20} color={colors.text} />
          <Eyebrow label={isDelivery ? 'Delivery' : 'Pickup'} color={colors.text} />
        </View>
        <View style={[styles.schedule, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.scheduleText, { color: colors.text }]}>
            {formatDate(data.deliveryDate)} · {slot}
          </Text>
        </View>
        <View style={styles.contact}>
          <View style={[styles.contactIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons
              name={isDelivery ? 'location-outline' : 'storefront-outline'}
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.contactText}>
            <Text style={[styles.contactName, { color: colors.text }]}>{data.contactName}</Text>
            <Text style={{ color: colors.textSecondary }}>
              {isDelivery
                ? addressLines({
                    line1: data.addressLine1,
                    line2: data.addressLine2,
                    city: data.city,
                    pincode: data.pincode,
                  })
                : data.pickupLocation}
            </Text>
            <Text style={{ color: colors.textSecondary }}>Contact: {data.contactPhone}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.block}>
        <View style={styles.blockHead}>
          <Ionicons name="leaf-outline" size={20} color={colors.text} />
          <Eyebrow label="Items" color={colors.text} />
          <View style={styles.itemCount}>
            <Pill
              label={`${data.items.length} ${data.items.length === 1 ? 'product' : 'products'}`}
              tone="success"
            />
          </View>
        </View>
        {data.items.map((item) => (
          <View key={item.id} style={styles.line}>
            <View style={styles.lineText}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.productName}</Text>
              <Text style={{ color: colors.textSecondary }}>
                {item.quantity} {item.unit} × {formatPrice(item.unitPrice)}
              </Text>
            </View>
            <Text style={[styles.lineTotal, { color: colors.text }]}>
              {formatPrice(item.lineTotal)}
            </Text>
          </View>
        ))}
        <View style={[styles.grandTotal, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            {formatPrice(data.totalAmount)}
          </Text>
        </View>
      </Card>

      <View style={[styles.cash, { backgroundColor: colors.warningSoft }]}>
        <Ionicons name="cash-outline" size={24} color={colors.warning} />
        <View style={styles.cashText}>
          <View style={styles.cashTitle}>
            <Text style={[styles.cashLabel, { color: colors.warning }]}>Cash on delivery</Text>
            <Text style={[styles.cashAmount, { color: colors.warning }]}>
              {formatPrice(data.totalAmount)}
            </Text>
          </View>
          <Text style={{ color: colors.text }}>Pay the farmer directly in cash.</Text>
        </View>
      </View>

      {!isFarmer && data.status === 'PLACED' && (
        <Banner
          icon="information-circle-outline"
          tone="success"
          title="You can cancel until the farmer confirms"
        />
      )}

      {error && <Text style={{ color: colors.danger }}>{errorMessage(error)}</Text>}
      {isFarmer && data.status === 'PLACED' && (
        <Button
          label="Confirm order"
          busy={updateStatus.isPending}
          disabled={busy}
          onPress={() => updateStatus.mutate('CONFIRMED')}
        />
      )}
      {isFarmer && data.status === 'CONFIRMED' && (
        <Button
          label="Mark as completed"
          busy={updateStatus.isPending}
          disabled={busy}
          onPress={() => updateStatus.mutate('COMPLETED')}
        />
      )}
      {isFarmer && canCancel && (
        <Field
          label="Reason for cancelling, shown to the buyer (optional)"
          value={reason}
          onChangeText={setReason}
          maxLength={300}
        />
      )}
      {canCancel && (
        <Button
          label="Cancel order"
          icon="close-circle-outline"
          variant="danger"
          busy={cancel.isPending}
          disabled={busy}
          onPress={confirmCancel}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: Spacing.three, gap: 14 },
  head: { padding: Spacing.three, gap: Spacing.two },
  headTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  farm: { fontSize: 26, lineHeight: 32, fontFamily: Fonts.display },
  block: { padding: Spacing.three, gap: 12 },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemCount: { marginLeft: 'auto' },
  schedule: { padding: 14, borderRadius: Radius.small },
  scheduleText: { fontSize: 18, fontFamily: Fonts.semibold },
  contact: { flexDirection: 'row', gap: 12 },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: { flex: 1, gap: 1 },
  contactName: { fontSize: 16, fontFamily: Fonts.semibold },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  lineText: { flex: 1, gap: 1 },
  itemName: { fontSize: 16, fontFamily: Fonts.semibold },
  lineTotal: { fontSize: 18, fontFamily: Fonts.display },
  grandTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radius.medium,
  },
  totalLabel: { fontSize: 20, fontFamily: Fonts.display },
  totalValue: { fontSize: 28, fontFamily: Fonts.display },
  cash: {
    flexDirection: 'row',
    gap: 12,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  cashText: { flex: 1, gap: 2 },
  cashTitle: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  cashLabel: { fontSize: 18, fontFamily: Fonts.display },
  cashAmount: { fontSize: 18, fontFamily: Fonts.display },
});
