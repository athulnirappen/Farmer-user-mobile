import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { FarmerStatus } from '@/api/types';
import { useSession } from '@/auth/session';
import { Text } from '@/components/text';
import {
  Button,
  Card,
  ErrorState,
  Eyebrow,
  IconBadge,
  Loading,
  MenuRow,
  Pill,
  SignInPrompt,
  type Tone,
} from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';

const FARMER_STATUS: Record<
  FarmerStatus,
  { title: string; detail: string; pill: string; tone: Tone } | null
> = {
  NONE: null,
  PENDING: {
    title: 'Application under review',
    detail: "You'll see the result here once it's reviewed.",
    pill: 'In review',
    tone: 'warning',
  },
  APPROVED: {
    title: 'Approved farmer',
    detail: 'You can list products and take orders.',
    pill: 'Approved',
    tone: 'success',
  },
  REJECTED: {
    title: 'Application not approved',
    detail: 'You can change your details and apply again.',
    pill: 'Not approved',
    tone: 'danger',
  },
};

const initials = (name: string | null) =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

export default function AccountScreen() {
  const colors = useTheme();
  const { signedIn, profile, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  useRefreshOnFocus(profile.refetch, signedIn === true);

  if (signedIn === null) return <Loading />;

  if (!signedIn) return <SignInPrompt message="Sign in to order from local farmers" />;

  if (profile.isPending) return <Loading />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;

  const { name, phone, email, farmerStatus, farmer } = profile.data;
  const status = FARMER_STATUS[farmerStatus];
  const canApply = farmerStatus === 'NONE' || farmerStatus === 'REJECTED';

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card style={styles.profile}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.initial, { color: colors.primary }]}>{initials(name)}</Text>
        </View>
        <View style={styles.identity}>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          {phone && <Text style={[styles.contact, { color: colors.text }]}>{phone}</Text>}
          {email && <Text style={{ color: colors.textSecondary }}>{email}</Text>}
        </View>
      </Card>

      {status && (
        <View style={styles.group}>
          <Eyebrow label="Farmer status" color={colors.textSecondary} />
          <Card style={styles.status}>
            <View style={styles.statusHead}>
              <Text style={[styles.statusTitle, { color: colors.text }]}>{status.title}</Text>
              <Pill label={status.pill} tone={status.tone} />
            </View>
            <Text style={{ color: colors.textSecondary }}>{status.detail}</Text>
            {farmerStatus === 'REJECTED' && farmer?.rejectionReason && (
              <Text style={{ color: colors.danger }}>{farmer.rejectionReason}</Text>
            )}
          </Card>
        </View>
      )}

      {canApply && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/farmer-application')}
          style={({ pressed }) => pressed && styles.pressed}>
          <Card style={styles.invite}>
            <IconBadge icon="leaf" size={48} />
            <View style={styles.inviteText}>
              <Eyebrow label="Grow with us" />
              <Text style={[styles.inviteTitle, { color: colors.text }]}>
                {farmerStatus === 'REJECTED' ? 'Apply again' : 'Become a farmer'}
              </Text>
              <Text style={{ color: colors.textSecondary }}>Sell to buyers near you</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </Card>
        </Pressable>
      )}

      {farmerStatus === 'APPROVED' && (
        <View style={styles.group}>
          <Eyebrow label="Your farm" color={colors.textSecondary} />
          <Card>
            <MenuRow
              icon="receipt-outline"
              label="Farm orders"
              detail="Today's and tomorrow's orders"
              onPress={() => router.push('/farm-orders')}
            />
            <MenuRow
              icon="basket-outline"
              label="My products"
              detail="Listings, stock and photos"
              onPress={() => router.push('/farm-products')}
            />
            <MenuRow
              icon="location-outline"
              label="Farm details"
              detail={farmer?.farmName}
              onPress={() => router.push('/farm-details')}
              last
            />
          </Card>
        </View>
      )}

      <View style={styles.group}>
        <Eyebrow label="Your account" color={colors.textSecondary} />
        <Card>
          <MenuRow
            icon="home-outline"
            label="Saved addresses"
            detail="Where your orders are delivered"
            onPress={() => router.push('/addresses')}
            last
          />
        </Card>
      </View>

      <Button
        label="Sign out"
        icon="log-out-outline"
        variant="danger"
        busy={signingOut}
        onPress={async () => {
          setSigningOut(true);
          await signOut().finally(() => setSigningOut(false));
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: Spacing.three, gap: 20 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: 18 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 26, fontFamily: Fonts.display },
  identity: { flex: 1, gap: 1 },
  name: { fontSize: 24, lineHeight: 30, fontFamily: Fonts.display },
  contact: { fontSize: 15 },
  group: { gap: 10 },
  status: { padding: Spacing.three, gap: Spacing.one },
  statusHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  statusTitle: { flexShrink: 1, fontSize: 18, fontFamily: Fonts.semibold },
  pressed: { opacity: 0.7 },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: Spacing.three },
  inviteText: { flex: 1, gap: 2 },
  inviteTitle: { fontSize: 20, fontFamily: Fonts.display },
});
