import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SurveyAnswer, SurveyAssignment } from '@/modules/api/types';

const ASSIGNMENTS_CACHE_KEY = 'wfm.mobile.cache.assignments';
const DRAFTS_KEY = 'wfm.mobile.offline.drafts';
const BASELINE_QUEUE_KEY = 'wfm.mobile.offline.baselines';

export type OfflineDraftStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'submitted';

export type OfflineSurveyDraft = {
  localId: string;
  assignmentId: string;
  assignmentSnapshot: SurveyAssignment;
  villageId: string;
  villageName: string;
  settlementId: string | null;
  settlementName: string | null;
  visitDate: string | null;
  serverResponseId: string | null;
  answers: SurveyAnswer[];
  pendingSubmit: boolean;
  status: OfflineDraftStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OfflineBaselineDraft = {
  localId: string;
  packageId: string;
  formId: string;
  formTitle: string;
  answers: SurveyAnswer[];
  status: OfflineDraftStatus;
  error: string | null;
  updatedAt: string;
};

function newLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function cacheAssignments(assignments: SurveyAssignment[]): Promise<void> {
  await AsyncStorage.setItem(ASSIGNMENTS_CACHE_KEY, JSON.stringify(assignments));
}

export async function getCachedAssignments(): Promise<SurveyAssignment[]> {
  const raw = await AsyncStorage.getItem(ASSIGNMENTS_CACHE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SurveyAssignment[];
  } catch {
    return [];
  }
}

async function readDrafts(): Promise<OfflineSurveyDraft[]> {
  const raw = await AsyncStorage.getItem(DRAFTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OfflineSurveyDraft[];
  } catch {
    return [];
  }
}

async function writeDrafts(drafts: OfflineSurveyDraft[]): Promise<void> {
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export async function listOfflineDrafts(): Promise<OfflineSurveyDraft[]> {
  return readDrafts();
}

export async function getOfflineDraft(localId: string): Promise<OfflineSurveyDraft | null> {
  const drafts = await readDrafts();
  return drafts.find((d) => d.localId === localId) ?? null;
}

export async function upsertOfflineDraft(
  input: Omit<OfflineSurveyDraft, 'localId' | 'createdAt' | 'updatedAt' | 'status' | 'error'> & {
    localId?: string;
    status?: OfflineDraftStatus;
    error?: string | null;
  },
): Promise<OfflineSurveyDraft> {
  const drafts = await readDrafts();
  const now = new Date().toISOString();
  const existing = input.localId
    ? drafts.find((d) => d.localId === input.localId)
    : drafts.find(
        (d) =>
          d.assignmentId === input.assignmentId &&
          d.villageId === input.villageId &&
          d.status !== 'submitted' &&
          d.status !== 'synced',
      );

  const draft: OfflineSurveyDraft = existing
    ? {
        ...existing,
        ...input,
        localId: existing.localId,
        createdAt: existing.createdAt,
        updatedAt: now,
        status: input.status ?? existing.status,
        error: input.error ?? null,
      }
    : {
        localId: input.localId ?? newLocalId(),
        assignmentId: input.assignmentId,
        assignmentSnapshot: input.assignmentSnapshot,
        villageId: input.villageId,
        villageName: input.villageName,
        settlementId: input.settlementId,
        settlementName: input.settlementName,
        visitDate: input.visitDate,
        serverResponseId: input.serverResponseId,
        answers: input.answers,
        pendingSubmit: input.pendingSubmit,
        status: input.status ?? 'pending',
        error: null,
        createdAt: now,
        updatedAt: now,
      };

  const next = existing
    ? drafts.map((d) => (d.localId === draft.localId ? draft : d))
    : [...drafts, draft];
  await writeDrafts(next);
  return draft;
}

export async function removeOfflineDraft(localId: string): Promise<void> {
  const drafts = await readDrafts();
  await writeDrafts(drafts.filter((d) => d.localId !== localId));
}

async function readBaselineQueue(): Promise<OfflineBaselineDraft[]> {
  const raw = await AsyncStorage.getItem(BASELINE_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OfflineBaselineDraft[];
  } catch {
    return [];
  }
}

async function writeBaselineQueue(items: OfflineBaselineDraft[]): Promise<void> {
  await AsyncStorage.setItem(BASELINE_QUEUE_KEY, JSON.stringify(items));
}

export async function listOfflineBaselines(): Promise<OfflineBaselineDraft[]> {
  return readBaselineQueue();
}

export async function queueOfflineBaseline(input: {
  packageId: string;
  formId: string;
  formTitle: string;
  answers: SurveyAnswer[];
}): Promise<OfflineBaselineDraft> {
  const items = await readBaselineQueue();
  const now = new Date().toISOString();
  const existing = items.find(
    (item) => item.packageId === input.packageId && item.formId === input.formId,
  );

  const draft: OfflineBaselineDraft = existing
    ? { ...existing, answers: input.answers, status: 'pending', error: null, updatedAt: now }
    : {
        localId: newLocalId(),
        packageId: input.packageId,
        formId: input.formId,
        formTitle: input.formTitle,
        answers: input.answers,
        status: 'pending',
        error: null,
        updatedAt: now,
      };

  const next = existing
    ? items.map((item) => (item.localId === draft.localId ? draft : item))
    : [...items, draft];
  await writeBaselineQueue(next);
  return draft;
}

export async function removeOfflineBaseline(localId: string): Promise<void> {
  const items = await readBaselineQueue();
  await writeBaselineQueue(items.filter((item) => item.localId !== localId));
}

export async function pendingSyncCount(): Promise<number> {
  const [drafts, baselines] = await Promise.all([readDrafts(), readBaselineQueue()]);
  const draftCount = drafts.filter(
    (d) => d.status === 'pending' || d.status === 'failed' || d.pendingSubmit,
  ).length;
  const baselineCount = baselines.filter(
    (b) => b.status === 'pending' || b.status === 'failed',
  ).length;
  return draftCount + baselineCount;
}
