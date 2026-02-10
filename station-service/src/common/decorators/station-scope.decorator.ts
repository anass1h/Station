import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// Extension de Request pour le typage
interface RequestWithStationScope extends Request {
  stationScope?: string;
}

// Décorateur de paramètre pour extraire le stationScope dans les controllers
export const StationScope = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithStationScope>();
    return request.stationScope ?? null;
  },
);
