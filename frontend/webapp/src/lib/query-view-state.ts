import type { UseQueryResult } from "@tanstack/react-query"

import { getQueryErrorMessage } from "@/lib/query-error"

export type QueryViewState<T> = {
  data: T | undefined
  error: string | null
  isInitialLoading: boolean
  isRefreshing: boolean
}

type QuerySlice = Pick<UseQueryResult<unknown>, "data" | "error" | "isPending" | "isFetching">

export function getQueryViewState<T>(query: QuerySlice): QueryViewState<T> {
  return {
    data: query.data as T | undefined,
    error: getQueryErrorMessage(query.error),
    isInitialLoading: query.isPending,
    isRefreshing: query.isFetching && !query.isPending,
  }
}

export function mergeQueryViewStates(states: QueryViewState<unknown>[]): QueryViewState<unknown> {
  return {
    data: undefined,
    error: states.find((state) => state.error)?.error ?? null,
    isInitialLoading: states.some((state) => state.isInitialLoading),
    isRefreshing: states.some((state) => state.isRefreshing),
  }
}
