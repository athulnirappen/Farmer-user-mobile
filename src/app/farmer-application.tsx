import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useApplyAsFarmer } from '@/api/farmer';
import { useSession } from '@/auth/session';
import { type Pin, PinPicker } from '@/components/pin-picker';
import { Button, ErrorState, Field, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

type Previous = { farmName: string; farmLocation: string | null; pin: Pin | null };

function ApplicationForm({ previous }: { previous?: Previous }) {
  const colors = useTheme();
  const apply = useApplyAsFarmer();
  const [farmName, setFarmName] = useState(previous?.farmName ?? '');
  const [farmLocation, setFarmLocation] = useState(previous?.farmLocation ?? '');
  const [pin, setPin] = useState(previous?.pin ?? null);
  const valid = farmName.trim().length >= 2 && farmLocation.trim().length >= 2 && pin !== null;

  return (
    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
      <Field label="Farm name" value={farmName} onChangeText={setFarmName} autoCapitalize="words" />
      <Field
        label="Farm address, shown to buyers who pick up"
        value={farmLocation}
        onChangeText={setFarmLocation}
        autoCapitalize="words"
        maxLength={300}
      />

      <PinPicker pin={pin} onChange={setPin} />

      {apply.isError && <Text style={{ color: colors.danger }}>{errorMessage(apply.error)}</Text>}
      <Button
        label="Send application"
        busy={apply.isPending}
        disabled={!valid}
        onPress={() => {
          if (!pin) return;
          apply.mutate(
            { farmName: farmName.trim(), farmLocation: farmLocation.trim(), ...pin },
            { onSuccess: () => router.back() }
          );
        }}
      />
    </ScrollView>
  );
}

export default function FarmerApplicationScreen() {
  const { profile } = useSession();

  if (profile.isPending) return <Loading />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;

  // Someone applying again starts from what they sent last time
  const farmer = profile.data.farmer;
  const pin =
    farmer?.latitude != null && farmer.longitude != null
      ? { latitude: farmer.latitude, longitude: farmer.longitude }
      : null;

  return <ApplicationForm previous={farmer ? { ...farmer, pin } : undefined} />;
}

const styles = StyleSheet.create({
  form: { padding: Spacing.four, gap: Spacing.three },
});
