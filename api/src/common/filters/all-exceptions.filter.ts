import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";

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

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as
        | ProblemDetails
        | { message: string | string[]; error?: string };
      message = res.message ?? message;
      error = res.error ?? error;
    } else if (
      typeof exception === "object" &&
      exception !== null &&
      "statusCode" in exception &&
      typeof (exception as any).statusCode === "number"
    ) {
      status = (exception as any).statusCode;
      message = (exception as any).message ?? message;
      error = (exception as any).error ?? HttpStatus[status] ?? error;
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
