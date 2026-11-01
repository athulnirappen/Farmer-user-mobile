import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useOrders, useSlots } from '@/api/orders';
import type { Order, OrderStatus } from '@/api/types';
import { useSession } from '@/auth/session';
import { Text } from '@/components/text';
import {
  Chip,
  EmptyState,
  ErrorState,
  Loading,
  Pill,
  SignInPrompt,
  useCardStyle,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatPrice } from '@/utils/format';
import { ORDER_ICON, ORDER_STATUS, ORDER_TONE, orderItemsSummary, orderReference } from '@/utils/order';

const FILTERS: { label: string; statuses?: OrderStatus[] }[] = [
  { label: 'All orders' },
  { label: 'Active', statuses: ['PLACED', 'CONFIRMED'] },
  { label: 'Completed', statuses: ['COMPLETED'] },
  { label: 'Cancelled', statuses: ['CANCELLED'] },
];

function OrderRow({ order, slotLabel }: { order: Order; slotLabel: string }) {
  const colors = useTheme();
  const cardStyle = useCardStyle();
  const cancelled = order.status === 'CANCELLED';
  const isDelivery = order.fulfilmentType === 'DELIVERY';

  return (
    <Link href={{ pathname: '/order/[id]', params: { id: order.id } }} asChild>
      <Pressable style={StyleSheet.flatten([cardStyle, styles.row])}>
        <View style={styles.top}>
          <View style={styles.heading}>
            <Text style={[styles.farm, { color: colors.text }]} numberOfLines={1}>
              {order.farmer.farmName}
            </Text>
            <Text style={[styles.reference, { color: colors.textSecondary }]}>
              Order {orderReference(order.id)}
            </Text>
          </View>
          <Pill
            label={ORDER_STATUS[order.status]}
            tone={ORDER_TONE[order.status]}
            icon={ORDER_ICON[order.status]}
          />
        </View>

        <View
          style={[
            styles.summary,
            { backgroundColor: cancelled ? colors.dangerSoft : colors.primarySoft },
          ]}>
          {cancelled && order.cancelReason && (
            <Text style={{ color: colors.danger }}>{order.cancelReason}</Text>
          )}
          <View style={styles.summaryLine}>
            <Ionicons
              name={isDelivery ? 'bicycle-outline' : 'storefront-outline'}
              size={19}
              color={colors.text}
            />
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {formatDate(order.deliveryDate)} · {slotLabel}
            </Text>
          </View>
          <View style={styles.summaryLine}>
            <Ionicons name="cube-outline" size={19} color={colors.text} />
            <Text style={[styles.summaryText, { color: colors.text }]} numberOfLines={2}>
              {orderItemsSummary(order)}
            </Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Order total</Text>
            <Text
              style={[
                styles.total,
                { color: cancelled ? colors.textSecondary : colors.text },
                cancelled && styles.struck,
              ]}>
              {formatPrice(order.totalAmount)}
            </Text>
          </View>
          {!cancelled && <Pill label="Cash on delivery" tone="success" icon="cash-outline" />}
        </View>
      </Pressable>
    </Link>
  );
}

export default function OrdersScreen() {
  const colors = useTheme();
  const { signedIn } = useSession();
  const orders = useOrders();
  const slots = useSlots();
  const [filter, setFilter] = useState(FILTERS[0]);
  useRefreshOnFocus(orders.refetch, signedIn === true);

  if (signedIn === null) return <Loading />;
  if (!signedIn) return <SignInPrompt message="Sign in to see your orders" icon="receipt-outline" />;
  if (orders.isPending) return <Loading />;
  if (orders.isError) return <ErrorState error={orders.error} onRetry={() => orders.refetch()} />;

  const all = orders.data.pages.flatMap((page) => page.items);
  const shown = filter.statuses ? all.filter(({ status }) => filter.statuses?.includes(status)) : all;

  return (
    <FlatList
      data={shown}
      keyExtractor={(order) => order.id}
      renderItem={({ item }) => (
        <OrderRow
          order={item}
          slotLabel={slots.data?.slots.find(({ id }) => id === item.timeSlot)?.label ?? item.timeSlot}
        />
      )}
      ListHeaderComponent={
        all.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filters}
            contentContainerStyle={styles.filterRow}>
            {FILTERS.map((option) => (
              <Chip
                key={option.label}
                label={option.label}
                selected={option === filter}
                onPress={() => setFilter(option)}
              />
            ))}
          </ScrollView>
        ) : undefined
      }
      ListEmptyComponent={
        <EmptyState
          message={
            all.length > 0
              ? `No ${filter.label.toLowerCase()} orders.`
              : "You haven't ordered anything yet."
          }
          icon="receipt-outline"
        />
      }
      ListFooterComponent={
        shown.length > 0 ? (
          <View style={[styles.note, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Each farm fulfils its own order. Pay the farmer in cash.
            </Text>
          </View>
        ) : undefined
      }
      contentContainerStyle={styles.list}
      refreshing={orders.isRefetching && !orders.isFetchingNextPage}
      onRefresh={() => orders.refetch()}
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (orders.hasNextPage && !orders.isFetching) orders.fetchNextPage();
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, padding: Spacing.three, gap: 14 },
  filters: { marginHorizontal: -Spacing.three },
  filterRow: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  row: { padding: Spacing.three, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.two },
  heading: { flex: 1, gap: 1 },
  farm: { fontSize: 20, fontFamily: Fonts.display },
  reference: { fontSize: 13 },
  summary: { padding: 12, gap: Spacing.two, borderRadius: Radius.small },
  summaryLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { flex: 1, fontSize: 14 },
  bottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: Spacing.two },
  totalLabel: { fontSize: 12 },
  total: { fontSize: 24, lineHeight: 30, fontFamily: Fonts.display },
  struck: { textDecorationLine: 'line-through' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.medium,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
