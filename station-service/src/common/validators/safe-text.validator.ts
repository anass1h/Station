import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraintInterface,
  ValidatorConstraint,
} from 'class-validator';

/**
 * Validateur plus strict que @NoHtml().
 * Bloque : balises HTML, javascript:, vbscript:, data:base64, on*= event handlers.
 * Utiliser sur les champs qui pourraient être affichés dans un contexte web/PDF.
 *
 * NE PAS utiliser sur : password, PIN, badges, tokens, emails, champs avec @Matches regex.
 */
@ValidatorConstraint({ name: 'isSafeText', async: false })
export class IsSafeTextConstraint implements ValidatorConstraintInterface {
  private readonly DANGEROUS_PATTERNS = [
    /<[^>]*>/, // HTML tags
    /javascript\s*:/i, // javascript: protocol
    /vbscript\s*:/i, // vbscript: protocol
    /data\s*:[^,]*;base64/i, // data: base64 payloads
    /on\w+\s*=/i, // event handlers (onclick=, onerror=, etc.)
  ];

  validate(value: string): boolean {
    if (!value || typeof value !== 'string') return true;
    return !this.DANGEROUS_PATTERNS.some((pattern) => pattern.test(value));
  }

  defaultMessage(): string {
    return 'Le texte contient du contenu potentiellement dangereux';
  }
}

export function SafeText(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeTextConstraint,
    });
  };
}
