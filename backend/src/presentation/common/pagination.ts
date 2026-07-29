import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export const PAGINATION_PAGE_SIZES = [25, 50, 100] as const;
export type PaginationPageSize = (typeof PAGINATION_PAGE_SIZES)[number];
export const DEFAULT_PAGE_SIZE: PaginationPageSize = 25;

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([...PAGINATION_PAGE_SIZES])
  limit?: number;
}

export type PaginationParams = {
  page: number;
  limit: PaginationPageSize;
  skip: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export function resolvePagination(
  query?: { page?: number; limit?: number },
): PaginationParams {
  const page = Math.max(1, query?.page ?? 1);
  const requested = query?.limit ?? DEFAULT_PAGE_SIZE;
  const limit = (PAGINATION_PAGE_SIZES as readonly number[]).includes(requested)
    ? (requested as PaginationPageSize)
    : DEFAULT_PAGE_SIZE;
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: PaginationParams,
): PaginatedResult<T> {
  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
  };
}
