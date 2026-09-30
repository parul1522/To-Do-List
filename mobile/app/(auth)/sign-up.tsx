import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Banner, Button, IconButton, Screen, Text, TextField } from '@/components/ui';
import { AuthHeader } from '@/features/auth/AuthHeader';
import { useSignUp } from '@/features/auth/hooks';
import { getErrorMessage, getFieldErrors } from '@/utils/errors';
import { validateEmail, validateName, validateNewPassword } from '@/utils/validation';

type Field = 'name' | 'email' | 'password';

export default function SignUpScreen() {
  const signUp = useSignUp();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const serverFieldErrors = getFieldErrors(signUp.error);
  const fieldError = (field: Field) => errors[field] ?? serverFieldErrors[field];
  const set = (field: Field) => (text: string) => {
    setValues((v) => ({ ...v, [field]: text }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = () => {
    const next = {
      name: validateName(values.name),
      email: validateEmail(values.email),
      password: validateNewPassword(values.password),
    };
    setErrors(next);
    if (next.name || next.email || next.password) return;
    signUp.mutate(values);
  };

  const showBanner = signUp.isError && Object.keys(serverFieldErrors).length === 0;

  return (
    <Screen keyboardAware edges={['top', 'bottom']}>
      <IconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back} />
      <AuthHeader title="Create your second brain" subtitle="It takes less than a minute." />

      <View style={styles.form}>
        {showBanner ? <Banner message={getErrorMessage(signUp.error)} /> : null}
        <TextField
          testID="sign-up-name"
          label="Name"
          value={values.name}
          onChangeText={set('name')}
          error={fieldError('name')}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          placeholder="Ada Lovelace"
        />
        <TextField
          testID="sign-up-email"
          ref={emailRef}
          label="Email"
          value={values.email}
          onChangeText={set('email')}
          error={fieldError('email')}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          placeholder="you@example.com"
        />
        <TextField
          testID="sign-up-password"
          ref={passwordRef}
          label="Password"
          value={values.password}
          onChangeText={set('password')}
          error={fieldError('password')}
          hint="At least 8 characters, with a letter and a number."
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Button testID="sign-up-submit" title="Create account" onPress={submit} loading={signUp.isPending} />
      </View>

      <View style={styles.footer}>
        <Text variant="callout" tone="muted">
          Already have an account?{' '}
        </Text>
        <Link href="/sign-in" replace>
          <Text variant="callout" tone="primary" style={styles.link}>
            Sign in
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
