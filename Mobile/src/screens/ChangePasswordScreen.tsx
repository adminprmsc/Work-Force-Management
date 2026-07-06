import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label, Muted } from '@/components/ui/text';
import { layout } from '@/lib/layout';
import { useAuth } from '@/modules/auth/auth-context';

export function ChangePasswordScreen() {
  const { changeUserPassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={layout.screen}>
      <ScrollView contentContainerStyle={layout.screenPadded}>
        <Card>
          <CardTitle>Change password</CardTitle>
          <CardDescription style={layout.mbMd}>
            Your account requires a new password before you can continue.
          </CardDescription>

          <Label>Current password</Label>
          <Input
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            style={layout.mbMd}
          />

          <Label>New password</Label>
          <Input
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            style={layout.mbMd}
          />

          <Label>Confirm new password</Label>
          <Input
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={layout.mbLg}
          />

          <Button
            label={loading ? 'Saving…' : 'Update password'}
            onPress={() => void handleSubmit()}
            disabled={loading}
          />
          <Muted style={layout.mtMd}>Minimum 8 characters.</Muted>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
