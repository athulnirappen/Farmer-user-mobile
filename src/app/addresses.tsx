import { router } from 'expo-router';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import {
  deleteAddress,
  makeDefaultAddress,
  useAddressAction,
  useAddresses,
} from '@/api/addresses';
import type { Address } from '@/api/types';
import { Button, EmptyState, ErrorState, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addressLines } from '@/utils/address';
import { errorMessage } from '@/utils/format';

function AddressRow({ address }: { address: Address }) {
  const colors = useTheme();
  const action = useAddressAction();

  const confirmDelete = () =>
    Alert.alert('Delete this address?', addressLines(address), [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => action.mutate(() => deleteAddress(address.id)),
      },
    ]);

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {address.label ?? 'Address'}
        {address.isDefault ? ' · Default' : ''}
      </Text>
      <Text style={{ color: colors.textSecondary }}>{addressLines(address)}</Text>
      {action.isError && <Text style={{ color: colors.danger }}>{errorMessage(action.error)}</Text>}
      <View style={styles.actions}>
        {!address.isDefault && (
          <Button
            label="Make default"
            variant="plain"
            disabled={action.isPending}
            onPress={() => action.mutate(() => makeDefaultAddress(address.id))}
          />
        )}
        <Button
          label="Edit"
          variant="plain"
          disabled={action.isPending}
          onPress={() => router.push({ pathname: '/address-form', params: { id: address.id } })}
        />
        <Button
          label="Delete"
          variant="plain"
          disabled={action.isPending}
          onPress={confirmDelete}
        />
      </View>
    </View>
  );
}

export default function AddressesScreen() {
  const addresses = useAddresses();

  if (addresses.isPending) return <Loading />;
  if (addresses.isError) {
    return <ErrorState error={addresses.error} onRetry={() => addresses.refetch()} />;
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={addresses.data}
        keyExtractor={(address) => address.id}
        renderItem={({ item }) => <AddressRow address={item} />}
        ListEmptyComponent={<EmptyState message="No saved addresses yet." />}
        contentContainerStyle={styles.list}
      />
      <View style={styles.footer}>
        <Button label="Add an address" onPress={() => router.push('/address-form')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flexGrow: 1 },
  row: { padding: Spacing.three, gap: Spacing.one, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 16, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap' },
  footer: { padding: Spacing.three },
});
