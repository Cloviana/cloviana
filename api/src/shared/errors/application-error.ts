export type ApplicationErrorKind =
  | "invalid_input"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "gone"
  | "conflict"
  | "unavailable"
  | "unsupported";

/** Expected application failures; HTTP translation belongs at the transport boundary. */
export class ApplicationError extends Error {
  constructor(
    readonly kind: ApplicationErrorKind,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidInputError extends ApplicationError {
  constructor(message: string) {
    super("invalid_input", message);
  }
}
export class AuthenticationError extends ApplicationError {
  constructor(message: string) {
    super("unauthenticated", message);
  }
}
export class AccessDeniedError extends ApplicationError {
  constructor(message: string) {
    super("forbidden", message);
  }
}
export class ResourceNotFoundError extends ApplicationError {
  constructor(message: string) {
    super("not_found", message);
  }
}
export class ResourceGoneError extends ApplicationError {
  constructor(message: string) {
    super("gone", message);
  }
}
export class StateConflictError extends ApplicationError {
  constructor(message: string) {
    super("conflict", message);
  }
}
export class DependencyUnavailableError extends ApplicationError {
  constructor(message: string) {
    super("unavailable", message);
  }
}
export class UnsupportedOperationError extends ApplicationError {
  constructor(message: string) {
    super("unsupported", message);
  }
}
