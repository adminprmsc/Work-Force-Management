import NetInfo from '@react-native-community/netinfo';

import { isConflictError } from '@/lib/api-client';
import {
  cacheAssignments,
  getCachedAssignments,
  listOfflineBaselines,
  listOfflineDrafts,
  purgeStaleOfflineDrafts,
  removeOfflineBaseline,
  removeOfflineDraft,
  upsertOfflineDraft,
  type OfflineBaselineDraft,
  type OfflineSurveyDraft,
} from '@/modules/offline/offline-store';
import { savePackageFormBaseline } from '@/modules/api/procurement-api';
import {
  listMySurveyAssignments,
  saveSurveyResponse,
  startSurveyResponse,
  submitSurveyResponse,
} from '@/modules/api/survey-api';
import type { SurveyAnswer } from '@/modules/api/types';

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

async function syncDraft(token: string, draft: OfflineSurveyDraft): Promise<void> {
  let serverId = draft.serverResponseId;

  if (!serverId) {
    const created = await startSurveyResponse(token, {
      assignmentId: draft.assignmentId,
      villageId: draft.villageId,
      settlementId: draft.settlementId,
      visitDate: draft.visitDate,
    });
    serverId = created.id;
    await upsertOfflineDraft({
      ...draft,
      localId: draft.localId,
      serverResponseId: serverId,
      status: 'syncing',
    });
  }

  const answersPayload = { answers: draft.answers as SurveyAnswer[] };

  if (draft.pendingSubmit) {
    if (!draft.pendingSubmissionLocation) {
      throw new Error('Queued submit is missing GPS location. Open the draft and submit again.');
    }
    await submitSurveyResponse(token, serverId, {
      answers: draft.answers as SurveyAnswer[],
      latitude: draft.pendingSubmissionLocation.latitude,
      longitude: draft.pendingSubmissionLocation.longitude,
      locationAccuracyMeters: draft.pendingSubmissionLocation.accuracyMeters,
    });
    await upsertOfflineDraft({
      ...draft,
      localId: draft.localId,
      serverResponseId: serverId,
      status: 'submitted',
      pendingSubmit: false,
    });
    await removeOfflineDraft(draft.localId);
    return;
  }

  await saveSurveyResponse(token, serverId, answersPayload);
  await upsertOfflineDraft({
    ...draft,
    localId: draft.localId,
    serverResponseId: serverId,
    status: 'synced',
    pendingSubmit: false,
  });
}

async function syncBaseline(token: string, item: OfflineBaselineDraft): Promise<void> {
  await savePackageFormBaseline(token, item.packageId, item.formId, {
    answers: item.answers,
  });
  await removeOfflineBaseline(item.localId);
}

export type SyncResult = {
  synced: number;
  failed: number;
  errors: string[];
};

export async function syncOfflineQueue(token: string): Promise<SyncResult> {
  const online = await isOnline();
  if (!online) {
    return { synced: 0, failed: 0, errors: [] };
  }

  try {
    const assignments = await listMySurveyAssignments(token);
    await cacheAssignments(assignments);
    await purgeStaleOfflineDrafts(assignments);
  } catch {
    await purgeStaleOfflineDrafts(await getCachedAssignments());
  }

  const [drafts, baselines] = await Promise.all([
    listOfflineDrafts(),
    listOfflineBaselines(),
  ]);

  const pendingDrafts = drafts.filter(
    (d) =>
      d.status === 'pending' ||
      d.status === 'failed' ||
      d.pendingSubmit ||
      !d.serverResponseId,
  );
  const pendingBaselines = baselines.filter(
    (b) => b.status === 'pending' || b.status === 'failed',
  );

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const draft of pendingDrafts) {
    try {
      await syncDraft(token, draft);
      synced += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      // A conflict (e.g. a survey for this village/settlement already exists for
      // the period) can never sync — drop the redundant draft and report why.
      if (isConflictError(err)) {
        await removeOfflineDraft(draft.localId);
        errors.push(message);
        continue;
      }
      failed += 1;
      errors.push(message);
      await upsertOfflineDraft({
        ...draft,
        localId: draft.localId,
        status: 'failed',
        error: message,
      });
    }
  }

  for (const baseline of pendingBaselines) {
    try {
      await syncBaseline(token, baseline);
      synced += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : 'Baseline sync failed';
      errors.push(message);
    }
  }

  return { synced, failed, errors };
}
