import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Profile } from '@/api/types';
import { useSession } from '@/auth/session';
import { Button, ErrorState, Loading, SignInPrompt } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';
import { useTheme } from '@/hooks/use-theme';

const FARMER_STATUS: Record<Profile['farmerStatus'], string | null> = {
  NONE: null,
  PENDING: 'Farmer application under review',
  APPROVED: 'Approved farmer',
  REJECTED: 'Farmer application not approved',
};

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
    <View style={styles.screen}>
      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      {[phone, email, status].filter(Boolean).map((line) => (
        <Text key={line} style={[styles.line, { color: colors.textSecondary }]}>
          {line}
        </Text>
      ))}
      {farmerStatus === 'REJECTED' && farmer?.rejectionReason && (
        <Text style={[styles.line, { color: colors.danger }]}>{farmer.rejectionReason}</Text>
      )}
      <View style={styles.actions}>
        {canApply && (
          <Button
            label={farmerStatus === 'REJECTED' ? 'Apply again' : 'Become a farmer'}
            variant="plain"
            onPress={() => router.push('/farmer-application')}
          />
        )}
        {farmerStatus === 'APPROVED' && (
          <>
            <Button label="Farm orders" variant="plain" onPress={() => router.push('/farm-orders')} />
            <Button
              label="My products"
              variant="plain"
              onPress={() => router.push('/farm-products')}
            />
            <Button
              label="Farm details"
              variant="plain"
              onPress={() => router.push('/farm-details')}
            />
          </>
        )}
        <Button
          label="Saved addresses"
          variant="plain"
          onPress={() => router.push('/addresses')}
        />
        <Button
          label="Sign out"
          variant="plain"
          busy={signingOut}
          onPress={async () => {
            setSigningOut(true);
            await signOut().finally(() => setSigningOut(false));
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: Spacing.four, gap: Spacing.one },
  name: { fontSize: 24, fontWeight: '700', marginBottom: Spacing.two },
  line: { fontSize: 16 },
  actions: { marginTop: Spacing.four, alignItems: 'flex-start' },
});
