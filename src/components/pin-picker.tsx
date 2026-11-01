import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Banner, Button, GradientPanel } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';
import { getCurrentCoords } from '@/utils/location';

export type Pin = { latitude: number; longitude: number };

const formatPin = ({ latitude, longitude }: Pin) =>
  `${Math.abs(latitude).toFixed(4)}° ${latitude < 0 ? 'S' : 'N'}, ` +
  `${Math.abs(longitude).toFixed(4)}° ${longitude < 0 ? 'W' : 'E'}`;

export function PinPicker({ pin, onChange }: { pin: Pin | null; onChange: (pin: Pin) => void }) {
  const colors = useTheme();
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string>();

  const locate = async () => {
    setLocating(true);
    setError(undefined);
    try {
      const { latitude, longitude } = await getCurrentCoords();
      onChange({ latitude, longitude });
    } catch (locationError) {
      setError(errorMessage(locationError));
    } finally {
      setLocating(false);
    }
  };

  return (
    <View style={styles.pin}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Farm location</Text>
      {pin ? (
        <GradientPanel style={styles.saved}>
          <View style={styles.savedRow}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.onHero} />
            <View style={styles.savedText}>
              <Text style={[styles.coords, { color: colors.onHero }]}>{formatPin(pin)}</Text>
              <Text style={[styles.savedDetail, { color: colors.onHeroMuted }]}>Location saved</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: locating }}
            disabled={locating}
            onPress={locate}
            style={styles.again}>
            {locating ? (
              <ActivityIndicator color={colors.onHero} />
            ) : (
              <>
                <Ionicons name="navigate-outline" size={18} color={colors.onHero} />
                <Text style={[styles.againLabel, { color: colors.onHero }]}>
                  Use my location again
                </Text>
              </>
            )}
          </Pressable>
        </GradientPanel>
      ) : (
        <Button
          label="Use my current location"
          icon="navigate-outline"
          variant="soft"
          busy={locating}
          onPress={locate}
        />
      )}
      {error && <Text style={{ color: colors.danger }}>{error}</Text>}
      <Banner
        icon="information-circle-outline"
        tone="neutral"
        title="Do this while you are at your farm"
        detail="So nearby buyers can find you."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: { gap: Spacing.two },
  title: { fontSize: 14, fontFamily: Fonts.medium },
  saved: { padding: Spacing.three, gap: 12 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  savedText: { flex: 1 },
  coords: { fontSize: 18, fontFamily: Fonts.semibold },
  savedDetail: { fontSize: 13 },
  again: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 46,
    borderRadius: Radius.small,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  againLabel: { fontSize: 15, fontFamily: Fonts.semibold },
});
