import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { ClipboardList, FileStack, LogOut, UserRound } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/app/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import type { DrawerParamList } from '@/navigation/types';
import { APP_BRAND } from '@/lib/branding';
import { formatUsername } from '@/lib/user-display';
import { colors, layoutPadding, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/modules/auth/auth-context';

type NavItem = {
  route: keyof DrawerParamList;
  label: string;
  icon: typeof ClipboardList;
};

const NAV_ITEMS: NavItem[] = [
  { route: 'Assignments', label: 'Survey assignments', icon: ClipboardList },
  { route: 'Drafts', label: 'Offline drafts', icon: FileStack },
  { route: 'Profile', label: 'My profile', icon: UserRound },
];

export function AppDrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const { user, logout, isOnline, pendingSync, runSync } = useAuth();
  const activeRoute = state.routes[state.index]?.name;

  const handleLogout = () => {
    navigation.closeDrawer();
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
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.profileCard}>
        <UserAvatar
          username={user?.username}
          email={user?.email}
          size="lg"
          showStatus
          isOnline={isOnline}
        />
        <View style={styles.profileText}>
          <Text style={styles.displayName}>{formatUsername(user?.username)}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.badgeRow}>
            <Badge variant="secondary" label={APP_BRAND.shortName} />
            <Badge variant={isOnline ? 'success' : 'outline'} label={isOnline ? 'Online' : 'Offline'} />
          </View>
        </View>
      </View>

      {pendingSync > 0 ? (
        <View style={styles.syncCard}>
          <Text style={styles.syncTitle}>
            {pendingSync} item{pendingSync === 1 ? '' : 's'} waiting to upload
          </Text>
          <Button
            variant="outline"
            label={isOnline ? 'Sync now' : 'Offline'}
            onPress={() => void runSync()}
            disabled={!isOnline}
          />
        </View>
      ) : null}

      <Separator />

      <ScrollView style={styles.nav} contentContainerStyle={styles.navContent}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeRoute === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => navigation.navigate(item.route)}
              style={[styles.navItem, active && styles.navItemActive]}
            >
              <Icon size={20} color={active ? colors.primary : colors.muted} />
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable onPress={handleLogout} style={styles.logout}>
          <LogOut size={18} color={colors.destructive} />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
        <Text style={styles.version}>{APP_BRAND.footer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layoutPadding.screen,
    paddingVertical: spacing.lg,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
  },
  email: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  syncCard: {
    marginHorizontal: layoutPadding.screen,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: spacing.sm,
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.amber900,
  },
  nav: {
    flex: 1,
  },
  navContent: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  navItemActive: {
    backgroundColor: '#e8f0fa',
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.foreground,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: layoutPadding.screen,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.destructive,
  },
  version: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
