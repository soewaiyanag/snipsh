import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
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

  // temporary: find how many proxies sit in front of the app, remove after
  @Public()
  @Get('debug/ip')
  debugIp(@Req() req: Request) {
    return {
      ip: req.ip,
      forwardedFor: req.headers['x-forwarded-for'],
      socket: req.socket.remoteAddress,
    };
  }
}
