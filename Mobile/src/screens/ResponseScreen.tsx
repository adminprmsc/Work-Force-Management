import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SurveyFormRenderer } from '@/components/survey/survey-field-control';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Label, Muted, Text } from '@/components/ui/text';
import { isConflictError } from '@/lib/api-client';
import { getSubmissionLocation, GeolocationError } from '@/lib/device-location';
import { buildAnswers } from '@/lib/survey-answers';
import { buildPackageFieldAnswers } from '@/lib/package-field-reference';
import { layout } from '@/lib/layout';
import {
  responseIsEditable,
  responseStatusBadgeVariant,
  responseStatusLabel,
} from '@/lib/survey';
import { findBlockingResponse, periodLabel } from '@/lib/survey-frequency';
import { colors, spacing } from '@/lib/theme';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/modules/auth/auth-context';
import { fetchProcurementPackageWithCache, listSettlements } from '@/modules/api/procurement-api';
import {
  getSurveyResponse,
  listMySurveyAssignments,
  listSurveyResponses,
  saveSurveyResponse,
  startSurveyResponse,
  submitSurveyResponse,
} from '@/modules/api/survey-api';
import type {
  ProcurementPackage,
  SurveyAssignment,
  SurveyResponse,
  SurveyResponseStatus,
} from '@/modules/api/types';
import {
  cacheAssignments,
  getCachedAssignments,
  getCachedProcurementPackage,
  getOfflineDraft,
  removeOfflineDraft,
  upsertOfflineDraft,
  withdrawQueuedSubmit,
  type OfflineSurveyDraft,
} from '@/modules/offline/offline-store';

type AnswerMap = Record<string, unknown>;

function answersFromResponse(answers: { fieldId: string; value: unknown }[]): AnswerMap {
  const initial: AnswerMap = {};
  for (const answer of answers) initial[answer.fieldId] = answer.value;
  return initial;
}

