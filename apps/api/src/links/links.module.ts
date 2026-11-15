import { Module } from '@nestjs/common';
import { ClicksModule } from '@/clicks/clicks.module.js';
import { SafeBrowsingModule } from '@/safe-browsing/safe-browsing.module.js';
import { UsersModule } from '@/users/users.module.js';
import { LinksService } from './links.service.js';
import { LinksController } from './links.controller.js';

@Module({
  imports: [UsersModule, ClicksModule, SafeBrowsingModule],
  controllers: [LinksController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
