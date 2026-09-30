import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Banner, Button, Screen, Section, Text, TextField } from '@/components/ui';
import { useChangePassword, useDeleteAccount, useSignOutEverywhere } from '@/features/profile/hooks';
import { getErrorMessage } from '@/utils/errors';
import { validateNewPassword } from '@/utils/validation';

function confirmDestructive(title: string, message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function SecurityScreen() {
  const changePassword = useChangePassword();
  const signOutEverywhere = useSignOutEverywhere();
  const deleteAccount = useDeleteAccount();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [nextError, setNextError] = useState<string>();
  const [deletePassword, setDeletePassword] = useState('');

  const submitPassword = () => {
    const error = validateNewPassword(next);
    setNextError(error);
    if (error || !current) return;
    changePassword.mutate(
      { current_password: current, new_password: next },
      {
        onSuccess: () => {
          setCurrent('');
          setNext('');
        },
      },
    );
  };

  return (
    <Screen edges={[]} keyboardAware>
      <Section title="Change password" grouped={false}>
        <View style={styles.group}>
          {changePassword.isError ? <Banner message={getErrorMessage(changePassword.error)} /> : null}
          {changePassword.isSuccess ? (
            <Banner tone="info" message="Password updated. Other devices have been signed out." />
          ) : null}
          <TextField
            testID="security-current"
            label="Current password"
            value={current}
            onChangeText={setCurrent}
            secureTextEntry
            autoComplete="current-password"
          />
          <TextField
            testID="security-new"
            label="New password"
            value={next}
            onChangeText={(text) => {
              setNext(text);
              setNextError(undefined);
            }}
            error={nextError}
            hint="At least 8 characters, with a letter and a number."
            secureTextEntry
            autoComplete="new-password"
          />
          <Button
            title="Update password"
            onPress={submitPassword}
            loading={changePassword.isPending}
            disabled={!current || !next}
          />
        </View>
      </Section>

      <Section title="Sessions" grouped={false}>
        <View style={styles.group}>
          <Text variant="callout" tone="muted">
            Signed in on a device you no longer use? Sign out everywhere, including this device.
          </Text>
          {signOutEverywhere.isError ? <Banner message={getErrorMessage(signOutEverywhere.error)} /> : null}
          <Button
            title="Sign out of all devices"
            variant="secondary"
            icon="log-out"
            loading={signOutEverywhere.isPending}
            onPress={() =>
              confirmDestructive(
                'Sign out everywhere?',
                'Every device, including this one, will need to sign in again.',
                'Sign out all',
                () => signOutEverywhere.mutate(),
              )
            }
          />
        </View>
      </Section>

      <Section title="Danger zone" grouped={false}>
        <View style={styles.group}>
          <Text variant="callout" tone="muted">
            Permanently delete your account and everything in it. This cannot be undone.
          </Text>
          {deleteAccount.isError ? <Banner message={getErrorMessage(deleteAccount.error)} /> : null}
          <TextField
            label="Confirm with your password"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            autoComplete="current-password"
          />
          <Button
            title="Delete account"
            variant="danger"
            icon="trash-2"
            disabled={!deletePassword}
            loading={deleteAccount.isPending}
            onPress={() =>
              confirmDestructive(
                'Delete your account?',
                'All of your notes, tasks and files will be permanently deleted.',
                'Delete forever',
                () => deleteAccount.mutate(deletePassword),
              )
            }
          />
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 14 },
});
