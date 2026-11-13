import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/auth/decorators/public.decorator.js';
import { AppService } from './app.service.js';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Render's health check hits this without a token
  @ApiOperation({ summary: 'Health check, used by Render' })
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
