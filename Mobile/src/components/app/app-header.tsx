import type { DrawerHeaderProps } from '@react-navigation/drawer';
import { Menu } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/app/user-avatar';
import { Text } from '@/components/ui/text';
import { colors, layoutPadding, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/modules/auth/auth-context';

const SCREEN_TITLES: Record<string, string> = {
  Assignments: 'Assignments',
  Submissions: 'Submissions',
  Drafts: 'Drafts',
  Profile: 'Profile',
};

export function AppHeader({ navigation, route }: DrawerHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user, isOnline, pendingSync } = useAuth();
  const title = SCREEN_TITLES[route.name] ?? route.name;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.container}>
        <Pressable
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Menu size={20} color={colors.primaryForeground} />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.trailing}>
          {pendingSync > 0 ? (
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>{pendingSync}</Text>
            </View>
          ) : null}
          <UserAvatar
            username={user?.username}
            email={user?.email}
            size="sm"
            showStatus
            isOnline={isOnline}
          />
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layoutPadding.screen,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  syncBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
});
