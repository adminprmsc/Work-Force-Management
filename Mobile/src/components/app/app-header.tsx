import type { DrawerHeaderProps } from '@react-navigation/drawer';
import { Menu } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/app/user-avatar';
import { Text } from '@/components/ui/text';
import { APP_BRAND } from '@/lib/branding';
import { formatUsername } from '@/lib/user-display';
import { colors, layoutPadding, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/modules/auth/auth-context';

const SCREEN_TITLES: Record<string, string> = {
  Assignments: 'Survey assignments',
  Drafts: 'Offline drafts',
  Profile: 'My profile',
};

export function AppHeader({ navigation, route }: DrawerHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user, isOnline, pendingSync } = useAuth();
  const title = SCREEN_TITLES[route.name] ?? APP_BRAND.shortName;
  const statusLabel = isOnline ? 'Online' : 'Offline';

  const syncHint =
    pendingSync > 0
      ? `${pendingSync} pending sync`
      : isOnline
        ? 'All changes synced'
        : 'Working offline';

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <View style={styles.row}>
          <Pressable
            onPress={() => navigation.openDrawer()}
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
          >
            <Menu size={20} color={colors.primaryForeground} />
          </Pressable>

          <View style={styles.titleBlock}>
            <Text style={styles.brand}>{APP_BRAND.shortName}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={styles.profileBlock}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: isOnline ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.12)' },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOnline ? '#34d399' : 'rgba(255,255,255,0.5)' },
                ]}
              />
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
            <UserAvatar
              username={user?.username}
              email={user?.email}
              size="sm"
              showStatus
              isOnline={isOnline}
            />
          </View>
        </View>

        {user ? (
          <View style={styles.subRow}>
            <Text style={styles.username}>{formatUsername(user.username)}</Text>
            <Text style={styles.syncHint}> · {syncHint}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.primaryDark,
    borderBottomWidth: 1,
    borderBottomColor: '#08243f',
  },
  container: {
    paddingHorizontal: layoutPadding.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  brand: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    paddingLeft: 54,
  },
  username: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  syncHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },
});
