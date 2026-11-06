import { isSourcePath } from "@/modules/themes/domain/source-path";
import { type ValidationOptions, registerDecorator } from "class-validator";

/** The value (or each value, with `each`) must be a safe path inside a theme's source. */
export function IsSourcePath(options?: ValidationOptions) {
  return (target: object, propertyKey: string) =>
    registerDecorator({
      name: "isSourcePath",
      target: target.constructor,
      propertyName: propertyKey,
      options: { message: "must be a safe source path", ...options },
      validator: {
        validate: (value: unknown) =>
          typeof value === "string" && isSourcePath(value),
      },
    });
}
