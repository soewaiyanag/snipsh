import {
  Controller,
  Get,
  GoneException,
  Headers,
  HttpStatus,
  NotFoundException,
  Param,
  Redirect,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/auth/decorators/public.decorator.js';
import {
  LINK_CLICKED,
  type LinkClickedEvent,
} from '@/clicks/events/link-clicked.event.js';
import { LinksService } from '@/links/links.service.js';

@ApiTags('redirect')
@Controller()
export class RedirectController {
  constructor(
    private readonly links: LinksService,
    private readonly events: EventEmitter2,
  ) {}

  @ApiOperation({ summary: 'Open a short link and record the click' })
  @ApiResponse({ status: 302, description: 'Redirects to the original url' })
  @ApiResponse({ status: 404, description: 'Unknown slug' })
  @ApiResponse({ status: 410, description: 'The link was disabled' })
  @Public()
  @Get(':slug')
  @Redirect()
  async redirect(
    @Param('slug') slug: string,
    @Headers('referer') referrer?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const link = await this.links.findBySlug(slug);
    if (!link) {
      throw new NotFoundException('Link not found');
    }
    if (!link.isActive) {
      throw new GoneException('This link has been disabled');
    }
    const event: LinkClickedEvent = { linkId: link.id, referrer, userAgent };
    this.events.emit(LINK_CLICKED, event);
    // 302, not 301: browsers cache a 301 forever, which would hide clicks from us
    return { url: link.url, statusCode: HttpStatus.FOUND };
  }
}
