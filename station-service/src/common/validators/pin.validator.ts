import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Liste des PIN triviaux interdits.
 * Ces codes sont trop prévisibles et constituent un risque de sécurité.
 */
const TRIVIAL_PINS = [
  '000000', '111111', '222222', '333333', '444444',
  '555555', '666666', '777777', '888888', '999999',
  '123456', '654321', '123123', '112233', '001122',
  '121212', '696969', '000001', '100000',
];

@ValidatorConstraint({ name: 'isNotTrivialPin', async: false })
export class IsNotTrivialPinConstraint implements ValidatorConstraintInterface {
  validate(pin: string): boolean {
    if (!pin) return true; // Let other validators handle required check
    return !TRIVIAL_PINS.includes(pin);
  }

  defaultMessage(): string {
    return 'Le code PIN est trop simple. Choisissez un code moins prévisible.';
  }
}

/**
 * Décorateur pour valider qu'un PIN n'est pas dans la liste des codes triviaux.
 * @example
 * @IsNotTrivialPin()
 * pinCode: string;
 */
export function IsNotTrivialPin(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsNotTrivialPinConstraint,
    });
  };
}
