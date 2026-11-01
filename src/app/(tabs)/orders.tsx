import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

import { useOrders, useSlots } from '@/api/orders';
import type { Order } from '@/api/types';
import { useSession } from '@/auth/session';
import { EmptyState, ErrorState, Loading, SignInPrompt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatPrice } from '@/utils/format';
import { ORDER_STATUS } from '@/utils/order';

function OrderRow({ order, slotLabel }: { order: Order; slotLabel: string }) {
  const colors = useTheme();
  const count = order.items.length;

  return (
    <Link href={{ pathname: '/order/[id]', params: { id: order.id } }} asChild>
      <Pressable style={StyleSheet.flatten([styles.row, { borderColor: colors.border }])}>
        <Text style={[styles.farm, { color: colors.text }]}>{order.farmer.farmName}</Text>
        <Text style={{ color: colors.textSecondary }}>
          {formatDate(order.deliveryDate)}, {slotLabel} · {count} {count === 1 ? 'item' : 'items'}
        </Text>
        <Text style={{ color: order.status === 'CANCELLED' ? colors.danger : colors.primary }}>
          {ORDER_STATUS[order.status]}
        </Text>
        <Text style={[styles.total, { color: colors.text }]}>{formatPrice(order.totalAmount)}</Text>
      </Pressable>
    </Link>
  );
}

export default function OrdersScreen() {
  const { signedIn } = useSession();
  const orders = useOrders();
  const slots = useSlots();
  useRefreshOnFocus(orders.refetch, signedIn === true);

  if (signedIn === null) return <Loading />;
  if (!signedIn) return <SignInPrompt message="Sign in to see your orders" />;
  if (orders.isPending) return <Loading />;
  if (orders.isError) return <ErrorState error={orders.error} onRetry={() => orders.refetch()} />;

  return (
    <FlatList
      data={orders.data.pages.flatMap((page) => page.items)}
      keyExtractor={(order) => order.id}
      renderItem={({ item }) => (
        <OrderRow
          order={item}
          slotLabel={slots.data?.slots.find(({ id }) => id === item.timeSlot)?.label ?? item.timeSlot}
        />
      )}
      ListEmptyComponent={<EmptyState message="You haven't ordered anything yet." />}
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
  list: { flexGrow: 1 },
  row: { padding: Spacing.three, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  farm: { fontSize: 17, fontWeight: '600' },
  total: { fontSize: 16, fontWeight: '600', marginTop: Spacing.one },
});
