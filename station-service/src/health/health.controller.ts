import { Controller, Get } from '@nestjs/common';
import { SkipStationScope } from '../common/guards/index.js';

@SkipStationScope()
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
