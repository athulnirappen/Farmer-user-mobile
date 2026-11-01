import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

type ButtonProps = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'plain';
};

export function Button({ label, onPress, busy, disabled, variant = 'primary' }: ButtonProps) {
  const colors = useTheme();
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary && { backgroundColor: colors.primary },
        (pressed || disabled) && styles.dimmed,
      ]}>
      {busy ? (
        <ActivityIndicator color={primary ? colors.onPrimary : colors.primary} />
      ) : (
        <Text style={[styles.buttonLabel, { color: primary ? colors.onPrimary : colors.primary }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...input }: TextInputProps & { label: string }) {
  const colors = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        {...input}
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      />
    </View>
  );
}

type OptionProps = {
  title: string;
  detail?: string;
  selected: boolean;
  onPress: () => void;
};

export function Option({ title, detail, selected, onPress }: OptionProps) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, { borderColor: selected ? colors.primary : colors.border }]}>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
        color={selected ? colors.primary : colors.textSecondary}
      />
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
        {detail && <Text style={{ color: colors.textSecondary }}>{detail}</Text>}
      </View>
    </Pressable>
  );
}

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  max: number;
  disabled?: boolean;
};

export function Stepper({ value, onChange, max, disabled }: StepperProps) {
  const colors = useTheme();
  const step = (label: string, icon: 'remove' | 'add', next: number, allowed: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || !allowed}
      onPress={() => onChange(next)}
      hitSlop={6}
      style={[
        styles.step,
        { backgroundColor: colors.backgroundElement },
        (disabled || !allowed) && styles.dimmed,
      ]}>
      <Ionicons name={icon} size={20} color={colors.text} />
    </Pressable>
  );

  return (
    <View style={styles.stepper}>
      {step('Decrease quantity', 'remove', value - 1, value > 1)}
      <Text style={[styles.stepValue, { color: colors.text }]}>{value}</Text>
      {step('Increase quantity', 'add', value + 1, value < max)}
    </View>
  );
}

type ChipProps = {
  label: string;
  selected: boolean;
  busy?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, busy, onPress }: ChipProps) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.backgroundElement }]}>
      {busy && <ActivityIndicator size="small" color={colors.primary} />}
      <Text style={{ color: selected ? colors.onPrimary : colors.text }}>{label}</Text>
    </Pressable>
  );
}

export function SignInPrompt({ message }: { message: string }) {
  const colors = useTheme();

  return (
    <Centered>
      <Text style={[styles.lead, { color: colors.text }]}>{message}</Text>
      <View style={styles.action}>
        <Button label="Sign in" onPress={() => router.push('/sign-in')} />
      </View>
    </Centered>
  );
}

export function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

export function Loading() {
  const colors = useTheme();
  return (
    <Centered>
      <ActivityIndicator size="large" color={colors.primary} />
    </Centered>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const colors = useTheme();
  return (
    <Centered>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{errorMessage(error)}</Text>
      <Button label="Try again" variant="plain" onPress={onRetry} />
    </Centered>
  );
}

export function EmptyState({ message }: { message: string }) {
  const colors = useTheme();
  return (
    <Centered>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </Centered>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  buttonLabel: { fontSize: 16, fontWeight: '600' },
  dimmed: { opacity: 0.6 },
  field: { gap: Spacing.one },
  fieldLabel: { fontSize: 14 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  message: { fontSize: 15, textAlign: 'center' },
  lead: { fontSize: 18, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 38,
    paddingHorizontal: Spacing.three,
    borderRadius: 19,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 52,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: 10,
  },
  optionText: { flex: 1, gap: 2 },
  optionTitle: { fontSize: 16, fontWeight: '500' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 32, fontSize: 17, fontWeight: '600', textAlign: 'center' },
});
