import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { AppError } from './errors';

export type HttpEvent = APIGatewayProxyEventV2;
export type HttpResponse = APIGatewayProxyStructuredResultV2;
type HttpHandler = (event: HttpEvent) => Promise<HttpResponse>;

const PG_UNIQUE_VIOLATION = '23505';

export function json(statusCode: number, body?: unknown): HttpResponse {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? '' : JSON.stringify(body),
  };
}

export function httpHandler(handler: HttpHandler): HttpHandler {
  return async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function getHeader(event: HttpEvent, name: string): string | undefined {
  const target = name.toLowerCase();
  const entry = Object.entries(event.headers ?? {}).find(([key]) => key.toLowerCase() === target);
  return entry?.[1];
}

export function getRawBody(event: HttpEvent): string | undefined {
  if (!event.body) return undefined;
  return event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
}

function toErrorResponse(error: unknown): HttpResponse {
  if (error instanceof AppError) {
    return json(error.statusCode, {
      error: { code: error.code, message: error.message, details: error.details },
    });
  }
  if (isPgError(error, PG_UNIQUE_VIOLATION)) {
    return json(409, { error: { code: 'CONFLICT', message: 'El recurso ya existe' } });
  }
  console.error('Error no controlado', error);
  return json(500, { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } });
}

function isPgError(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === code;
}