export function ResponseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Response'>>();
  const { localId, assignmentId: newAssignmentId, responseId: resumeResponseId } = route.params;
  const { token, isOnline, refreshPendingCount } = useAuth();
  const insets = useSafeAreaInsets();

  const [assignment, setAssignment] = useState<SurveyAssignment | null>(null);
  const [serverResponse, setServerResponse] = useState<SurveyResponse | null>(null);
  const [pkg, setPkg] = useState<ProcurementPackage | null>(null);
  const [villageId, setVillageId] = useState('');
  const [settlementId, setSettlementId] = useState<string | null>(null);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);
  const [settlements, setSettlements] = useState<{ id: string; name: string }[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [draftLocalId, setDraftLocalId] = useState<string | null>(localId ?? null);
  const [serverResponseId, setServerResponseId] = useState<string | null>(resumeResponseId ?? null);
  const [started, setStarted] = useState(Boolean(resumeResponseId || localId));
  const [loading, setLoading] = useState(true);
  const [villagesLoading, setVillagesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [offlineDraft, setOfflineDraft] = useState<OfflineSurveyDraft | null>(null);

  const responseStatus: SurveyResponseStatus | null = serverResponse?.status ?? null;
  const readOnly = responseStatus ? !responseIsEditable(responseStatus) : false;
  const isResubmit = responseStatus === 'REVERTED';
  const reviewRemarks = serverResponse?.reviewRemarks;

  const fields = useMemo(
    () =>
      serverResponse?.formRevision.fields ??
      assignment?.formRevision.fields ??
      [],
    [serverResponse, assignment],
  );

  // Read-only package-bound fields (e.g. remaining budget) get their value from
  // the assigned package, computed live so the RA can see it before submitting.
  const packageAnswers = useMemo(
    () => (pkg ? buildPackageFieldAnswers(fields, pkg, answers, villageId || null) : {}),
    [pkg, fields, answers, villageId],
  );

  const uploadContext = useMemo(() => {
    const formId = assignment?.formId ?? serverResponse?.form.id;
    if (!formId) return undefined;
    return {
      formId,
      assignmentId: assignment?.id ?? serverResponse?.assignmentId,
      responseId: serverResponseId ?? serverResponse?.id ?? null,
    };
  }, [assignment, serverResponse, serverResponseId]);

  const displayAnswers = useMemo(
    () => ({ ...answers, ...packageAnswers }),
    [answers, packageAnswers],
  );

  const loadAssignments = useCallback(async (): Promise<SurveyAssignment[]> => {
    if (!token) return [];
    try {
      const assignments = await listMySurveyAssignments(token);
      await cacheAssignments(assignments);
      return assignments;
    } catch {
      return getCachedAssignments();
    }
  }, [token]);

  const loadPackageVillages = useCallback(
    async (packageId: string) => {
      if (!token) return;
      setVillagesLoading(true);
      try {
        const packageData = await fetchProcurementPackageWithCache(token, packageId);
        setPkg(packageData);
        setVillages(packageData.villages);
      } catch {
        const cached = await getCachedProcurementPackage(packageId);
        if (cached) {
          setPkg(cached);
          setVillages(cached.villages);
        } else {
          setVillages([]);
        }
      } finally {
        setVillagesLoading(false);
      }
    },
    [token],
  );

  const load = useCallback(async () => {
    if (!token) return;
    try {
      if (resumeResponseId) {
        if (!isOnline) {
          Alert.alert('Offline', 'Connect to the internet to open this submission.');
          navigation.goBack();
          return;
        }
        const response = await getSurveyResponse(token, resumeResponseId);
        setServerResponse(response);
        setServerResponseId(response.id);
        setVillageId(response.village.id);
        setSettlementId(response.settlement?.id ?? null);
        setAnswers(answersFromResponse(response.answers));
        setStarted(true);

        const assignments = await loadAssignments();
        const found =
          assignments.find((item) => item.id === response.assignmentId) ?? null;
        setAssignment(found);

        await loadPackageVillages(response.procurementPackage.id);

        navigation.setOptions({
          title: !responseIsEditable(response.status)
            ? 'View submission'
            : response.status === 'REVERTED'
              ? 'Edit & resubmit'
              : 'Continue draft',
        });
      } else if (localId) {
        const draft = await getOfflineDraft(localId);
        if (!draft) {
          Alert.alert('Not found', 'Draft no longer exists.');
          navigation.goBack();
          return;
        }

        const assignments = await loadAssignments();
        const currentAssignment =
          assignments.find((item) => item.id === draft.assignmentId) ?? null;
        const draftRevisionId =
          draft.formRevisionId ?? draft.assignmentSnapshot.formRevision.id;
        if (
          currentAssignment &&
          draftRevisionId !== currentAssignment.formRevision.id
        ) {
          await removeOfflineDraft(localId);
          Alert.alert(
            'Draft outdated',
            'A new form version was published. Please start a new visit.',
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
          return;
        }

        const draftAssignment = currentAssignment ?? draft.assignmentSnapshot;
        setAssignment(draftAssignment);
        setVillageId(draft.villageId);
        setSettlementId(draft.settlementId);
        setDraftLocalId(draft.localId);
        setServerResponseId(draft.serverResponseId);
        setOfflineDraft(draft);
        setStarted(true);
        setAnswers(answersFromResponse(draft.answers));

        if (draftAssignment) {
          await loadPackageVillages(draftAssignment.procurementPackage.id);
        }
      } else if (newAssignmentId) {
        const assignments = await loadAssignments();
        const found = assignments.find((item) => item.id === newAssignmentId) ?? null;
        setAssignment(found);
        if (found) {
          await loadPackageVillages(found.procurementPackage.id);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load response';
      if (message.toLowerCase().includes('new form version')) {
        Alert.alert(
          'Draft outdated',
          'A new form version was published. Please start a new visit.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }
      Alert.alert('Error', message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [token, localId, newAssignmentId, resumeResponseId, isOnline, navigation, loadAssignments, loadPackageVillages]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!token || !villageId || !isOnline || resumeResponseId) {
      if (!resumeResponseId) setSettlements([]);
      return;
    }
    void listSettlements(token, villageId).then(setSettlements).catch(() => setSettlements([]));
  }, [token, villageId, isOnline, resumeResponseId]);

  const persistOffline = async (
    pendingSubmit = false,
    submissionLocation?: {
      latitude: number;
      longitude: number;
      accuracyMeters: number | null;
      capturedAt: string;
    },
  ) => {
    if (!assignment || !villageId) return null;
    const villageName = villages.find((v) => v.id === villageId)?.name ?? 'Village';
    const settlementName = settlements.find((s) => s.id === settlementId)?.name ?? null;
    const payload = buildAnswers(fields, displayAnswers);

    return upsertOfflineDraft({
      localId: draftLocalId ?? undefined,
      assignmentId: assignment.id,
      assignmentSnapshot: assignment,
      formRevisionId: assignment.formRevision.id,
      villageId,
      villageName,
      settlementId,
      settlementName,
      visitDate: new Date().toISOString().slice(0, 10),
      serverResponseId,
      answers: payload,
      pendingSubmit,
      pendingSubmissionLocation: submissionLocation ?? null,
      status: 'pending',
    });
  };

  const ensureServerResponse = async (): Promise<string> => {
    if (serverResponseId) return serverResponseId;
    if (!token || !assignment || !villageId) {
      throw new Error('Visit context is missing.');
    }
    const created = await startSurveyResponse(token, {
      assignmentId: assignment.id,
      villageId,
      settlementId,
    });
    setServerResponse(created);
    setServerResponseId(created.id);
    return created.id;
  };

  const promptBlockingResponse = (blocking: SurveyResponse) => {
    const villageName = villages.find((v) => v.id === villageId)?.name ?? 'this village';
    if (blocking.status === 'DRAFT' || blocking.status === 'REVERTED') {
      Alert.alert(
        blocking.status === 'REVERTED' ? 'Sent back for changes' : 'Draft already exists',
        blocking.status === 'REVERTED'
          ? `A survey for ${villageName} was sent back for changes. Open it to edit and resubmit.`
          : `You already started a survey for ${villageName}. Open it to continue instead of starting a new one.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open',
            onPress: () => navigation.replace('Response', { responseId: blocking.id }),
          },
        ],
      );
      return;
    }
    const scope = assignment ? periodLabel(assignment.frequency) : '';
    Alert.alert(
      blocking.status === 'ACCEPTED' ? 'Already accepted' : 'Awaiting review',
      blocking.status === 'ACCEPTED'
        ? `A survey for ${villageName}${scope} has already been accepted. No further submission is needed.`
        : `You already submitted a survey for ${villageName}${scope} and it is awaiting review. You can submit again only if it is rejected.`,
    );
  };

  const handleStart = async () => {
    if (!assignment || !villageId) {
      Alert.alert('Select village', 'Choose the village you visited.');
      return;
    }
    // Best-effort duplicate pre-check (online only); the server enforces this
    // regardless, but checking now avoids filling out a form that would be rejected.
    if (isOnline && token) {
      setChecking(true);
      try {
        const result = await listSurveyResponses(token, {
          assignmentId: assignment.id,
          page: 1,
          limit: 100,
        });
        const blocking = findBlockingResponse(result.items, {
          assignmentId: assignment.id,
          villageId,
          settlementId,
          frequency: assignment.frequency,
        });
        if (blocking) {
          promptBlockingResponse(blocking);
          return;
        }
      } catch {
        // Ignore — fall through and let the server enforce on save/submit.
      } finally {
        setChecking(false);
      }
    }
    setStarted(true);
  };

  const handleWithdrawQueue = () => {
    if (!draftLocalId) return;
    Alert.alert(
      'Withdraw from queue?',
      'The submit will be cancelled. Your answers stay saved as a draft on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: () => {
            void (async () => {
              const updated = await withdrawQueuedSubmit(draftLocalId);
              if (updated) setOfflineDraft(updated);
              await refreshPendingCount();
            })();
          },
        },
      ],
    );
  };

  const handleDiscardDraft = () => {
    if (!draftLocalId) return;
    Alert.alert(
      'Discard draft?',
      'This removes the local copy from your device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await removeOfflineDraft(draftLocalId);
              await refreshPendingCount();
              navigation.goBack();
            })();
          },
        },
      ],
    );
  };

  const handleSaveDraft = async () => {
    if (readOnly || (!assignment && !serverResponse)) return;
    setSaving(true);
    const payload = buildAnswers(fields, displayAnswers);
    try {
      if (isOnline && token) {
        const id = await ensureServerResponse();
        const saved = await saveSurveyResponse(token, id, { answers: payload });
        setServerResponse(saved);
        Alert.alert('Saved', 'Draft saved to server.');
      } else {
        const draft = await persistOffline(false);
        if (draft) setDraftLocalId(draft.localId);
        Alert.alert('Saved offline', 'Draft stored on this device.');
      }
    } catch (err) {
      if (isConflictError(err)) {
        Alert.alert(
          'Cannot save',
          err instanceof Error ? err.message : 'This survey already exists.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }
      const draft = await persistOffline(false);
      if (draft) setDraftLocalId(draft.localId);
      Alert.alert(
        'Saved locally',
        err instanceof Error ? `${err.message} — stored on device for sync.` : 'Stored on device.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (readOnly || (!assignment && !serverResponse)) return;
    setSaving(true);
    const payload = buildAnswers(fields, displayAnswers);
    try {
      const location = await getSubmissionLocation();
      if (isOnline && token) {
        const id = await ensureServerResponse();
        const submitted = await submitSurveyResponse(token, id, {
          answers: payload,
          latitude: location.latitude,
          longitude: location.longitude,
          locationAccuracyMeters: location.accuracyMeters ?? null,
        });
        setServerResponse(submitted);
        Alert.alert(
          isResubmit ? 'Resubmitted' : 'Submitted',
          isResubmit
            ? 'Survey resubmitted for review with your live GPS location.'
            : 'Survey submitted successfully with your live GPS location.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        await persistOffline(true, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracyMeters: location.accuracyMeters ?? null,
          capturedAt: new Date().toISOString(),
        });
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
      if (err instanceof GeolocationError) {
        Alert.alert('Location required', err.message);
        return;
      }
      if (isConflictError(err)) {
        Alert.alert(
          'Cannot submit',
          err instanceof Error ? err.message : 'This survey already exists.',
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
        return;
      }
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

  const displayAssignment = assignment ?? (serverResponse ? null : null);
  const title =
    serverResponse?.form.title ?? displayAssignment?.formTitle ?? 'Survey';
  const packageName =
    serverResponse?.procurementPackage.name ??
    displayAssignment?.procurementPackage.name;

  if (!assignment && !serverResponse) {
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
            <CardTitle>{title}</CardTitle>
            <CardDescription style={layout.mtSm}>{packageName}</CardDescription>
          </Card>

          <Label>Select village *</Label>
          {villagesLoading ? (
            <Muted style={layout.mbMd}>Loading villages…</Muted>
          ) : villages.length === 0 ? (
            <Muted style={layout.mbMd}>
              {isOnline
                ? 'No villages linked to this package.'
                : 'Connect once to cache package villages, or pull to refresh assignments while online.'}
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
            label={checking ? 'Checking…' : 'Start visit'}
            onPress={() => void handleStart()}
            disabled={!villageId || checking || villagesLoading}
          />
        </ScrollView>
      ) : (
        <>
          {responseStatus ? (
            <View style={styles.statusBar}>
              <Badge
                label={responseStatusLabel(responseStatus)}
                variant={responseStatusBadgeVariant(responseStatus)}
              />
              {readOnly ? (
                <Muted style={styles.statusHint}>
                  {responseStatus === 'SUBMITTED'
                    ? 'Pending review — you cannot edit until a reviewer acts.'
                    : responseStatus === 'ACCEPTED'
                      ? 'Accepted — this visit counts in dashboards and budgets.'
                      : responseStatus === 'REJECTED'
                        ? 'Rejected — this submission is closed.'
                        : 'Read-only view.'}
                </Muted>
              ) : null}
            </View>
          ) : null}

          {reviewRemarks && isResubmit ? (
            <View style={styles.reviewBanner}>
              <Text style={styles.reviewBannerTitle}>
                Reviewer feedback — please address and resubmit
              </Text>
              <Text style={styles.reviewBannerBody}>{reviewRemarks}</Text>
            </View>
          ) : null}

          {offlineDraft?.pendingSubmit ? (
            <View style={styles.queueBanner}>
              <Text style={styles.queueBannerTitle}>Submit queued for upload</Text>
              <Muted style={styles.queueBannerBody}>
                This visit will submit automatically when you sync. Withdraw to edit again, or
                discard to remove it from this device.
              </Muted>
              <View style={styles.queueActions}>
                <Button
                  style={layout.flexButton}
                  variant="outline"
                  size="sm"
                  label="Withdraw"
                  onPress={handleWithdrawQueue}
                />
                <Button
                  style={layout.flexButton}
                  variant="outline"
                  size="sm"
                  label="Discard"
                  onPress={handleDiscardDraft}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.form}>
            <SurveyFormRenderer
              fields={fields}
              answers={displayAnswers}
              onChange={(fieldId, value) =>
                setAnswers((current) => ({ ...current, [fieldId]: value }))
              }
              readOnly={readOnly}
              uploadContext={uploadContext}
              token={token}
              isOnline={isOnline}
            />
          </View>

          {readOnly ? null : (
            <View
              style={[
                styles.actionBar,
                { paddingBottom: Math.max(insets.bottom, spacing.lg) },
              ]}
            >
              <Muted style={styles.gpsHint}>
                Submit captures your live GPS location to verify the site visit.
              </Muted>
              <View style={styles.actionButtons}>
                <Button
                  style={layout.flexButton}
                  variant="outline"
                  label="Save draft"
                  onPress={() => void handleSaveDraft()}
                  disabled={saving}
                />
                <Button
                  style={layout.flexButton}
                  label={isResubmit ? 'Resubmit for review' : 'Submit'}
                  onPress={() => void handleSubmit()}
                  disabled={saving}
                />
              </View>
            </View>
          )}
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
  statusBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 6,
  },
  statusHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  reviewBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  reviewBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.amber900,
  },
  reviewBannerBody: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: colors.slate700,
  },
  queueBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: spacing.sm,
  },
  queueBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.amber900,
  },
  queueBannerBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  queueActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    minHeight: 0,
  },
  actionBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gpsHint: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
});
