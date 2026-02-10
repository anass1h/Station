/**
 * Re-export des types de pagination depuis interfaces.
 * Évite la duplication.
 */
export type {
  PaginatedResponse,
  PaginationMeta,
} from '../interfaces/paginated-result.interface.js';
export { buildPaginatedResponse } from '../interfaces/paginated-result.interface.js';

/**
 * Interface standard pour les réponses de succès simples.
 */
export interface SuccessResponse {
  message: string;
}

/**
 * Interface standard pour les réponses d'erreur.
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
