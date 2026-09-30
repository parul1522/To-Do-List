import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, Banner, Button, Screen, TextField } from '@/components/ui';
import { useUpdateProfile } from '@/features/profile/hooks';
import { useAuthStore } from '@/store/authStore';
import { getErrorMessage, getFieldErrors } from '@/utils/errors';
import { validateName } from '@/utils/validation';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [nameError, setNameError] = useState<string>();

  const serverErrors = getFieldErrors(update.error);
  const dirty = name.trim() !== user?.name || (avatarUrl.trim() || null) !== user?.avatar_url;

  const save = () => {
    const error = validateName(name);
    setNameError(error);
    if (error) return;
    update.mutate(
      { name: name.trim(), avatar_url: avatarUrl.trim() || null },
      { onSuccess: () => router.back() },
    );
  };

  return (
    <Screen edges={[]} keyboardAware>
      <View style={styles.avatar}>
        <Avatar name={name || user?.name} uri={avatarUrl.trim() || null} size={84} />
      </View>
      <View style={styles.form}>
        {update.isError && Object.keys(serverErrors).length === 0 ? (
          <Banner message={getErrorMessage(update.error)} />
        ) : null}
        <TextField
          testID="profile-name"
          label="Name"
          value={name}
          onChangeText={setName}
          error={nameError ?? serverErrors.name}
          autoComplete="name"
        />
        <TextField label="Email" value={user?.email ?? ''} editable={false} hint="Email changes aren't supported yet." />
        <TextField
          label="Avatar URL"
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          error={serverErrors.avatar_url}
          autoCapitalize="none"
          keyboardType="url"
          placeholder="https://…"
          hint="Photo uploads arrive with attachments in Phase 3."
        />
        <Button
          testID="profile-save"
          title="Save changes"
          onPress={save}
          loading={update.isPending}
          disabled={!dirty}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', marginVertical: 24 },
  form: { gap: 16 },
});
