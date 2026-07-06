import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ScreenLayout } from '@/components/app/screen-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Muted } from '@/components/ui/text';
import type { AppNavigationProp } from '@/navigation/types';
import { layout } from '@/lib/layout';
import { colors, layoutPadding, spacing } from '@/lib/theme';
import { useAuth } from '@/modules/auth/auth-context';
import { listMySurveyAssignments } from '@/modules/api/survey-api';
import type { SurveyAssignment } from '@/modules/api/types';
import { cacheAssignments, getCachedAssignments } from '@/modules/offline/offline-store';

function frequencyLabel(frequency: SurveyAssignment['frequency']): string {
  switch (frequency) {
    case 'ONE_TIME':
      return 'One time';
    case 'DAILY':
      return 'Daily';
    case 'WEEKLY':
      return 'Weekly';
    case 'MONTHLY':
      return 'Monthly';
    default:
      return frequency;
  }
}

export function AssignmentsScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { token, isOnline } = useAuth();
  const [assignments, setAssignments] = useState<SurveyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      if (isOnline) {
        const data = await listMySurveyAssignments(token);
        await cacheAssignments(data);
        setAssignments(data);
      } else {
        setAssignments(await getCachedAssignments());
      }
    } catch (err) {
      const cached = await getCachedAssignments();
      if (cached.length > 0) {
        setAssignments(cached);
      } else {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load assignments');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, isOnline]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  return (
    <ScreenLayout subtitle="Package baselines and village site visits for your tehsil.">
      {loading ? (
        <View style={layout.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={layout.flex1}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {assignments.length === 0 ? (
            <Card>
              <CardTitle>No assignments</CardTitle>
              <CardDescription>
                {isOnline
                  ? 'You have no active survey assignments right now.'
                  : 'No cached assignments. Connect to load your work.'}
              </CardDescription>
            </Card>
          ) : (
            assignments.map((assignment) => {
              const needsBaseline =
                assignment.requiresPackageBaseline &&
                !assignment.procurementPackage.isBaselineComplete;

              return (
                <Pressable
                  key={assignment.id}
                  onPress={() => navigation.navigate('AssignmentDetail', { id: assignment.id })}
                  style={layout.cardSpacing}
                >
                  <Card>
                    <View style={styles.cardHeader}>
                      <CardTitle style={styles.cardTitle}>{assignment.formTitle}</CardTitle>
                      {needsBaseline ? (
                        <Badge label="Baseline needed" variant="warning" />
                      ) : (
                        <Badge label={frequencyLabel(assignment.frequency)} variant="secondary" />
                      )}
                    </View>
                    <CardDescription style={layout.mtSm}>
                      {assignment.procurementPackage.name} · {assignment.tehsil.name}
                    </CardDescription>
                    <Muted style={layout.mtSm}>
                      {assignment.startDate.slice(0, 10)} → {assignment.endDate.slice(0, 10)} ·{' '}
                      {assignment.responseCount} response
                      {assignment.responseCount === 1 ? '' : 's'}
                    </Muted>
                    {assignment.instructions ? (
                      <Muted style={layout.mtSm}>{assignment.instructions}</Muted>
                    ) : null}
                  </Card>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: layoutPadding.screen,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
  },
});
