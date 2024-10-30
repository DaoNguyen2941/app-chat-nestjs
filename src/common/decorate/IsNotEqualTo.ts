import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
  } from 'class-validator';
  
  @ValidatorConstraint({ name: 'isNotEqualTo', async: false })
  export class IsNotEqualToConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
      const [relatedPropertyName] = args.constraints;
      const relatedValue = (args.object as any)[relatedPropertyName];
      return value !== relatedValue; // Trả về true nếu hai giá trị không giống nhau
    }
  
    defaultMessage(args: ValidationArguments) {
      const [relatedPropertyName] = args.constraints;
      return `The value of ${args.property} must not be equal to ${relatedPropertyName}`;
    }
  }
  
  export function IsNotEqualTo(property: string, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [property],
        validator: IsNotEqualToConstraint,
      });
    };
  }
  