import { getServices } from '../container';
import { UnauthorizedError } from './errors';
import { getHeader, httpHandler, type HttpEvent, type HttpResponse } from './http';

export interface AuthenticatedRequest {
  event: HttpEvent;
  userId: string;
}

export function authHandler(handler: (request: AuthenticatedRequest) => Promise<HttpResponse>) {
  return httpHandler(async (event) => {
    const userId = getServices().tokens.verify(extractBearerToken(event));
    return handler({ event, userId });
  });
}

function extractBearerToken(event: HttpEvent): string {
  const [scheme, token] = (getHeader(event, 'authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError('Envía el token en la cabecera: Authorization: Bearer <token>');
  }
  return token;
}
