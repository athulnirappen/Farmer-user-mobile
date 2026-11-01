import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { makeDefaultAddress, useAddressAction, useAddresses, useSaveAddress } from '@/api/addresses';
import type { Address } from '@/api/types';
import { useSession } from '@/auth/session';
import { Text } from '@/components/text';
import {
  Banner,
  Button,
  Card,
  Chip,
  ErrorState,
  Field,
  IconBadge,
  type IconName,
  Loading,
} from '@/components/ui';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

const LABELS: { label: string; icon: IconName }[] = [
  { label: 'Home', icon: 'home-outline' },
  { label: 'Office', icon: 'business-outline' },
  { label: 'Farmhouse', icon: 'leaf-outline' },
];

function AddressForm({ address }: { address?: Address }) {
  const colors = useTheme();
  const { profile } = useSession();
  const save = useSaveAddress(address?.id);
  const action = useAddressAction();
  const [label, setLabel] = useState(address?.label ?? '');
  const [custom, setCustom] = useState(
    !!address?.label && !LABELS.some((option) => option.label === address.label)
  );
  const [line1, setLine1] = useState(address?.line1 ?? '');
  const [line2, setLine2] = useState(address?.line2 ?? '');
  const [city, setCity] = useState(address?.city ?? '');
  const [pincode, setPincode] = useState(address?.pincode ?? '');
  const [isDefault, setIsDefault] = useState(address?.isDefault ?? false);

  const valid = line1.trim().length >= 3 && city.trim().length >= 2 && /^\d{6}$/.test(pincode);
  const error = save.error ?? action.error;
  const busy = save.isPending || action.isPending;

  const submit = () =>
    save.mutate(
      {
        label: label.trim() || null,
        line1: line1.trim(),
        line2: line2.trim() || null,
        city: city.trim(),
        pincode,
      },
      {
        onSuccess: (saved) => {
          if (isDefault && !saved.isDefault) {
            action.mutate(() => makeDefaultAddress(saved.id), { onSuccess: () => router.back() });
          } else {
            router.back();
          }
        },
      }
    );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: address ? 'Edit address' : 'New address' }} />

        <View style={styles.group}>
          <Text style={[styles.label, { color: colors.text }]}>Address label (optional)</Text>
          <View style={styles.chips}>
            {LABELS.map((option) => (
              <Chip
                key={option.label}
                label={option.label}
                icon={option.icon}
                selected={!custom && label === option.label}
                onPress={() => {
                  setCustom(false);
                  setLabel(label === option.label ? '' : option.label);
                }}
              />
            ))}
            <Chip
              label="Other"
              icon="pricetag-outline"
              selected={custom}
              onPress={() => {
                setCustom(!custom);
                setLabel('');
              }}
            />
          </View>
          {custom && (
            <Field
              label="Label"
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Parents' house"
              maxLength={40}
            />
          )}
        </View>

        <Field
          label="House / street"
          value={line1}
          onChangeText={setLine1}
          autoComplete="street-address"
          placeholder="e.g. 12 Main Road"
          hint="Building name, floor or road details."
        />
        <Field
          label="Area or landmark (optional)"
          value={line2}
          onChangeText={setLine2}
          placeholder="e.g. Near the post office"
          hint="Helps the farmer find you."
        />
        <View style={styles.row}>
          <View style={styles.rowField}>
            <Field label="City" value={city} onChangeText={setCity} autoCapitalize="words" />
          </View>
          <View style={styles.rowField}>
            <Field
              label="Pincode"
              value={pincode}
              onChangeText={(value) => setPincode(value.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        </View>

        <Card style={styles.defaultCard}>
          <IconBadge icon="star-outline" size={48} />
          <View style={styles.defaultText}>
            <Text style={[styles.defaultTitle, { color: colors.text }]}>Set as default address</Text>
            <Text style={{ color: colors.textSecondary }}>Selected first at checkout</Text>
          </View>
          <Switch
            accessibilityLabel="Set as default address"
            value={isDefault}
            // A default can only be replaced by choosing another one
            disabled={address?.isDefault}
            onValueChange={setIsDefault}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.onHero}
          />
        </Card>

        {profile.data?.phone && (
          <Banner
            icon="call-outline"
            tone="success"
            title="Delivery contact"
            detail={`The farmer can reach you on ${profile.data.phone}. Pay in cash on delivery.`}
          />
        )}
        {error && <Text style={{ color: colors.danger }}>{errorMessage(error)}</Text>}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, boxShadow: colors.shadow }]}>
        <Button label="Cancel" variant="soft" disabled={busy} onPress={() => router.back()} />
        <View style={styles.saveButton}>
          <Button
            label="Save address"
            icon="checkmark-circle-outline"
            busy={busy}
            disabled={!valid}
            onPress={submit}
          />
        </View>
      </View>
    </View>
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
  screen: { flex: 1 },
  form: { padding: Spacing.three, gap: 18 },
  group: { gap: Spacing.two },
  label: { fontSize: 15, fontFamily: Fonts.semibold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.three },
  rowField: { flex: 1 },
  defaultCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  defaultText: { flex: 1, gap: 1 },
  defaultTitle: { fontSize: 16, fontFamily: Fonts.semibold },
  footer: { flexDirection: 'row', gap: 12, padding: Spacing.three },
  saveButton: { flex: 1 },
});
