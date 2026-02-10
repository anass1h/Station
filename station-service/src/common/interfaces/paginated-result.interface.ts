/**
 * Interface générique pour les résultats de requêtes paginées Prisma.
 */
export interface PaginatedQueryParams {
  skip: number;
  take: number;
  orderBy: Record<string, 'asc' | 'desc'>;
}

/**
 * Helper pour convertir PaginationDto en paramètres Prisma.
 */
export function toPrismaQuery(
  page: number,
  perPage: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): PaginatedQueryParams {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
    orderBy: { [sortBy]: sortOrder },
  };
}

/**
 * Interface pour les paramètres de filtrage par date.
 */
export interface DateRangeParams {
  gte?: Date;
  lte?: Date;
}

/**
 * Helper pour construire un filtre de plage de dates Prisma.
 */
export function toDateRangeFilter(
  dateFrom?: string,
  dateTo?: string,
): DateRangeParams | undefined {
  if (!dateFrom && !dateTo) return undefined;

  return {
    ...(dateFrom && { gte: new Date(dateFrom) }),
    ...(dateTo && { lte: new Date(dateTo) }),
  };
}

/**
 * Interface pour les métadonnées de pagination.
 */
export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * Interface générique pour les réponses paginées.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Helper pour construire une réponse paginée standardisée.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}
