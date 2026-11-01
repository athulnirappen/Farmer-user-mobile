import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ComponentRef, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { requestRegistrationOtp, startAuth, verifyOtp } from '@/api/client';
import { useSession } from '@/auth/session';
import { Text } from '@/components/text';
import { Button, Card, Eyebrow, Field, IconBadge } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useCountdown } from '@/hooks/use-countdown';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/utils/format';

type Step = 'phone' | 'register' | 'code';

const CODE_LENGTH = 6;
// The API's own limits; it doesn't send them, so these only drive what's shown
const CODE_LIFETIME_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 60;

// Ten digits means an Indian number; anything else must already carry its country code
const toE164 = (input: string) => {
  const cleaned = input.replace(/[\s-]/g, '');
  return /^\d{10}$/.test(cleaned) ? `+91${cleaned}` : cleaned;
};

const formatClock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

function Steps({ step, flow }: { step: Step; flow: 'login' | 'register' }) {
  const colors = useTheme();
  // Only someone new sees the details step, so nobody is told about one they'll skip
  const steps = [
    { id: 'phone', label: 'Mobile' },
    ...(flow === 'register' ? [{ id: 'register', label: 'Details' }] : []),
    { id: 'code', label: 'OTP' },
  ];

  return (
    <View style={[styles.steps, { backgroundColor: colors.primarySoft }]}>
      {steps.map(({ id, label }, index) => {
        const active = id === step;
        const color = active ? colors.onPrimary : colors.textSecondary;

        return (
          <View
            // Android drops the rounded corners if the colour changes on a mounted view
            key={`${id}-${active}`}
            accessibilityState={{ selected: active }}
            style={[styles.step, { backgroundColor: active ? colors.primary : 'transparent' }]}>
            <Text style={[styles.stepNumber, { color }]}>{index + 1}</Text>
            <Text style={[styles.stepLabel, { color }]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function CodeBoxes({ code, onChange }: { code: string; onChange: (code: string) => void }) {
  const colors = useTheme();
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  return (
    <Pressable onPress={() => input.current?.focus()} style={styles.boxes}>
      {Array.from({ length: CODE_LENGTH }, (_, index) => {
        const active = index === Math.min(code.length, CODE_LENGTH - 1);

        return (
          <View
            key={index}
            style={[
              styles.box,
              {
                backgroundColor: colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}>
            <Text style={[styles.boxDigit, { color: colors.text }]}>{code[index]}</Text>
          </View>
        );
      })}
      {/* Sits invisibly over the boxes so the keyboard and SMS autofill still work */}
      <TextInput
        ref={input}
        accessibilityLabel="Verification code"
        value={code}
        onChangeText={(value) => onChange(value.replace(/\D/g, ''))}
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        maxLength={CODE_LENGTH}
        autoFocus
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

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
  const codeLife = useCountdown();
  const resendWait = useCountdown();
  const phone = toE164(phoneInput);

  const codeSent = () => {
    codeLife.start(CODE_LIFETIME_SECONDS);
    resendWait.start(RESEND_COOLDOWN_SECONDS);
  };

  const start = useMutation({
    mutationFn: () => startAuth(phone),
    onSuccess: ({ nextStep }) => {
      const registering = nextStep === 'REGISTER';
      setFlow(registering ? 'register' : 'login');
      setStep(registering ? 'register' : 'code');
      if (!registering) codeSent();
    },
  });

  const register = useMutation({
    mutationFn: () => requestRegistrationOtp({ phone, name: name.trim(), email: email.trim() }),
    onSuccess: () => {
      setStep('code');
      codeSent();
    },
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
    onSuccess: () => {
      setNotice('A new code is on its way.');
      setCode('');
      codeSent();
    },
  });

  const changeNumber = () => {
    [start, register, verify, resend].forEach((mutation) => mutation.reset());
    setNotice(undefined);
    setCode('');
    setFlow('login');
    setStep('phone');
  };

  const error = start.error ?? register.error ?? verify.error ?? resend.error;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Steps step={step} flow={flow} />

        {step === 'phone' && (
          <>
            <View style={[styles.intro, { backgroundColor: colors.primarySoft }]}>
              <View style={styles.introText}>
                <Eyebrow label="Direct from farmers" />
                <Text style={[styles.introTitle, { color: colors.text }]}>
                  Fresh from local farms
                </Text>
                <Text style={{ color: colors.textSecondary }}>Order today, get it tomorrow</Text>
              </View>
              <IconBadge icon="leaf" size={72} onDark />
            </View>

            <View style={styles.heading}>
              <Text style={[styles.title, { color: colors.text }]}>Welcome</Text>
              <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                Sign in with your mobile number to order from local farmers.
              </Text>
            </View>

            <Card style={styles.phoneCard}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Mobile phone number
              </Text>
              <View style={styles.phoneRow}>
                {!phoneInput.startsWith('+') && (
                  <View style={[styles.prefix, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.phoneText, { color: colors.text }]}>🇮🇳 +91</Text>
                  </View>
                )}
                <View style={[styles.phoneField, { backgroundColor: colors.primarySoft }]}>
                  <TextInput
                    accessibilityLabel="Mobile phone number"
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    autoFocus
                    placeholder="98765 43210"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.phoneInput, { color: colors.text }]}
                  />
                  {phoneInput.length > 0 && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear number"
                      hitSlop={10}
                      onPress={() => setPhoneInput('')}>
                      <Ionicons name="close-circle-outline" size={22} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </View>
              </View>
              <View style={styles.smsNote}>
                <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.text} />
                <Text style={[styles.smsText, { color: colors.textSecondary }]}>
                  We will send a 6-digit verification code by SMS. No passwords needed.
                </Text>
              </View>
            </Card>

            <Button
              label="Continue"
              trailingIcon="arrow-forward"
              busy={start.isPending}
              disabled={phone.length < 9}
              onPress={() => start.mutate()}
            />
          </>
        )}

        {step === 'register' && (
          <>
            <View style={styles.heading}>
              <Text style={[styles.title, { color: colors.text }]}>New here?</Text>
              <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                Tell us who you are.
              </Text>
            </View>
            <Card style={styles.phoneCard}>
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
            </Card>
            <Button
              label="Send code"
              trailingIcon="arrow-forward"
              busy={register.isPending}
              disabled={name.trim().length < 2 || !email.includes('@')}
              onPress={() => register.mutate()}
            />
          </>
        )}

        {step === 'code' && (
          <>
            <View style={styles.heading}>
              <Eyebrow label="SMS verification" />
              <Text style={[styles.title, { color: colors.text }]}>Enter verification code</Text>
              <View style={styles.sentTo}>
                <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                  Sent to <Text style={[styles.sentPhone, { color: colors.text }]}>{phone}</Text>
                </Text>
                <Pressable accessibilityRole="button" hitSlop={10} onPress={changeNumber}>
                  <Text style={[styles.edit, { color: colors.accent }]}>Edit</Text>
                </Pressable>
              </View>
            </View>

            <CodeBoxes code={code} onChange={setCode} />

            <View style={styles.expiry}>
              <Ionicons name="time-outline" size={17} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary }}>
                {codeLife.remaining > 0
                  ? `Code expires in ${formatClock(codeLife.remaining)}`
                  : 'This code has expired. Send a new one.'}
              </Text>
            </View>

            <Button
              label="Verify & sign in"
              trailingIcon="arrow-forward"
              busy={verify.isPending}
              disabled={code.length !== CODE_LENGTH}
              onPress={() => verify.mutate()}
            />
            <Button
              label={
                resendWait.remaining > 0
                  ? `Send a new code in ${resendWait.remaining}s`
                  : 'Send a new code'
              }
              variant="plain"
              busy={resend.isPending}
              disabled={resendWait.remaining > 0}
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
  form: { padding: Spacing.three + 4, gap: 18 },
  steps: { flexDirection: 'row', padding: Spacing.one, borderRadius: Radius.round },
  step: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: 21,
  },
  stepNumber: { fontSize: 13, fontFamily: Fonts.semibold },
  stepLabel: { fontSize: 14, fontFamily: Fonts.medium },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    borderRadius: Radius.large,
  },
  introText: { flex: 1, gap: Spacing.one },
  introTitle: { fontSize: 22, lineHeight: 27, fontFamily: Fonts.display, marginTop: Spacing.one },
  heading: { gap: Spacing.one },
  title: { fontSize: 32, lineHeight: 39, fontFamily: Fonts.display },
  tagline: { fontSize: 16, lineHeight: 23 },
  phoneCard: { padding: Spacing.three, gap: 12 },
  label: { fontSize: 14, fontFamily: Fonts.medium },
  phoneRow: { flexDirection: 'row', gap: Spacing.two },
  prefix: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneText: { fontSize: 16, fontFamily: Fonts.medium },
  phoneField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: Radius.small,
  },
  phoneInput: { flex: 1, fontSize: 17, fontFamily: Fonts.medium },
  smsNote: { flexDirection: 'row', gap: 10 },
  smsText: { flex: 1, fontSize: 14, lineHeight: 20 },
  sentTo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sentPhone: { fontFamily: Fonts.semibold },
  edit: { fontSize: 15, fontFamily: Fonts.semibold, textDecorationLine: 'underline' },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  box: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDigit: { fontSize: 24, fontFamily: Fonts.display },
  hiddenInput: { ...StyleSheet.absoluteFill, opacity: 0 },
  expiry: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  message: { fontSize: 15, textAlign: 'center' },
});
