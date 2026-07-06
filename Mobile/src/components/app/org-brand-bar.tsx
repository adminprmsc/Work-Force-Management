import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Muted, Text } from '@/components/ui/text';
import { APP_BRAND } from '@/lib/branding';
import { colors, spacing } from '@/lib/theme';

const prmscLogo = require('@/assets/prmsc-logo.png');
const punjabLogo = require('@/assets/punjab-govt-logo.png');

type OrgBrandBarProps = {
  size?: 'sm' | 'md' | 'lg';
  showCaption?: boolean;
  variant?: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
};

const logoHeights = { sm: 28, md: 36, lg: 48 } as const;

export function OrgBrandBar({
  size = 'md',
  showCaption = false,
  variant = 'light',
  style,
}: OrgBrandBarProps) {
  const logoHeight = logoHeights[size];
  const isDark = variant === 'dark';

  return (
    <View style={style}>
      <View
        style={[
          styles.logoRow,
          isDark ? styles.logoRowDark : styles.logoRowLight,
          size === 'sm' && styles.logoRowSm,
        ]}
      >
        <Image source={prmscLogo} style={{ height: logoHeight, width: logoHeight * 2.2 }} resizeMode="contain" />
        <View style={[styles.divider, isDark && styles.dividerDark]} />
        <Image source={punjabLogo} style={{ height: logoHeight, width: logoHeight * 2.2 }} resizeMode="contain" />
      </View>
      {showCaption ? (
        <View style={styles.captionBlock}>
          <Text style={[styles.captionTitle, isDark && styles.captionTitleDark]}>
            {APP_BRAND.productName}
          </Text>
          <Muted style={[styles.captionSub, isDark && styles.captionSubDark]}>
            {APP_BRAND.departmentFull} · {APP_BRAND.government}
          </Muted>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  logoRowSm: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  logoRowLight: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoRowDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  dividerDark: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captionBlock: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  captionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  captionTitleDark: {
    color: '#ffffff',
  },
  captionSub: {
    marginTop: 4,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  captionSubDark: {
    color: 'rgba(255,255,255,0.7)',
  },
});
