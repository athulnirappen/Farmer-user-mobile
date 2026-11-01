import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { requestRegistrationOtp, startAuth, verifyOtp } from '@/api/client';
import { useSession } from '@/auth/session';
import { Button, Field } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

type Step = 'phone' | 'register' | 'code';

// Ten digits means an Indian number; anything else must already carry its country code
const toE164 = (input: string) => {
  const cleaned = input.replace(/[\s-]/g, '');
  return /^\d{10}$/.test(cleaned) ? `+91${cleaned}` : cleaned;
};

export default function SignInScreen() {
  const colors = useTheme();
  const { onSignedIn } = useSession();
  const [step, setStep] = useState<Step>('phone');
  const [flow, setFlow] = useState<'login' | 'register'>('login');
  const [phoneInput, setPhoneInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string>();
  const phone = toE164(phoneInput);

  const start = useMutation({
    mutationFn: () => startAuth(phone),
    onSuccess: ({ nextStep }) => {
      setFlow(nextStep === 'REGISTER' ? 'register' : 'login');
      setStep(nextStep === 'REGISTER' ? 'register' : 'code');
    },
  });

  const register = useMutation({
    mutationFn: () => requestRegistrationOtp({ phone, name: name.trim(), email: email.trim() }),
    onSuccess: () => setStep('code'),
  });

  const verify = useMutation({
    mutationFn: () => verifyOtp(flow, phone, code),
    onSuccess: () => {
      onSignedIn();
      router.back();
    },
  });

  const resend = useMutation({
    mutationFn: async () => {
      if (flow === 'register') await requestRegistrationOtp({ phone, name: name.trim(), email: email.trim() });
      else await startAuth(phone);
    },
    onMutate: () => setNotice(undefined),
    onSuccess: () => setNotice('A new code is on its way.'),
  });

  const error = start.error ?? register.error ?? verify.error ?? resend.error;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {step === 'phone' && (
          <>
            <Field
              label="Mobile number"
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
              autoComplete="tel"
              autoFocus
              placeholder="98765 43210"
            />
            <Button
              label="Continue"
              busy={start.isPending}
              disabled={phone.length < 9}
              onPress={() => start.mutate()}
            />
          </>
        )}

        {step === 'register' && (
          <>
            <Text style={[styles.intro, { color: colors.text }]}>
              New here? Tell us who you are.
            </Text>
            <Field
              label="Your name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              autoCapitalize="words"
              autoFocus
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
            />
            <Button
              label="Send code"
              busy={register.isPending}
              disabled={name.trim().length < 2 || !email.includes('@')}
              onPress={() => register.mutate()}
            />
          </>
        )}

        {step === 'code' && (
          <>
            <Text style={[styles.intro, { color: colors.text }]}>
              Enter the 6-digit code sent to {phone}
            </Text>
            <Field
              label="Verification code"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              maxLength={6}
              autoFocus
            />
            <Button
              label="Verify"
              busy={verify.isPending}
              disabled={code.length !== 6}
              onPress={() => verify.mutate()}
            />
            <Button
              label="Send a new code"
              variant="plain"
              busy={resend.isPending}
              onPress={() => resend.mutate()}
            />
          </>
        )}

        {notice && !error && (
          <Text style={[styles.message, { color: colors.textSecondary }]}>{notice}</Text>
        )}
        {error && (
          <Text style={[styles.message, { color: colors.danger }]}>{errorMessage(error)}</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  form: { padding: Spacing.four, gap: Spacing.three },
  intro: { fontSize: 17 },
  message: { fontSize: 15 },
});
