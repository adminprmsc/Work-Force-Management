import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { SurveyFormRenderer } from '@/components/survey/survey-field-control';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Muted } from '@/components/ui/text';
import { buildAnswers } from '@/lib/survey-answers';
import { layout } from '@/lib/layout';
import { colors } from '@/lib/theme';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/modules/auth/auth-context';
import {
  getPackageFormBaseline,
  savePackageFormBaseline,
} from '@/modules/api/procurement-api';
import type { PackageFormBaseline } from '@/modules/api/types';
import { queueOfflineBaseline } from '@/modules/offline/offline-store';

type AnswerMap = Record<string, unknown>;

export function BaselineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Baseline'>>();
  const { packageId, formId } = route.params;
  const { token, isOnline } = useAuth();
  const [baseline, setBaseline] = useState<PackageFormBaseline | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!token || !packageId || !formId) return;
    try {
      if (isOnline) {
        const data = await getPackageFormBaseline(token, packageId, formId);
        setBaseline(data);
        const initial: AnswerMap = {};
        for (const answer of data.answers) initial[answer.fieldId] = answer.value;
        setAnswers(initial);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to load baseline');
    } finally {
      setLoading(false);
    }
  }, [token, packageId, formId, isOnline]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    if (!baseline || !token) return;
    setSaving(true);
    const payload = buildAnswers(baseline.fields, answers);
    try {
      if (isOnline) {
        await savePackageFormBaseline(token, packageId, formId, { answers: payload });
        Alert.alert('Saved', 'Package baseline saved.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await queueOfflineBaseline({
          packageId,
          formId,
          formTitle: baseline.formTitle,
          answers: payload,
        });
        Alert.alert('Saved offline', 'Baseline queued for sync when online.');
      }
    } catch (err) {
      if (!isOnline) {
        await queueOfflineBaseline({
          packageId,
          formId,
          formTitle: baseline?.formTitle ?? 'Baseline',
          answers: payload,
        });
        Alert.alert('Saved offline', 'Queued for sync when connected.');
      } else {
        Alert.alert('Error', err instanceof Error ? err.message : 'Could not save baseline');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={layout.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!baseline) {
    return (
      <View style={[layout.center, styles.notFound]}>
        <Muted>
          {isOnline ? 'Baseline not found.' : 'Connect to load the baseline form.'}
        </Muted>
      </View>
    );
  }

  return (
    <View style={layout.screen}>
      <ScrollView style={layout.flex1} contentContainerStyle={styles.scroll}>
        <Card style={layout.mbMd}>
          <CardTitle>{baseline.baselineTitle ?? baseline.formTitle}</CardTitle>
          {baseline.baselineDescription ? (
            <CardDescription style={layout.mtSm}>{baseline.baselineDescription}</CardDescription>
          ) : null}
        </Card>
        <SurveyFormRenderer
          fields={baseline.fields}
          answers={answers}
          onChange={(fieldId, value) => setAnswers((prev) => ({ ...prev, [fieldId]: value }))}
        />
      </ScrollView>
      <View style={layout.footerActions}>
        <Button
          label={saving ? 'Saving…' : 'Save baseline'}
          onPress={() => void handleSave()}
          disabled={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  notFound: {
    paddingHorizontal: 16,
  },
});
