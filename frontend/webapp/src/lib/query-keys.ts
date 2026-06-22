import type { OfficeType } from "@/modules/api/types"

export const queryKeys = {
  auth: {
    profile: ["auth", "profile"] as const,
  },
  users: {
    all: ["users"] as const,
    list: () => ["users", "list"] as const,
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
    list: (params: { page: number; limit: number }) =>
      ["audit", "list", { page: params.page, limit: params.limit }] as const,
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
    list: () => ["procurement-packages", "list"] as const,
    detail: (id: string) => ["procurement-packages", id] as const,
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
  },
  surveyAssignments: {
    all: ["survey-assignments"] as const,
    mine: () => ["survey-assignments", "mine"] as const,
  },
  surveyResponses: {
    all: ["survey-responses"] as const,
    list: (filter: { formId?: string; assignmentId?: string }) =>
      [
        "survey-responses",
        "list",
        { formId: filter.formId ?? null, assignmentId: filter.assignmentId ?? null },
      ] as const,
    detail: (id: string) => ["survey-responses", id] as const,
  },
}

