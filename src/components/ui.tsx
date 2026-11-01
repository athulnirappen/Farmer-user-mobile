import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { type ComponentProps, type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  trailingIcon?: IconName;
  busy?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'plain' | 'soft' | 'danger';
  small?: boolean;
};

export function Button({
  label,
  onPress,
  icon,
  trailingIcon,
  busy,
  disabled,
  variant = 'primary',
  small,
}: ButtonProps) {
  const colors = useTheme();
  const { backgroundColor, color } = {
    primary: { backgroundColor: colors.primary, color: colors.onPrimary },
    plain: { backgroundColor: undefined, color: colors.primary },
    soft: { backgroundColor: colors.primarySoft, color: colors.primary },
    danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        {
          backgroundColor,
          boxShadow: variant === 'primary' && !disabled ? colors.buttonShadow : undefined,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 19} color={color} />}
          <Text style={[styles.buttonLabel, small && styles.buttonLabelSmall, { color }]}>
            {label}
          </Text>
          {trailingIcon && <Ionicons name={trailingIcon} size={19} color={color} />}
        </>
      )}
    </Pressable>
  );
}

export function Field({ label, hint, ...input }: TextInputProps & { label: string; hint?: string }) {
  const colors = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textSecondary}
        {...input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: focused ? colors.primary : colors.border,
            backgroundColor: colors.surface,
          },
          input.multiline && styles.inputMultiline,
        ]}
      />
      {hint && <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>}
    </View>
  );
}

// A Link with asChild can't take a style array, so this is a single flat object
export const useCardStyle = (): ViewStyle => {
  const colors = useTheme();
  return {
    ...styles.card,
    backgroundColor: colors.surface,
    boxShadow: colors.shadow,
  };
};

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const cardStyle = useCardStyle();
  return <View style={[cardStyle, style]}>{children}</View>;
}

export function GradientPanel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const colors = useTheme();

  return (
    <LinearGradient
      colors={[colors.heroStart, colors.heroEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.panel, style]}>
      {children}
    </LinearGradient>
  );
}

export function Eyebrow({ label, color }: { label: string; color?: string }) {
  const colors = useTheme();
  return (
    <Text style={[styles.eyebrow, { color: color ?? colors.accent }]} numberOfLines={1}>
      {label.toUpperCase()}
    </Text>
  );
}

export function Section({
  title,
  aside,
  card,
  children,
}: {
  title: string;
  aside?: string;
  card?: boolean;
  children: ReactNode;
}) {
  const colors = useTheme();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {aside && <Text style={[styles.sectionAside, { color: colors.accent }]}>{aside}</Text>}
      </View>
      {card ? <Card style={styles.sectionCard}>{children}</Card> : children}
    </View>
  );
}

export type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const useTone = (tone: Tone) => {
  const colors = useTheme();
  return {
    success: { backgroundColor: colors.primarySoft, color: colors.primary },
    warning: { backgroundColor: colors.warningSoft, color: colors.warning },
    danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
    neutral: { backgroundColor: colors.backgroundElement, color: colors.textSecondary },
  }[tone];
};

export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const { backgroundColor, color } = useTone(tone);

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      {icon && <Ionicons name={icon} size={13} color={color} />}
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
    </View>
  );
}

type BannerProps = {
  icon: IconName;
  title: string;
  detail?: string;
  tone?: Tone;
  action?: { label: string; onPress: () => void; disabled?: boolean };
};

export function Banner({ icon, title, detail, tone = 'warning', action }: BannerProps) {
  const colors = useTheme();
  const { backgroundColor, color } = useTone(tone);

  return (
    <View style={[styles.banner, { backgroundColor }]}>
      <Ionicons name={icon} size={22} color={color} />
      <View style={styles.bannerText}>
        <Text style={[styles.bannerTitle, { color }]}>{title}</Text>
        {detail && <Text style={[styles.bannerDetail, { color: colors.textSecondary }]}>{detail}</Text>}
      </View>
      {action && (
        <Pressable
          accessibilityRole="button"
          disabled={action.disabled}
          onPress={action.onPress}
          style={[styles.bannerAction, { backgroundColor: color }, action.disabled && styles.disabled]}>
          <Text style={[styles.bannerActionLabel, { color: backgroundColor }]}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function InfoRow({ icon, title, detail }: { icon: IconName; title: string; detail: string }) {
  const colors = useTheme();

  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.bannerText}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.bannerDetail, { color: colors.textSecondary }]}>{detail}</Text>
      </View>
    </View>
  );
}

type MenuRowProps = {
  icon: IconName;
  label: string;
  detail?: string;
  onPress: () => void;
  last?: boolean;
};

export function MenuRow({ icon, label, detail, onPress, last }: MenuRowProps) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.menuIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.bannerText}>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
        {detail && (
          <Text style={[styles.bannerDetail, { color: colors.textSecondary }]} numberOfLines={1}>
            {detail}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

type OptionProps = {
  title: string;
  detail?: string;
  icon?: IconName;
  badge?: string;
  selected: boolean;
  onPress: () => void;
};

export function Option({ title, detail, icon, badge, selected, onPress }: OptionProps) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        {
          borderColor: selected ? colors.primary : 'transparent',
          backgroundColor: selected ? colors.primarySoft : colors.surface,
        },
      ]}>
      {icon && (
        <View style={[styles.menuIcon, styles.round, { backgroundColor: selected ? colors.surface : colors.primarySoft }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
      )}
      <View style={styles.optionText}>
        <View style={styles.optionTitleRow}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>
          {badge && <Pill label={badge} tone="success" />}
        </View>
        {detail && <Text style={{ color: colors.textSecondary }}>{detail}</Text>}
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={selected ? colors.primary : colors.textSecondary}
      />
    </Pressable>
  );
}

