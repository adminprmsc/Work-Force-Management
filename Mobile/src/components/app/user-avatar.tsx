import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/text';
import { colors, radius } from '@/lib/theme';
import { getUserInitials } from '@/lib/user-display';

type UserAvatarProps = {
  username?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  isOnline?: boolean;
  style?: StyleProp<ViewStyle>;
};

const sizes = {
  sm: { box: 32, font: 12, dot: 8, dotBorder: 2 },
  md: { box: 40, font: 14, dot: 10, dotBorder: 2 },
  lg: { box: 56, font: 18, dot: 12, dotBorder: 2 },
} as const;

export function UserAvatar({
  username,
  email,
  size = 'md',
  showStatus = false,
  isOnline = false,
  style,
}: UserAvatarProps) {
  const dim = sizes[size];
  const initials = getUserInitials(username, email);

  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: dim.box,
            height: dim.box,
            borderRadius: dim.box / 2,
          },
        ]}
      >
        <Text style={[styles.initials, { fontSize: dim.font }]}>{initials}</Text>
      </View>
      {showStatus ? (
        <View
          style={[
            styles.statusDot,
            {
              width: dim.dot,
              height: dim.dot,
              borderRadius: dim.dot / 2,
              borderWidth: dim.dotBorder,
              backgroundColor: isOnline ? colors.success : colors.muted,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f0fa',
    borderWidth: 1,
    borderColor: '#c7d9f0',
  },
  initials: {
    fontWeight: '700',
    color: colors.primary,
  },
  statusDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    borderColor: colors.background,
  },
});
