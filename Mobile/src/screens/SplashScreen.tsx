import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { APP_BRAND } from '@/lib/branding';
import { colors, spacing } from '@/lib/theme';

const prmscLogo = require('@/assets/prmsc-logo.png');

export function SplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Image source={prmscLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.product}>{APP_BRAND.productName}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  logo: {
    height: 72,
    width: 200,
  },
  product: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
