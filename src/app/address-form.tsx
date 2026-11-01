import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useAddresses, useSaveAddress } from '@/api/addresses';
import type { Address } from '@/api/types';
import { Button, ErrorState, Field, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

function AddressForm({ address }: { address?: Address }) {
  const colors = useTheme();
  const save = useSaveAddress(address?.id);
  const [label, setLabel] = useState(address?.label ?? '');
  const [line1, setLine1] = useState(address?.line1 ?? '');
  const [line2, setLine2] = useState(address?.line2 ?? '');
  const [city, setCity] = useState(address?.city ?? '');
  const [pincode, setPincode] = useState(address?.pincode ?? '');

  const valid = line1.trim().length >= 3 && city.trim().length >= 2 && /^\d{6}$/.test(pincode);

  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: address ? 'Edit address' : 'New address' }} />
      <Field label="House / street" value={line1} onChangeText={setLine1} autoComplete="street-address" />
      <Field label="Area or landmark (optional)" value={line2} onChangeText={setLine2} />
      <Field label="City" value={city} onChangeText={setCity} autoCapitalize="words" />
      <Field
        label="Pincode"
        value={pincode}
        onChangeText={(value) => setPincode(value.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={6}
      />
      <Field label="Label, e.g. Home (optional)" value={label} onChangeText={setLabel} maxLength={40} />
      {save.isError && <Text style={{ color: colors.danger }}>{errorMessage(save.error)}</Text>}
      <Button
        label="Save address"
        busy={save.isPending}
        disabled={!valid}
        onPress={() =>
          save.mutate(
            {
              label: label.trim() || null,
              line1: line1.trim(),
              line2: line2.trim() || null,
              city: city.trim(),
              pincode,
            },
            { onSuccess: () => router.back() }
          )
        }
      />
    </ScrollView>
  );
}

export default function AddressFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const addresses = useAddresses();

  if (!id) return <AddressForm />;
  if (addresses.isPending) return <Loading />;
  if (addresses.isError) {
    return <ErrorState error={addresses.error} onRetry={() => addresses.refetch()} />;
  }

  return <AddressForm address={addresses.data.find((address) => address.id === id)} />;
}

const styles = StyleSheet.create({
  form: { padding: Spacing.four, gap: Spacing.three },
});