type SegmentedProps<T> = {
  options: { value: T; label: string; icon: IconName }[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const colors = useTheme();

  return (
    <View style={[styles.segmented, { backgroundColor: colors.primarySoft }]}>
      {options.map((option) => {
        const selected = option.value === value;
        const color = selected ? colors.onPrimary : colors.text;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: colors.primary }]}>
            <Ionicons name={option.icon} size={18} color={color} />
            <Text style={[styles.chipLabel, { color }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
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
        { backgroundColor: colors.surface },
        (disabled || !allowed) && styles.disabled,
      ]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </Pressable>
  );

  return (
    <View style={[styles.stepper, { backgroundColor: colors.primarySoft }]}>
      {step('Decrease quantity', 'remove', value - 1, value > 1)}
      <Text style={[styles.stepValue, { color: colors.text }]}>{value}</Text>
      {step('Increase quantity', 'add', value + 1, value < max)}
    </View>
  );
}

type ChipProps = {
  label: string;
  selected: boolean;
  icon?: IconName;
  busy?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, icon, busy, onPress }: ChipProps) {
  const colors = useTheme();
  const color = selected ? colors.onPrimary : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.primarySoft }]}>
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        icon && <Ionicons name={icon} size={16} color={color} />
      )}
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

type IconBadgeProps = { icon: IconName; size?: number; onDark?: boolean };

export function IconBadge({ icon, size = 72, onDark }: IconBadgeProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.iconBadge,
        { width: size, height: size, backgroundColor: onDark ? colors.accentBright : colors.primarySoft },
      ]}>
      <Ionicons name={icon} size={size / 2} color={onDark ? colors.heroStart : colors.primary} />
    </View>
  );
}

export function SignInPrompt({ message, icon = 'person-outline' }: { message: string; icon?: IconName }) {
  const colors = useTheme();

  return (
    <Centered>
      <IconBadge icon={icon} />
      <Text style={[styles.lead, { color: colors.text }]}>{message}</Text>
      <View style={styles.action}>
        <Button label="Sign in" onPress={() => router.push('/sign-in')} />
      </View>
    </Centered>
  );
}

export function Centered({ children }: { children: ReactNode }) {
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
      <IconBadge icon="cloud-offline-outline" />
      <Text style={[styles.message, { color: colors.textSecondary }]}>{errorMessage(error)}</Text>
      <Button label="Try again" variant="plain" onPress={onRetry} />
    </Centered>
  );
}

export function EmptyState({ message, icon = 'leaf-outline' }: { message: string; icon?: IconName }) {
  const colors = useTheme();
  return (
    <Centered>
      <IconBadge icon={icon} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </Centered>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: Spacing.two,
    minHeight: 54,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  buttonSmall: { minHeight: 44, paddingHorizontal: 18 },
  buttonLabel: { fontSize: 16, fontFamily: Fonts.semibold, letterSpacing: 0.2 },
  buttonLabelSmall: { fontSize: 14 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  field: { gap: Spacing.two },
  fieldLabel: { fontSize: 14, fontFamily: Fonts.medium },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontFamily: Fonts.body,
  },
  inputMultiline: { minHeight: 96, paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' },
  hint: { fontSize: 13, lineHeight: 18 },
  card: { borderRadius: Radius.large },
  panel: { borderRadius: Radius.large, padding: Spacing.four },
  eyebrow: { fontSize: 11, fontFamily: Fonts.bold, letterSpacing: 1.2 },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  sectionTitle: { flexShrink: 1, fontSize: 20, fontFamily: Fonts.display },
  sectionAside: { fontSize: 13, fontFamily: Fonts.medium },
  sectionCard: { padding: Spacing.three, gap: Spacing.two },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.round,
  },
  pillLabel: { fontSize: 12, fontFamily: Fonts.semibold },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.medium,
  },
  bannerText: { flex: 1, gap: 1 },
  bannerTitle: { fontSize: 15, fontFamily: Fonts.semibold },
  bannerDetail: { fontSize: 13, lineHeight: 18 },
  bannerAction: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.round },
  bannerActionLabel: { fontSize: 13, fontFamily: Fonts.semibold },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { fontSize: 15, fontFamily: Fonts.semibold },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 68,
    paddingHorizontal: Spacing.three,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  round: { borderRadius: Radius.round },
  menuLabel: { fontSize: 16, fontFamily: Fonts.medium },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  message: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  lead: { fontSize: 19, fontFamily: Fonts.display, textAlign: 'center' },
  action: { alignSelf: 'stretch' },
  iconBadge: { borderRadius: Radius.round, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: Radius.round,
  },
  chipLabel: { fontSize: 14, fontFamily: Fonts.medium },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    padding: 14,
    borderWidth: 1,
    borderRadius: Radius.large,
  },
  optionText: { flex: 1, gap: 2 },
  optionTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  optionTitle: { fontSize: 16, fontFamily: Fonts.semibold },
  segmented: { flexDirection: 'row', padding: Spacing.one, borderRadius: Radius.round },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    borderRadius: Radius.round,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.one,
    borderRadius: Radius.round,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 30, fontSize: 17, fontFamily: Fonts.semibold, textAlign: 'center' },
});
