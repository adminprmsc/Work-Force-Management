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
    namePreview: (tehsilId: string) =>
      ["procurement-packages", "name-preview", tehsilId] as const,
  },
}

