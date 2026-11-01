import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useUpdateFarmLocation } from '@/api/farmer';
import type { Profile } from '@/api/types';
import { useSession } from '@/auth/session';
import { type Pin, PinPicker } from '@/components/pin-picker';
import { Button, ErrorState, Field, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

function FarmDetailsForm({ farmer }: { farmer: NonNullable<Profile['farmer']> }) {
  const colors = useTheme();
  const update = useUpdateFarmLocation();
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
      <Text style={[styles.name, { color: colors.text }]}>{farmer.farmName}</Text>
      <Field
        label="Farm address, shown to buyers who pick up"
        value={farmLocation}
        onChangeText={setFarmLocation}
        autoCapitalize="words"
        maxLength={300}
      />
      <PinPicker pin={pin} onChange={setPin} />
      {update.isError && <Text style={{ color: colors.danger }}>{errorMessage(update.error)}</Text>}
      <Button
        label="Save"
        busy={update.isPending}
        disabled={address.length < 2 || !(addressChanged || pinChanged)}
        onPress={() =>
          update.mutate(
            { ...(addressChanged && { farmLocation: address }), ...(pinChanged && pin) },
            { onSuccess: () => router.back() }
          )
        }
      />
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
  form: { padding: Spacing.four, gap: Spacing.three },
  name: { fontSize: 22, fontWeight: '700' },
});
