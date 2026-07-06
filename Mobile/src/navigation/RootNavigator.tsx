import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppDrawer } from '@/navigation/AppDrawer';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/modules/auth/auth-context';
import { AssignmentDetailScreen } from '@/screens/AssignmentDetailScreen';
import { BaselineScreen } from '@/screens/BaselineScreen';
import { ChangePasswordScreen } from '@/screens/ChangePasswordScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { ResponseScreen } from '@/screens/ResponseScreen';
import { SplashScreen } from '@/screens/SplashScreen';
import { colors } from '@/lib/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.foreground,
    border: colors.border,
  },
};

function AppStack() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      key={user?.id ?? (user ? 'auth' : 'guest')}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : user.mustChangePassword ? (
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen name="MainDrawer" component={AppDrawer} options={{ headerShown: false }} />
          <Stack.Screen
            name="AssignmentDetail"
            component={AssignmentDetailScreen}
            options={{ title: 'Assignment details' }}
          />
          <Stack.Screen name="Response" component={ResponseScreen} options={{ title: 'Site visit survey' }} />
          <Stack.Screen
            name="Baseline"
            component={BaselineScreen}
            options={{ title: 'Package baseline' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <AppStack />
    </NavigationContainer>
  );
}
