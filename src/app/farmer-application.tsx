import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useApplyAsFarmer } from '@/api/farmer';
import { useSession } from '@/auth/session';
import { Text } from '@/components/text';
import { type Pin, PinPicker } from '@/components/pin-picker';
import {
  Button,
  Card,
  ErrorState,
  Eyebrow,
  Field,
  IconBadge,
  Loading,
  Section,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

const STEPS = [
  { title: 'Tell us about your farm', detail: 'Its name, address and location.' },
  { title: 'We review your application', detail: 'You can follow it from your account.' },
  { title: 'List your products', detail: 'Once approved, add what you have to sell.' },
];

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
      <View style={[styles.intro, { backgroundColor: colors.primarySoft }]}>
        <View style={styles.introIcon}>
          <IconBadge icon="leaf" size={52} onDark />
        </View>
        <Eyebrow label="For farmers" />
        <Text style={[styles.title, { color: colors.text }]}>Sell from your farm</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Reach buyers near you. They order today for tomorrow and pay you in cash.
        </Text>
      </View>

      <Section title="How it works">
        <Card style={styles.steps}>
          {STEPS.map(({ title, detail }, index) => (
            <View key={title} style={styles.step}>
              <View style={[styles.number, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.numberLabel, { color: colors.accent }]}>{index + 1}</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
                <Text style={{ color: colors.textSecondary }}>{detail}</Text>
              </View>
            </View>
          ))}
        </Card>
      </Section>

      <Field
        label="Farm name"
        value={farmName}
        onChangeText={setFarmName}
        autoCapitalize="words"
        hint="Buyers see this name on your products."
      />
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

      {apply.isError && <Text style={{ color: colors.danger }}>{errorMessage(apply.error)}</Text>}
      <Button
        label="Send application"
        trailingIcon="arrow-forward"
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
  form: { padding: Spacing.three, gap: Spacing.four - 4 },
  intro: { gap: Spacing.two, padding: Spacing.four, borderRadius: Radius.large },
  introIcon: { marginBottom: Spacing.one },
  title: { fontSize: 30, lineHeight: 36, fontFamily: Fonts.display },
  tagline: { fontSize: 15, lineHeight: 22 },
  steps: { padding: Spacing.three, gap: Spacing.three },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  number: {
    width: 34,
    height: 34,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberLabel: { fontSize: 15, fontFamily: Fonts.bold },
  stepText: { flex: 1, gap: 1 },
  stepTitle: { fontSize: 16, fontFamily: Fonts.semibold },
});
