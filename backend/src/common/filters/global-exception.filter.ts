import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

interface ErrorResponse {
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
    message: string | string[];
    error?: string;
    stack?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status: number;
        let message: string | string[];
        let error: string;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const resp = exceptionResponse as Record<string, any>;
                message = resp.message || exception.message;
                error = resp.error || 'Error';
            } else {
                message = exception.message;
                error = 'Error';
            }
        } else if (exception instanceof Error) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = exception.message;
            error = 'Internal Server Error';

            // Log the full error for debugging
            this.logger.error(
                `Unhandled exception: ${exception.message}`,
                exception.stack,
            );

            // Report to Sentry in production
            if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
                Sentry.captureException(exception, {
                    extra: {
                        path: request.url,
                        method: request.method,
                        body: request.body,
                        user: (request as any).user,
                    },
                });
            }
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Unknown error occurred';
            error = 'Internal Server Error';
        }

        const errorResponse: ErrorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
            error,
        };

        // ALWAYS include stack trace and detailed error for quick production diagnostics
        if (exception instanceof Error) {
            errorResponse.stack = exception.stack;
            errorResponse.message = exception.message;
        }

        // Log all errors
        this.logger.warn(
            `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
        );

        response.status(status).json(errorResponse);
    }
}
