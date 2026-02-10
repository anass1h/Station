import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/index.js';
import { SkipStationScope } from '../common/guards/index.js';

@Public()
@SkipStationScope()
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
