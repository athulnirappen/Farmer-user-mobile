import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useCancelOrder, useOrder, useSlots, useUpdateOrderStatus } from '@/api/orders';
import { useSession } from '@/auth/session';
import { Button, ErrorState, Field, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addressLines } from '@/utils/address';
import { errorMessage, formatDate, formatPrice } from '@/utils/format';
import { FARM_ORDER_STATUS, ORDER_STATUS } from '@/utils/order';

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
      <View style={styles.section}>
        <Text style={[styles.farm, { color: colors.text }]}>{data.farmer.farmName}</Text>
        <Text style={{ color: data.status === 'CANCELLED' ? colors.danger : colors.primary }}>
          {statusLabels[data.status]}
        </Text>
        {data.cancelReason && (
          <Text style={{ color: colors.textSecondary }}>{data.cancelReason}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, { color: colors.text }]}>
          {isDelivery ? 'Delivery' : 'Pickup'} on {formatDate(data.deliveryDate)}, {slot}
        </Text>
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
        <Text style={{ color: colors.textSecondary }}>
          Contact: {data.contactName}, {data.contactPhone}
        </Text>
      </View>

      <View style={styles.section}>
        {data.items.map((item) => (
          <View key={item.id} style={styles.line}>
            <Text style={[styles.lineName, { color: colors.text }]}>
              {item.productName} × {item.quantity} {item.unit}
            </Text>
            <Text style={{ color: colors.text }}>{formatPrice(item.lineTotal)}</Text>
          </View>
        ))}
        <View style={styles.line}>
          <Text style={[styles.heading, { color: colors.text }]}>Total</Text>
          <Text style={[styles.heading, { color: colors.text }]}>
            {formatPrice(data.totalAmount)}
          </Text>
        </View>
        <Text style={{ color: colors.textSecondary }}>Payment: cash on delivery</Text>
      </View>

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
          variant="plain"
          busy={cancel.isPending}
          disabled={busy}
          onPress={confirmCancel}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: Spacing.three, gap: Spacing.four },
  section: { gap: Spacing.one },
  farm: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '600' },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  lineName: { flex: 1 },
});
