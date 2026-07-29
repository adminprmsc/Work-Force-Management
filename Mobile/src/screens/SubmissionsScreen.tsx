import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ScreenLayout } from '@/components/app/screen-layout';
import {
  RevertedSubmissionsSection,
  SubmissionCard,
} from '@/components/survey/submission-card';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import type { AppNavigationProp } from '@/navigation/types';
import { layout } from '@/lib/layout';
import { colors, layoutPadding, spacing } from '@/lib/theme';
import { useAuth } from '@/modules/auth/auth-context';
import { listSurveyResponses } from '@/modules/api/survey-api';
import type { SurveyResponse } from '@/modules/api/types';

export function SubmissionsScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { token, isOnline } = useAuth();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    if (!isOnline) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await listSurveyResponses(token);
      setResponses(data.items);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, isOnline]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const revertedResponses = useMemo(
    () => responses.filter((response) => response.status === 'REVERTED'),
    [responses],
  );

  const otherResponses = useMemo(
    () => responses.filter((response) => response.status !== 'REVERTED'),
    [responses],
  );

  const openResponse = (response: SurveyResponse) => {
    navigation.navigate('Response', { responseId: response.id });
  };

  return (
    <ScreenLayout>
      {loading ? (
        <View style={layout.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !isOnline ? (
        <Card>
          <CardTitle>Offline</CardTitle>
          <CardDescription style={layout.mtSm}>
            Connect to the internet to view your submissions. Local drafts are under Drafts.
          </CardDescription>
        </Card>
      ) : (
        <ScrollView
          style={layout.flex1}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <RevertedSubmissionsSection responses={revertedResponses} onOpen={openResponse} />

          {responses.length === 0 ? (
            <Card>
              <CardTitle>No submissions yet</CardTitle>
              <CardDescription style={layout.mtSm}>
                Start a village visit from an assignment. Your drafts and submitted forms will
                appear here.
              </CardDescription>
            </Card>
          ) : otherResponses.length === 0 ? (
            <MutedCard message="All current submissions need your attention above." />
          ) : (
            <View style={styles.submissionList}>
              {otherResponses.map((response) => (
                <SubmissionCard key={response.id} response={response} onOpen={openResponse} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </ScreenLayout>
  );
}

function MutedCard({ message }: { message: string }) {
  return (
    <Card>
      <CardDescription>{message}</CardDescription>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: layoutPadding.screen,
    paddingBottom: spacing.xxl,
  },
  submissionList: {
    gap: spacing.md,
  },
});
