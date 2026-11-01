import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';
import { getCurrentCoords } from '@/utils/location';

export type Pin = { latitude: number; longitude: number };

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
      <Text style={[styles.title, { color: colors.text }]}>Farm location</Text>
      <Text style={{ color: colors.textSecondary }}>
        {pin
          ? `Saved: ${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`
          : 'Do this while you are at your farm, so nearby buyers can find you.'}
      </Text>
      {error && <Text style={{ color: colors.danger }}>{error}</Text>}
      <Button
        label={pin ? 'Use my location again' : 'Use my current location'}
        variant="plain"
        busy={locating}
        onPress={locate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: { gap: Spacing.one },
  title: { fontSize: 16, fontWeight: '600' },
});
