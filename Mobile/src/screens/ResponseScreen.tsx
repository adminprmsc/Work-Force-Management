import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SurveyFormRenderer } from '@/components/survey/survey-field-control';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Label, Muted, Text } from '@/components/ui/text';
import { buildAnswers } from '@/lib/survey-answers';
import { layout } from '@/lib/layout';
import { colors } from '@/lib/theme';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/modules/auth/auth-context';
import { getProcurementPackage, listSettlements } from '@/modules/api/procurement-api';
import {
  listMySurveyAssignments,
  saveSurveyResponse,
  startSurveyResponse,
  submitSurveyResponse,
} from '@/modules/api/survey-api';
import type { SurveyAssignment } from '@/modules/api/types';
import {
  getCachedAssignments,
  getOfflineDraft,
  upsertOfflineDraft,
} from '@/modules/offline/offline-store';

type AnswerMap = Record<string, unknown>;

export function ResponseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Response'>>();
  const { localId, assignmentId: newAssignmentId } = route.params;
  const { token, isOnline } = useAuth();

  const [assignment, setAssignment] = useState<SurveyAssignment | null>(null);
  const [villageId, setVillageId] = useState('');
  const [settlementId, setSettlementId] = useState<string | null>(null);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);
  const [settlements, setSettlements] = useState<{ id: string; name: string }[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [draftLocalId, setDraftLocalId] = useState<string | null>(localId ?? null);
  const [serverResponseId, setServerResponseId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fields = useMemo(() => assignment?.formRevision.fields ?? [], [assignment]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      if (localId) {
        const draft = await getOfflineDraft(localId);
        if (!draft) {
          Alert.alert('Not found', 'Draft no longer exists.');
          navigation.goBack();
          return;
        }
        setAssignment(draft.assignmentSnapshot);
        setVillageId(draft.villageId);
        setSettlementId(draft.settlementId);
        setDraftLocalId(draft.localId);
        setServerResponseId(draft.serverResponseId);
        setStarted(true);
        const initial: AnswerMap = {};
        for (const answer of draft.answers) initial[answer.fieldId] = answer.value;
        setAnswers(initial);
      } else if (newAssignmentId) {
        let assignments: SurveyAssignment[];
        if (isOnline) {
          assignments = await listMySurveyAssignments(token);
        } else {
          assignments = await getCachedAssignments();
        }
        const found = assignments.find((item) => item.id === newAssignmentId) ?? null;
        setAssignment(found);
        if (found && isOnline) {
          const pkg = await getProcurementPackage(token, found.procurementPackage.id);
          setVillages(pkg.villages);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [token, localId, newAssignmentId, isOnline, navigation]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!token || !villageId || !isOnline) {
      setSettlements([]);
      return;
    }
    void listSettlements(token, villageId).then(setSettlements).catch(() => setSettlements([]));
  }, [token, villageId, isOnline]);

  const setAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const persistOffline = async (pendingSubmit = false) => {
    if (!assignment || !villageId) return null;
    const villageName = villages.find((v) => v.id === villageId)?.name ?? 'Village';
    const settlementName = settlements.find((s) => s.id === settlementId)?.name ?? null;
    const payload = buildAnswers(fields, answers);

    return upsertOfflineDraft({
      localId: draftLocalId ?? undefined,
      assignmentId: assignment.id,
      assignmentSnapshot: assignment,
      villageId,
      villageName,
      settlementId,
      settlementName,
      visitDate: new Date().toISOString().slice(0, 10),
      serverResponseId,
      answers: payload,
      pendingSubmit,
      status: 'pending',
    });
  };

  const handleStart = async () => {
    if (!assignment || !villageId) {
      Alert.alert('Select village', 'Choose the village you visited.');
      return;
    }

    setSaving(true);
    try {
      if (isOnline && token) {
        const created = await startSurveyResponse(token, {
          assignmentId: assignment.id,
          villageId,
          settlementId,
        });
        setServerResponseId(created.id);
        setStarted(true);
        const initial: AnswerMap = {};
        for (const answer of created.answers) initial[answer.fieldId] = answer.value;
        setAnswers(initial);
        Alert.alert('Started', 'Fill in the survey and save your draft.');
      } else {
        const draft = await persistOffline(false);
        if (draft) {
          setDraftLocalId(draft.localId);
          setStarted(true);
          Alert.alert('Saved offline', 'Visit saved on device. Sync when online to upload.');
          navigation.replace('Response', { localId: draft.localId });
        }
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not start visit');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!assignment) return;
    setSaving(true);
    const payload = buildAnswers(fields, answers);
    try {
      if (isOnline && token && serverResponseId) {
        await saveSurveyResponse(token, serverResponseId, { answers: payload });
        Alert.alert('Saved', 'Draft saved to server.');
      } else {
        await persistOffline(false);
        Alert.alert('Saved offline', 'Draft stored on this device.');
      }
    } catch (err) {
      await persistOffline(false);
      Alert.alert(
        'Saved locally',
        err instanceof Error ? `${err.message} — stored on device for sync.` : 'Stored on device.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    setSaving(true);
    const payload = buildAnswers(fields, answers);
    try {
      if (isOnline && token && serverResponseId) {
        await submitSurveyResponse(token, serverResponseId, { answers: payload });
        Alert.alert('Submitted', 'Survey submitted successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await persistOffline(true);
        Alert.alert(
          'Queued for submit',
          'You are offline. The survey will submit automatically when connected.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('MainDrawer', { screen: 'Drafts' }),
            },
          ],
        );
      }
    } catch (err) {
      await persistOffline(true);
      Alert.alert('Queued', err instanceof Error ? err.message : 'Queued for sync when online.');
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

  if (!assignment) {
    return (
      <View style={[layout.center, styles.notFound]}>
        <Text>Assignment not available.</Text>
      </View>
    );
  }

  return (
    <View style={layout.screen}>
      {!started ? (
        <ScrollView style={layout.flex1} contentContainerStyle={styles.scroll}>
          <Card style={layout.mbMd}>
            <CardTitle>{assignment.formTitle}</CardTitle>
            <CardDescription style={layout.mtSm}>
              {assignment.procurementPackage.name}
            </CardDescription>
          </Card>

          <Label>Select village *</Label>
          {villages.length === 0 ? (
            <Muted style={layout.mbMd}>
              {isOnline ? 'Loading villages…' : 'Connect once to cache package villages.'}
            </Muted>
          ) : (
            <View style={[layout.mbMd, styles.options]}>
              {villages.map((village) => (
                <Pressable
                  key={village.id}
                  onPress={() => {
                    setVillageId(village.id);
                    setSettlementId(null);
                  }}
                  style={[layout.option, villageId === village.id && layout.optionSelected]}
                >
                  <Text>{village.name}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {settlements.length > 0 ? (
            <>
              <Label>Settlement (optional)</Label>
              <View style={[layout.mbMd, styles.options]}>
                {settlements.map((settlement) => (
                  <Pressable
                    key={settlement.id}
                    onPress={() => setSettlementId(settlement.id)}
                    style={[layout.option, settlementId === settlement.id && layout.optionSelected]}
                  >
                    <Text>{settlement.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <Button
            label={saving ? 'Starting…' : 'Start visit'}
            onPress={() => void handleStart()}
            disabled={saving || !villageId}
          />
        </ScrollView>
      ) : (
        <>
          <View style={styles.form}>
            <SurveyFormRenderer fields={fields} answers={answers} onChange={setAnswer} />
          </View>
          <View style={layout.footerActions}>
            <Button
              style={layout.flexButton}
              variant="outline"
              label="Save draft"
              onPress={() => void handleSaveDraft()}
              disabled={saving}
            />
            <Button
              style={layout.flexButton}
              label="Submit"
              onPress={() => void handleSubmit()}
              disabled={saving}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
  },
  notFound: {
    paddingHorizontal: 16,
  },
  options: {
    gap: 8,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
