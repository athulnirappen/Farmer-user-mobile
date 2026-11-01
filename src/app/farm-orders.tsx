import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { useFarmOrders, useSlots } from '@/api/orders';
import type { Order } from '@/api/types';
import { Text } from '@/components/text';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Eyebrow,
  IconBadge,
  Loading,
  Pill,
  Segmented,
  useCardStyle,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { formatPrice, previousDay } from '@/utils/format';
import { FARM_ORDER_STATUS, ORDER_ICON, ORDER_TONE, orderItemsSummary } from '@/utils/order';

type Day = 'today' | 'tomorrow';

const orderCount = (data?: { pages: { total: number }[] }) => data?.pages[0]?.total;

function OrderRow({ order, slotLabel }: { order: Order; slotLabel: string }) {
  const colors = useTheme();
  const cardStyle = useCardStyle();
  const isDelivery = order.fulfilmentType === 'DELIVERY';
  const isNew = order.status === 'PLACED';
  const href = { pathname: '/order/[id]', params: { id: order.id } } as const;

  return (
    <Link href={href} asChild>
      <Pressable style={StyleSheet.flatten([cardStyle, styles.row])}>
        <View style={styles.top}>
          <View style={styles.buyer}>
            <Text style={[styles.buyerName, { color: colors.text }]} numberOfLines={1}>
              {order.contactName}
            </Text>
            {isDelivery && order.city && (
              <View style={styles.place}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary }}>{order.city}</Text>
              </View>
            )}
          </View>
          <Pill
            label={isDelivery ? 'Delivery' : 'Farm pickup'}
            tone={isDelivery ? 'neutral' : 'warning'}
            icon={isDelivery ? 'bicycle-outline' : 'storefront-outline'}
          />
        </View>

        <View style={[styles.slot, { backgroundColor: colors.primarySoft }]}>
          <View style={styles.slotTime}>
            <Ionicons name="time-outline" size={19} color={colors.text} />
            <Text style={[styles.slotLabel, { color: colors.text }]}>{slotLabel}</Text>
          </View>
          <Pill
            label={FARM_ORDER_STATUS[order.status]}
            tone={ORDER_TONE[order.status]}
            icon={ORDER_ICON[order.status]}
          />
        </View>

        <Text style={{ color: colors.text }} numberOfLines={2}>
          {orderItemsSummary(order)}
        </Text>

        <View style={styles.bottom}>
          <View>
            <Eyebrow
              label={isDelivery ? 'Cash on delivery' : 'Cash on pickup'}
              color={colors.textSecondary}
            />
            <Text style={[styles.total, { color: colors.text }]}>
              {formatPrice(order.totalAmount)}
            </Text>
          </View>
          <Button
            label={isNew ? 'Review & confirm' : 'View detail'}
            trailingIcon={isNew ? 'arrow-forward' : undefined}
            variant={isNew ? 'primary' : 'soft'}
            small
            onPress={() => router.push(href)}
          />
        </View>
      </Pressable>
    </Link>
  );
}

export default function FarmOrdersScreen() {
  const colors = useTheme();
  const slots = useSlots();
  const [day, setDay] = useState<Day>('tomorrow');
  // Taken from the API, as the farm's calendar day is the business one, not the phone's
  const tomorrow = slots.data?.deliveryDate;
  const today = tomorrow && previousDay(tomorrow);
  const todayOrders = useFarmOrders(today);
  const tomorrowOrders = useFarmOrders(tomorrow);
  const orders = day === 'today' ? todayOrders : tomorrowOrders;
  const counts = { today: orderCount(todayOrders.data), tomorrow: orderCount(tomorrowOrders.data) };
  useRefreshOnFocus(orders.refetch, tomorrow !== undefined);

  const labelFor = (slotId: string) =>
    slots.data?.slots.find(({ id }) => id === slotId)?.label ?? slotId;

  if (slots.isError) return <ErrorState error={slots.error} onRetry={() => slots.refetch()} />;

  const dayLabel = (name: string, count?: number) => (count === undefined ? name : `${name} (${count})`);
  const loaded = orders.data?.pages.flatMap((page) => page.items) ?? [];
  const active = loaded.filter(({ status }) => status !== 'CANCELLED');
  const cash = active.reduce((sum, order) => sum + Number(order.totalAmount), 0);

  return (
    <View style={styles.screen}>
      <View style={styles.days}>
        <Segmented
          options={[
            { value: 'today', label: dayLabel('Today', counts.today), icon: 'calendar-outline' },
            { value: 'tomorrow', label: dayLabel('Tomorrow', counts.tomorrow), icon: 'calendar-outline' },
          ]}
          value={day}
          onChange={setDay}
        />
      </View>
      {orders.isPending ? (
        <Loading />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : (
        <FlatList
          data={loaded}
          keyExtractor={(order) => order.id}
          renderItem={({ item }) => <OrderRow order={item} slotLabel={labelFor(item.timeSlot)} />}
          ListHeaderComponent={
            active.length > 0 ? (
              <Card style={styles.summary}>
                <View style={styles.summaryHead}>
                  <IconBadge icon="basket-outline" size={48} />
                  <View style={styles.summaryText}>
                    <Eyebrow label={`${day}'s orders`} />
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>
                      {active.length} {active.length === 1 ? 'order' : 'orders'} to prepare
                    </Text>
                  </View>
                </View>
                <View style={[styles.cash, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="cash-outline" size={20} color={colors.accent} />
                  <Text style={[styles.cashLabel, { color: colors.text }]}>
                    Total expected in cash
                  </Text>
                  <Text style={[styles.cashValue, { color: colors.text }]}>
                    {formatPrice(String(cash))}
                  </Text>
                </View>
              </Card>
            ) : undefined
          }
          ListEmptyComponent={<EmptyState message={`No orders for ${day}.`} icon="receipt-outline" />}
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
  days: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: 12 },
  list: { flexGrow: 1, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: 14 },
  summary: { padding: Spacing.three, gap: 12 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryText: { flex: 1, gap: 1 },
  summaryTitle: { fontSize: 22, lineHeight: 28, fontFamily: Fonts.display },
  cash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: 12,
    borderRadius: Radius.small,
  },
  cashLabel: { flex: 1, fontSize: 15 },
  cashValue: { fontSize: 24, fontFamily: Fonts.display },
  row: { padding: Spacing.three, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.two },
  buyer: { flex: 1, gap: 1 },
  buyerName: { fontSize: 21, fontFamily: Fonts.display },
  place: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  slot: { padding: 12, gap: Spacing.two, borderRadius: Radius.small },
  slotTime: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  slotLabel: { fontSize: 16, fontFamily: Fonts.semibold },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  total: { fontSize: 25, lineHeight: 31, fontFamily: Fonts.display },
});
