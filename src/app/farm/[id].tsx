import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { publicApi } from '@/api/client';
import type { Farm } from '@/api/types';
import { ProductList } from '@/components/product-list';
import { ErrorState, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function FarmScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useTheme();
  const farm = useQuery({
    queryKey: ['farm', id],
    queryFn: () => publicApi<Farm>(`/farmers/${id}`),
  });

  if (farm.isPending) return <Loading />;
  if (farm.isError) return <ErrorState error={farm.error} onRetry={() => farm.refetch()} />;

  return (
    <>
      <Stack.Screen options={{ title: farm.data.farmName }} />
      <ProductList
        filter={{ farmId: id }}
        emptyMessage="This farm has no products listed right now."
        header={
          <View style={styles.header}>
            <Text style={[styles.name, { color: colors.text }]}>{farm.data.farmName}</Text>
            {farm.data.farmLocation && (
              <Text style={[styles.location, { color: colors.textSecondary }]}>
                {farm.data.farmLocation}
              </Text>
            )}
          </View>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { padding: Spacing.three, gap: Spacing.one },
  name: { fontSize: 24, fontWeight: '700' },
  location: { fontSize: 16 },
});
