import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useFarmOrders, useSlots } from '@/api/orders';
import type { Order } from '@/api/types';
import { Chip, EmptyState, ErrorState, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice, previousDay } from '@/utils/format';
import { FARM_ORDER_STATUS } from '@/utils/order';

function OrderRow({ order, slotLabel }: { order: Order; slotLabel: string }) {
  const colors = useTheme();
  const isDelivery = order.fulfilmentType === 'DELIVERY';

  return (
    <Link href={{ pathname: '/order/[id]', params: { id: order.id } }} asChild>
      <Pressable style={StyleSheet.flatten([styles.row, { borderColor: colors.border }])}>
        <Text style={[styles.buyer, { color: colors.text }]}>{order.contactName}</Text>
        <Text style={{ color: colors.textSecondary }}>
          {slotLabel} · {isDelivery ? 'Delivery' : 'Pickup'} · {formatPrice(order.totalAmount)}
        </Text>
        <Text style={{ color: order.status === 'CANCELLED' ? colors.danger : colors.primary }}>
          {FARM_ORDER_STATUS[order.status]}
        </Text>
      </Pressable>
    </Link>
  );
}

export default function FarmOrdersScreen() {
  const slots = useSlots();
  const [day, setDay] = useState<'today' | 'tomorrow'>('tomorrow');
  // Taken from the API, as the farm's calendar day is the business one, not the phone's
  const tomorrow = slots.data?.deliveryDate;
  const date = tomorrow && day === 'today' ? previousDay(tomorrow) : tomorrow;
  const orders = useFarmOrders(date);
  useRefreshOnFocus(orders.refetch, date !== undefined);

  const labelFor = (slotId: string) =>
    slots.data?.slots.find(({ id }) => id === slotId)?.label ?? slotId;

  if (slots.isError) return <ErrorState error={slots.error} onRetry={() => slots.refetch()} />;

  return (
    <View style={styles.screen}>
      <View style={styles.days}>
        <Chip label="Today" selected={day === 'today'} onPress={() => setDay('today')} />
        <Chip label="Tomorrow" selected={day === 'tomorrow'} onPress={() => setDay('tomorrow')} />
      </View>
      {orders.isPending ? (
        <Loading />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : (
        <FlatList
          data={orders.data.pages.flatMap((page) => page.items)}
          keyExtractor={(order) => order.id}
          renderItem={({ item }) => <OrderRow order={item} slotLabel={labelFor(item.timeSlot)} />}
          ListEmptyComponent={<EmptyState message={`No orders for ${day}.`} />}
          contentContainerStyle={styles.list}
          refreshing={orders.isRefetching && !orders.isFetchingNextPage}
          onRefresh={() => orders.refetch()}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (orders.hasNextPage && !orders.isFetching) orders.fetchNextPage();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  days: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.three },
  list: { flexGrow: 1 },
  row: { padding: Spacing.three, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  buyer: { fontSize: 17, fontWeight: '600' },
});
