import { Matches } from 'class-validator';

/**
 * Refuse toute balise HTML (<...>) dans un champ string.
 * Ne modifie PAS la donnée — rejette la requête avec HTTP 400.
 *
 * Utiliser sur : noms, adresses, notes, descriptions, références textuelles.
 * NE PAS utiliser sur : password, PIN, badges, tokens, emails, champs avec @Matches regex.
 */
export const NoHtml = () =>
  Matches(/^[^<>]*$/, {
    message: 'Les balises HTML ne sont pas autorisées',
  });
