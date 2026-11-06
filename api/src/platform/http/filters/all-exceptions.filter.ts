import { STATUS_CODES } from "node:http";
import {
  ApplicationError,
  type ApplicationErrorKind,
} from "@/shared/errors/application-error";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";

const applicationErrorStatus: Record<ApplicationErrorKind, HttpStatus> = {
  invalid_input: HttpStatus.BAD_REQUEST,
  unauthenticated: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  not_found: HttpStatus.NOT_FOUND,
  gone: HttpStatus.GONE,
  conflict: HttpStatus.CONFLICT,
  unavailable: HttpStatus.SERVICE_UNAVAILABLE,
  unsupported: HttpStatus.NOT_IMPLEMENTED,
};

interface ProblemDetails {
  /** HTTP status code (e.g. 400, 404) */
  status: number;
  /** Short, static error string (“Bad Request”, “Not Found”, …) */
  error: string;
  /** Human-readable explanation or array of validation messages */
  message: string | string[];
  /** Request path that triggered the error */
  path: string;
  /** RFC 3339 timestamp */
  timestamp: string;
  /** Optional application-level code, useful for front-end switches */
  code?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMessage(value: unknown): value is string | string[] {
  return (
    typeof value === "string" ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  private readonly defaultStatus = HttpStatus.INTERNAL_SERVER_ERROR;
  private readonly defaultError = "Internal Server Error";

  catch(exception: unknown, host: ArgumentsHost) {
    const reply = this.getReply(host);
    const request = this.getRequest(host);

    let status = this.defaultStatus;
    let error = this.defaultError;
    let message: string | string[] = this.defaultError;

    if (exception instanceof ApplicationError) {
      status = applicationErrorStatus[exception.kind];
      error = STATUS_CODES[status] ?? this.defaultError;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === "string") {
        message = response;
      } else {
        const details = response as {
          message?: string | string[];
          error?: string;
        };
        message = details.message ?? message;
        error = details.error ?? error;
      }
      error =
        error === this.defaultError
          ? (STATUS_CODES[status] ?? this.defaultError)
          : error;
    } else if (isRecord(exception) && exception.code === "P2025") {
      // Prisma findFirstOrThrow/update on a missing record is a 404, not a 500.
      status = HttpStatus.NOT_FOUND;
      error = "Not Found";
      message = "Resource not found";
    } else if (
      isRecord(exception) &&
      typeof exception.statusCode === "number"
    ) {
      status = exception.statusCode;
      if (isMessage(exception.message)) {
        message = exception.message;
      }
      error =
        typeof exception.error === "string"
          ? exception.error
          : (HttpStatus[status] ?? error);
    } else {
      this.logger.error(exception);
    }

    const payload: ProblemDetails = {
      status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    reply.status(status).send(payload);
  }

  private getReply(host: ArgumentsHost) {
    return host.switchToHttp().getResponse<FastifyReply>();
  }

  private getRequest(host: ArgumentsHost) {
    return host.switchToHttp().getRequest<FastifyRequest>();
  }
}
