import type { OfficeType } from "@/modules/api/types"

export const queryKeys = {
  auth: {
    profile: ["auth", "profile"] as const,
  },
  users: {
    all: ["users"] as const,
    list: () => ["users", "list"] as const,
    detail: (userId: string) => ["users", "detail", userId] as const,
  },
  offices: {
    all: ["offices"] as const,
    list: (type?: OfficeType) => ["offices", "list", { type: type ?? null }] as const,
  },
  tehsils: {
    all: ["tehsils"] as const,
    list: () => ["tehsils", "list"] as const,
    villages: (tehsilId: string) => ["tehsils", tehsilId, "villages"] as const,
    settlements: (villageId: string) => ["villages", villageId, "settlements"] as const,
  },
  audit: {
    list: (params: {
      page: number
      limit: number
      resourceType?: string | null
      resourceId?: string | null
      action?: string | null
      actorId?: string | null
      userId?: string | null
      search?: string | null
    }) =>
      [
        "audit",
        "list",
        {
          page: params.page,
          limit: params.limit,
          resourceType: params.resourceType ?? null,
          resourceId: params.resourceId ?? null,
          action: params.action ?? null,
          actorId: params.actorId ?? null,
          userId: params.userId ?? null,
          search: params.search?.trim() || null,
        },
      ] as const,
  },
  contractors: {
    all: ["contractors"] as const,
    list: () => ["contractors", "list"] as const,
  },
  consultants: {
    all: ["consultants"] as const,
    list: () => ["consultants", "list"] as const,
  },
  procurementPackages: {
    all: ["procurement-packages"] as const,
    list: (params: { page?: number; limit?: number } = {}) =>
      [
        "procurement-packages",
        "list",
        {
          page: params.page ?? 1,
          limit: params.limit ?? 25,
        },
      ] as const,
    detail: (id: string) => ["procurement-packages", id] as const,
    activity: (id: string, params: { page?: number; limit?: number } = {}) =>
      [
        "procurement-packages",
        id,
        "activity",
        { page: params.page ?? 1, limit: params.limit ?? 50 },
      ] as const,
    baseline: (packageId: string, formId: string) =>
      ["procurement-packages", packageId, "baseline", formId] as const,
    baselineForms: (packageId: string) =>
      ["procurement-packages", packageId, "baseline-forms"] as const,
    namePreview: (tehsilId: string) =>
      ["procurement-packages", "name-preview", tehsilId] as const,
  },
  surveyForms: {
    all: ["survey-forms"] as const,
    list: () => ["survey-forms", "list"] as const,
    detail: (id: string) => ["survey-forms", id] as const,
    assignments: (id: string) => ["survey-forms", id, "assignments"] as const,
    analytics: (
      id: string,
      filter: {
        procurementPackageId?: string | null
        submittedFrom?: string | null
        submittedTo?: string | null
      } = {},
    ) =>
      [
        "survey-forms",
        id,
        "analytics",
        {
          procurementPackageId: filter.procurementPackageId ?? null,
          submittedFrom: filter.submittedFrom ?? null,
          submittedTo: filter.submittedTo ?? null,
        },
      ] as const,
  },
  surveyAssignments: {
    all: ["survey-assignments"] as const,
    mine: () => ["survey-assignments", "mine"] as const,
  },
  surveyResponses: {
    all: ["survey-responses"] as const,
    list: (filter: {
      formId?: string
      tehsilId?: string
      assignmentId?: string
      status?: string
      page?: number
      limit?: number
    } = {}) =>
      [
        "survey-responses",
        "list",
        {
          formId: filter.formId ?? null,
          tehsilId: filter.tehsilId ?? null,
          assignmentId: filter.assignmentId ?? null,
          status: filter.status ?? null,
          page: filter.page ?? 1,
          limit: filter.limit ?? 25,
        },
      ] as const,
    detail: (id: string) => ["survey-responses", id] as const,
  },
  storage: {
    attachmentUrl: (id: string) => ["storage", "attachment-url", id] as const,
  },
}

