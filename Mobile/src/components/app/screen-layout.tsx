import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Muted, Text } from '@/components/ui/text';
import { colors, layoutPadding, radius, spacing } from '@/lib/theme';

type ScreenLayoutProps = {
  children: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenLayout({ children, subtitle, action, contentStyle }: ScreenLayoutProps) {
  return (
    <View style={styles.screen}>
      {subtitle ? (
        <View style={styles.subtitleBar}>
          <Muted style={styles.subtitle}>{subtitle}</Muted>
          {action ? <View style={styles.action}>{action}</View> : null}
        </View>
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

export function ScreenSectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  subtitleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: layoutPadding.screen,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  subtitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  action: {
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
});
