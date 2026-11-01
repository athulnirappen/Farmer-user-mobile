import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import {
  deleteAddress,
  makeDefaultAddress,
  useAddressAction,
  useAddresses,
} from '@/api/addresses';
import type { Address } from '@/api/types';
import { Text } from '@/components/text';
import { Button, Card, EmptyState, ErrorState, Loading, Pill } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addressIcon, addressLines } from '@/utils/address';
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
    <Card style={styles.row}>
      <View style={styles.head}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={addressIcon(address.label)} size={20} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {address.label ?? 'Address'}
        </Text>
        {address.isDefault && (
          <View>
            <Pill label="Default" tone="success" icon="checkmark" />
          </View>
        )}
      </View>

      <View style={[styles.address, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.line, { color: colors.text }]}>{address.line1}</Text>
        <Text style={{ color: colors.textSecondary }}>
          {addressLines({ ...address, line1: null })}
        </Text>
      </View>

      {action.isError && <Text style={{ color: colors.danger }}>{errorMessage(action.error)}</Text>}

      <View style={styles.actions}>
        {!address.isDefault && (
          <View style={styles.makeDefault}>
            <Button
              label="Make default"
              icon="checkmark-circle-outline"
              variant="soft"
              small
              disabled={action.isPending}
              onPress={() => action.mutate(() => makeDefaultAddress(address.id))}
            />
          </View>
        )}
        <Button
          label="Edit"
          icon="pencil-outline"
          variant="soft"
          small
          disabled={action.isPending}
          onPress={() => router.push({ pathname: '/address-form', params: { id: address.id } })}
        />
        <Button
          label="Delete"
          icon="trash-outline"
          variant="danger"
          small
          disabled={action.isPending}
          onPress={confirmDelete}
        />
      </View>
    </Card>
  );
}

export default function AddressesScreen() {
  const colors = useTheme();
  const addresses = useAddresses();

  if (addresses.isPending) return <Loading />;
  if (addresses.isError) {
    return <ErrorState error={addresses.error} onRetry={() => addresses.refetch()} />;
  }

  const count = addresses.data.length;

  return (
    <View style={styles.screen}>
      <FlatList
        data={addresses.data}
        keyExtractor={(address) => address.id}
        renderItem={({ item }) => <AddressRow address={item} />}
        ListHeaderComponent={
          count > 0 ? (
            <View style={styles.header}>
              <Text style={[styles.heading, { color: colors.text }]}>Saved locations</Text>
              <Pill
                label={`${count} ${count === 1 ? 'address' : 'addresses'}`}
                tone="success"
              />
            </View>
          ) : undefined
        }
        ListEmptyComponent={<EmptyState message="No saved addresses yet." icon="location-outline" />}
        contentContainerStyle={styles.list}
      />
      <View style={styles.footer}>
        <Button
          label="Add a new address"
          icon="add"
          onPress={() => router.push('/address-form')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { flexGrow: 1, padding: Spacing.three, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  heading: { fontSize: 24, fontFamily: Fonts.display },
  row: { padding: Spacing.three, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flexShrink: 1, fontSize: 21, fontFamily: Fonts.display },
  address: { padding: 14, gap: 2, borderRadius: Radius.small },
  line: { fontSize: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: Spacing.two },
  makeDefault: { flexBasis: '100%' },
  footer: { padding: Spacing.three },
});
