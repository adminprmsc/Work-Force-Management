import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OrgBrandBar } from '@/components/app/org-brand-bar';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label, Muted, Text } from '@/components/ui/text';
import { APP_BRAND } from '@/lib/branding';
import { ApiError, apiBaseUrl } from '@/lib/api-client';
import { layout } from '@/lib/layout';
import { colors, layoutPadding, radius, spacing } from '@/lib/theme';
import { useAuth } from '@/modules/auth/auth-context';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing credentials', 'Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Unable to sign in';
      if (err instanceof ApiError && err.status === 401) {
        message =
          err.message === 'Account is inactive'
            ? 'This account is inactive. Contact Head Office.'
            : 'Invalid email or password. Use your RA tehsil account (same credentials as the web app).';
      } else if (message.includes('Cannot reach API')) {
        message = `${message}\n\nCurrent API: ${apiBaseUrl()}`;
      }
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={layout.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandHero}>
            <OrgBrandBar size="lg" showCaption />
            <Text style={styles.tagline}>{APP_BRAND.tagline}</Text>
          </View>

          <Card style={styles.card}>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription style={layout.mbMd}>
              Enter your organization credentials. {APP_BRAND.shortName} access only.
            </CardDescription>

            <Label>Email address</Label>
            <Input
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="ra.es.tehsil@ens.com"
              style={layout.mbMd}
            />

            <Label>Password</Label>
            <Input
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              style={layout.mbLg}
            />

            <Button onPress={() => void handleLogin()} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </Button>
          </Card>

          <Muted style={styles.footer}>{APP_BRAND.footer}</Muted>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: layoutPadding.screen,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  tagline: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    borderRadius: radius.lg,
  },
  buttonText: {
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  footer: {
    marginTop: spacing.xl,
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 11,
  },
});
