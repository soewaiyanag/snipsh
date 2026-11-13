import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnv } from './config/env.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { LinksModule } from './links/links.module.js';
import { ClicksModule } from './clicks/clicks.module.js';
import { RedirectModule } from './redirect/redirect.module.js';
import { SafeBrowsingModule } from './safe-browsing/safe-browsing.module.js';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 60;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([
      { ttl: RATE_LIMIT_WINDOW_MS, limit: RATE_LIMIT_REQUESTS },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    LinksModule,
    ClicksModule,
    // must stay last: its /:slug route would otherwise shadow /links
    RedirectModule,
    SafeBrowsingModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
