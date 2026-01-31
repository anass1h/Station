import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, string[]>;
}

export interface StandardError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string[]>;
}

/**
 * Messages d'erreur en français
 */
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Données invalides. Vérifiez votre saisie.',
  401: 'Session expirée. Veuillez vous reconnecter.',
  403: 'Accès non autorisé.',
  404: 'Ressource non trouvée.',
  409: 'Conflit. Cette donnée existe déjà.',
  422: 'Données invalides. Vérifiez les champs.',
  429: 'Trop de requêtes. Réessayez dans quelques instants.',
  500: 'Erreur serveur. Réessayez plus tard.',
  502: 'Service temporairement indisponible.',
  503: 'Service en maintenance. Réessayez plus tard.',
  504: 'Le serveur met trop de temps à répondre.',
};

/**
 * Extrait le message d'erreur d'une erreur Axios
 */
export function handleApiError(error: unknown): string {
  // Erreur Axios
  if (error instanceof AxiosError) {
    // Erreur réseau (pas de réponse du serveur)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'Le serveur met trop de temps à répondre.';
      }
      if (error.code === 'ERR_NETWORK') {
        return 'Connexion impossible. Vérifiez votre connexion internet.';
      }
      return 'Erreur de connexion au serveur.';
    }

    const status = error.response.status;
    const data = error.response.data as ApiErrorResponse | undefined;

    // Message personnalisé du serveur
    if (data?.message) {
      return data.message;
    }

    // Message par défaut selon le code HTTP
    return ERROR_MESSAGES[status] || `Erreur inattendue (code ${status}).`;
  }

  // Erreur JavaScript standard
  if (error instanceof Error) {
    return error.message;
  }

  // Erreur inconnue
  return 'Une erreur inattendue est survenue.';
}

/**
 * Transforme une erreur en format standard
 */
export function toStandardError(error: unknown): StandardError {
  if (error instanceof AxiosError) {
    const status = error.response?.status || 0;
    const data = error.response?.data as ApiErrorResponse | undefined;

    return {
      message: handleApiError(error),
      code: data?.code || error.code || 'UNKNOWN_ERROR',
      status,
      details: data?.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'JAVASCRIPT_ERROR',
      status: 0,
    };
  }

  return {
    message: 'Une erreur inattendue est survenue.',
    code: 'UNKNOWN_ERROR',
    status: 0,
  };
}

/**
 * Vérifie si l'erreur est une erreur de validation (400/422)
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    return status === 400 || status === 422;
  }
  return false;
}

/**
 * Vérifie si l'erreur est une erreur d'authentification
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Vérifie si l'erreur est une erreur de permission
 */
export function isForbiddenError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 403;
  }
  return false;
}

/**
 * Vérifie si l'erreur est une erreur réseau
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED');
  }
  return false;
}

/**
 * Extrait les erreurs de validation par champ
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.details) {
      const fieldErrors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(data.details)) {
        fieldErrors[field] = messages[0] || 'Champ invalide';
      }
      return fieldErrors;
    }
  }
  return {};
}
