import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useUpdateFarmLocation } from '@/api/farmer';
import { useSlots } from '@/api/orders';
import type { Profile } from '@/api/types';
import { useSession } from '@/auth/session';
import { type Pin, PinPicker } from '@/components/pin-picker';
import { Text } from '@/components/text';
import { Button, Card, ErrorState, Eyebrow, Field, Loading, Pill } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

function FarmDetailsForm({ farmer }: { farmer: NonNullable<Profile['farmer']> }) {
  const colors = useTheme();
  const update = useUpdateFarmLocation();
  const slots = useSlots();
  const [farmLocation, setFarmLocation] = useState(farmer.farmLocation ?? '');
  const [pin, setPin] = useState<Pin | null>(
    farmer.latitude != null && farmer.longitude != null
      ? { latitude: farmer.latitude, longitude: farmer.longitude }
      : null
  );

  const address = farmLocation.trim();
  const addressChanged = address !== (farmer.farmLocation ?? '');
  const pinChanged = pin?.latitude !== farmer.latitude || pin?.longitude !== farmer.longitude;

  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Card style={styles.head}>
        <Pill label="Approved farmer" tone="success" icon="checkmark-circle-outline" />
        <Text style={[styles.name, { color: colors.text }]}>{farmer.farmName}</Text>
      </Card>

      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Farm name</Text>
        <View style={[styles.locked, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="storefront-outline" size={19} color={colors.text} />
          <Text style={[styles.lockedName, { color: colors.text }]} numberOfLines={1}>
            {farmer.farmName}
          </Text>
          <Ionicons name="lock-closed-outline" size={17} color={colors.textSecondary} />
        </View>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          The farm name can&apos;t be changed here.
        </Text>
      </View>

      <Field
        label="Farm address"
        value={farmLocation}
        onChangeText={setFarmLocation}
        autoCapitalize="words"
        multiline
        maxLength={300}
        hint="Shown to buyers who choose to pick up from the farm."
      />
      <PinPicker pin={pin} onChange={setPin} />

      {!!slots.data?.slots.length && (
        <Card style={styles.pickup}>
          <Text style={[styles.pickupTitle, { color: colors.text }]}>Pickup times</Text>
          <Text style={{ color: colors.textSecondary }}>
            Have orders ready for the slot each buyer chose.
          </Text>
          <View style={styles.slots}>
            {slots.data.slots.map(({ id, label }) => (
              <View key={id} style={[styles.slot, { backgroundColor: colors.primarySoft }]}>
                <Eyebrow label={label} color={colors.text} />
              </View>
            ))}
          </View>
          <View style={styles.cash}>
            <Ionicons name="cash-outline" size={18} color={colors.accent} />
            <Text style={{ color: colors.textSecondary }}>Buyers pay you in cash</Text>
          </View>
        </Card>
      )}

      {update.isError && <Text style={{ color: colors.danger }}>{errorMessage(update.error)}</Text>}
      <Button
        label="Save changes"
        icon="save-outline"
        busy={update.isPending}
        disabled={address.length < 2 || !(addressChanged || pinChanged)}
        onPress={() =>
          update.mutate(
            { ...(addressChanged && { farmLocation: address }), ...(pinChanged && pin) },
            { onSuccess: () => router.back() }
          )
        }
      />
      <Button label="Cancel" variant="plain" onPress={() => router.back()} />
    </ScrollView>
  );
}

export default function FarmDetailsScreen() {
  const { profile } = useSession();

  if (profile.isPending) return <Loading />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;
  if (!profile.data.farmer) return null;

  return <FarmDetailsForm farmer={profile.data.farmer} />;
}

const styles = StyleSheet.create({
  form: { padding: Spacing.three, gap: 18 },
  head: { padding: Spacing.three, gap: Spacing.two },
  name: { fontSize: 28, lineHeight: 34, fontFamily: Fonts.display },
  group: { gap: Spacing.two },
  label: { fontSize: 14, fontFamily: Fonts.medium },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
  },
  lockedName: { flex: 1, fontSize: 16 },
  hint: { fontSize: 13, lineHeight: 18 },
  pickup: { padding: Spacing.three, gap: Spacing.two },
  pickupTitle: { fontSize: 20, fontFamily: Fonts.display },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  slot: { flexGrow: 1, alignItems: 'center', padding: 12, borderRadius: Radius.small },
  cash: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
