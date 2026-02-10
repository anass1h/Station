import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'requireFieldForB2B', async: false })
export class RequireFieldForB2BConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as Record<string, unknown>;
    if (dto.clientType === 'B2B') {
      return value !== undefined && value !== null && value !== '';
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} est obligatoire pour un client B2B`;
  }
}

export function RequireForB2B(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: RequireFieldForB2BConstraint,
    });
  };
}
