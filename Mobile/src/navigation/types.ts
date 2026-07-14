import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type DrawerParamList = {
  Assignments: undefined;
  Submissions: undefined;
  Drafts: undefined;
  Profile: undefined;
};

/** @deprecated Use DrawerParamList */
export type MainTabParamList = DrawerParamList;

export type RootStackParamList = {
  Bootstrap: undefined;
  Login: undefined;
  ChangePassword: undefined;
  MainDrawer: NavigatorScreenParams<DrawerParamList>;
  AssignmentDetail: { id: string };
  Response: { localId?: string; assignmentId?: string; responseId?: string };
  Baseline: { packageId: string; formId: string };
};

export type AppNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
