import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithId extends Request {
  requestId?: string;
}

/**
 * Décorateur pour extraire le requestId dans les controllers.
 * Usage : @RequestId() requestId: string
 */
export const RequestId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithId>();
    return request.requestId || 'unknown';
  },
);
