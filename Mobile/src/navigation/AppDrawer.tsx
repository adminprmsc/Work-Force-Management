import { createDrawerNavigator } from '@react-navigation/drawer';

import { AppDrawerContent } from '@/components/app/app-drawer-content';
import { AppHeader } from '@/components/app/app-header';
import type { DrawerParamList } from '@/navigation/types';
import { AssignmentsScreen } from '@/screens/AssignmentsScreen';
import { DraftsScreen } from '@/screens/DraftsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { colors } from '@/lib/theme';

const Drawer = createDrawerNavigator<DrawerParamList>();

export function AppDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        header: (props) => <AppHeader {...props} />,
        drawerType: 'front',
        drawerStyle: {
          width: 300,
          backgroundColor: colors.background,
        },
        overlayColor: 'rgba(15, 23, 42, 0.45)',
      }}
    >
      <Drawer.Screen
        name="Assignments"
        component={AssignmentsScreen}
        options={{ title: 'Survey assignments' }}
      />
      <Drawer.Screen name="Drafts" component={DraftsScreen} options={{ title: 'Offline drafts' }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'My profile' }} />
    </Drawer.Navigator>
  );
}
