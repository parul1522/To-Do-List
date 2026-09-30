import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Banner, Button, IconButton, Screen, Text, TextField } from '@/components/ui';
import { AuthHeader } from '@/features/auth/AuthHeader';
import { useSignIn } from '@/features/auth/hooks';
import { getErrorMessage } from '@/utils/errors';
import { validateEmail } from '@/utils/validation';

export default function SignInScreen() {
  const signIn = useSignIn();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = () => {
    const next = { email: validateEmail(email), password: password ? undefined : 'Enter your password' };
    setErrors(next);
    if (next.email || next.password) return;
    signIn.mutate({ email, password });
  };

  return (
    <Screen keyboardAware edges={['top', 'bottom']}>
      <IconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back} />
      <AuthHeader title="Welcome back" subtitle="Sign in to pick up where you left off." />

      <View style={styles.form}>
        {signIn.isError ? <Banner message={getErrorMessage(signIn.error)} /> : null}
        <TextField
          testID="sign-in-email"
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="you@example.com"
        />
        <TextField
          testID="sign-in-password"
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Button testID="sign-in-submit" title="Sign in" onPress={submit} loading={signIn.isPending} />
      </View>

      <View style={styles.footer}>
        <Text variant="callout" tone="muted">
          New here?{' '}
        </Text>
        <Link href="/sign-up" replace>
          <Text variant="callout" tone="primary" style={styles.link}>
            Create an account
          </Text>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { marginLeft: -10, marginTop: 4 },
  form: { gap: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  link: { fontWeight: '600' },
});
