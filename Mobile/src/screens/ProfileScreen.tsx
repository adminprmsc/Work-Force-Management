import { LogOut, RefreshCw } from 'lucide-react-native';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenLayout, ScreenSectionTitle } from '@/components/app/screen-layout';
import { UserAvatar } from '@/components/app/user-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Muted, Text } from '@/components/ui/text';
import { APP_BRAND } from '@/lib/branding';
import { layout } from '@/lib/layout';
import { colors, layoutPadding, spacing } from '@/lib/theme';
import { formatUsername } from '@/lib/user-display';
import { useAuth } from '@/modules/auth/auth-context';

export function ProfileScreen() {
  const { user, logout, runSync, pendingSync, isOnline } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign out', 'You will need to sign in again to access assignments.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <ScreenLayout subtitle="Account details, sync status, and session controls.">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <UserAvatar
            username={user?.username}
            email={user?.email}
            size="lg"
            showStatus
            isOnline={isOnline}
          />
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{formatUsername(user?.username)}</Text>
            <Muted>{user?.email}</Muted>
            <Text style={styles.heroRole}>{APP_BRAND.productName}</Text>
            <Muted style={layout.mtSm}>{APP_BRAND.departmentFull}</Muted>
          </View>
        </Card>

        <ScreenSectionTitle>Data sync</ScreenSectionTitle>
        <Card style={layout.mbLg}>
          <CardTitle>Sync queue</CardTitle>
          <CardDescription style={layout.mbMd}>
            {isOnline
              ? `${pendingSync} item(s) waiting to upload.`
              : 'You are offline. Changes stay on this device until connected.'}
          </CardDescription>
          <Button
            variant="outline"
            onPress={() => void runSync()}
            disabled={!isOnline || pendingSync === 0}
          >
            <RefreshCw size={16} color={colors.foreground} />
            <Text style={styles.buttonLabel}>Sync now</Text>
          </Button>
        </Card>

        <Button variant="destructive" onPress={handleLogout}>
          <LogOut size={16} color="#fff" />
          <Text style={styles.destructiveLabel}>Sign out</Text>
        </Button>

        <Muted style={styles.footer}>{APP_BRAND.footer}</Muted>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: layoutPadding.screen,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  heroRole: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonLabel: { marginLeft: 8, fontWeight: '600' },
  destructiveLabel: { marginLeft: 8, fontWeight: '600', color: colors.destructiveForeground },
  footer: { marginTop: spacing.xl, textAlign: 'center', lineHeight: 18 },
});
