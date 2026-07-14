import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  ProcurementPackage,
  SurveyAnswer,
  SurveyAssignment,
  SurveySubmissionLocation,
} from '@/modules/api/types';

const ASSIGNMENTS_CACHE_KEY = 'wfm.mobile.cache.assignments';
const PACKAGES_CACHE_KEY = 'wfm.mobile.cache.packages';
const DRAFTS_KEY = 'wfm.mobile.offline.drafts';
const BASELINE_QUEUE_KEY = 'wfm.mobile.offline.baselines';

export type OfflineDraftStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'submitted';

export type OfflineSurveyDraft = {
  localId: string;
  assignmentId: string;
  assignmentSnapshot: SurveyAssignment;
  formRevisionId: string;
  villageId: string;
  villageName: string;
  settlementId: string | null;
  settlementName: string | null;
  visitDate: string | null;
  serverResponseId: string | null;
  answers: SurveyAnswer[];
  pendingSubmit: boolean;
  pendingSubmissionLocation: SurveySubmissionLocation | null;
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

export async function cacheProcurementPackage(pkg: ProcurementPackage): Promise<void> {
  const raw = await AsyncStorage.getItem(PACKAGES_CACHE_KEY);
  let map: Record<string, ProcurementPackage> = {};
  if (raw) {
    try {
      map = JSON.parse(raw) as Record<string, ProcurementPackage>;
    } catch {
      map = {};
    }
  }
  map[pkg.id] = pkg;
  await AsyncStorage.setItem(PACKAGES_CACHE_KEY, JSON.stringify(map));
}

export async function getCachedProcurementPackage(
  packageId: string,
): Promise<ProcurementPackage | null> {
  const raw = await AsyncStorage.getItem(PACKAGES_CACHE_KEY);
  if (!raw) return null;
  try {
    const map = JSON.parse(raw) as Record<string, ProcurementPackage>;
    return map[packageId] ?? null;
  } catch {
    return null;
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
        formRevisionId:
          input.formRevisionId ??
          existing.formRevisionId ??
          existing.assignmentSnapshot.formRevision.id,
        createdAt: existing.createdAt,
        updatedAt: now,
        status: input.status ?? existing.status,
        error: input.error ?? null,
        pendingSubmissionLocation:
          input.pendingSubmissionLocation ?? existing.pendingSubmissionLocation ?? null,
      }
    : {
        localId: input.localId ?? newLocalId(),
        assignmentId: input.assignmentId,
        assignmentSnapshot: input.assignmentSnapshot,
        formRevisionId: input.formRevisionId,
        villageId: input.villageId,
        villageName: input.villageName,
        settlementId: input.settlementId,
        settlementName: input.settlementName,
        visitDate: input.visitDate,
        serverResponseId: input.serverResponseId,
        answers: input.answers,
        pendingSubmit: input.pendingSubmit,
        pendingSubmissionLocation: input.pendingSubmissionLocation ?? null,
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

/** Cancel a queued submit; keeps the draft on device for editing. */
export async function withdrawQueuedSubmit(
  localId: string,
): Promise<OfflineSurveyDraft | null> {
  const drafts = await readDrafts();
  const draft = drafts.find((d) => d.localId === localId);
  if (!draft?.pendingSubmit) return null;

  const updated: OfflineSurveyDraft = {
    ...draft,
    pendingSubmit: false,
    pendingSubmissionLocation: null,
    status: 'pending',
    error: null,
    updatedAt: new Date().toISOString(),
  };
  await writeDrafts(
    drafts.map((item) => (item.localId === localId ? updated : item)),
  );
  return updated;
}

function draftRevisionId(draft: OfflineSurveyDraft): string {
  return draft.formRevisionId ?? draft.assignmentSnapshot.formRevision.id;
}

/** Drop device drafts tied to a superseded form revision after republish. */
export async function purgeStaleOfflineDrafts(
  assignments: SurveyAssignment[],
): Promise<number> {
  const revisionByAssignment = new Map(
    assignments.map((assignment) => [assignment.id, assignment.formRevision.id]),
  );
  const drafts = await readDrafts();
  const staleIds = new Set(
    drafts
      .filter((draft) => {
        const currentRevisionId = revisionByAssignment.get(draft.assignmentId);
        if (!currentRevisionId) return false;
        return draftRevisionId(draft) !== currentRevisionId;
      })
      .map((draft) => draft.localId),
  );
  if (staleIds.size === 0) return 0;
  await writeDrafts(drafts.filter((draft) => !staleIds.has(draft.localId)));
  return staleIds.size;
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
