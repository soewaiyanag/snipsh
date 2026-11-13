import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { PaginationQueryDto } from '@/common/pagination/pagination-query.dto.js';
import { CREATE_LINK_RATE_LIMIT } from '@/common/rate-limits.js';
import { CurrentUser } from '@/auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '@/auth/jwt-auth.guard.js';
import { LinksService } from './links.service.js';
import { CreateLinkDto } from './dto/create-link.dto.js';

@ApiTags('links')
@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @ApiOperation({ summary: 'Create a short link' })
  @ApiResponse({
    status: 201,
    description: 'Created; Location header points at the link',
  })
  @ApiResponse({ status: 400, description: 'Invalid url or slug' })
  @ApiResponse({
    status: 403,
    description: 'Custom slug needs Pro, or the free limit is reached',
  })
  @ApiResponse({ status: 409, description: 'Slug is taken or reserved' })
  @Post()
  @Throttle(CREATE_LINK_RATE_LIMIT)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() createLinkDto: CreateLinkDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const link = await this.linksService.create(user.sub, createLinkDto);
    res.location(`/links/${link.id}`);
    return link;
  }

  @ApiOperation({ summary: 'List my links, newest first (paginated)' })
  @ApiResponse({ status: 200, description: '{ items, total, page, limit }' })
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.linksService.findAll(user.sub, pagination);
  }

  @ApiOperation({ summary: 'Get one of my links' })
  @ApiResponse({ status: 403, description: 'The link belongs to another user' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.linksService.findOne(id, user.sub);
  }

  @ApiOperation({ summary: 'Click statistics for one of my links' })
  @ApiResponse({ status: 200, description: '{ total, perDay, topReferrers }' })
  @ApiResponse({ status: 403, description: 'The link belongs to another user' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Get(':id/stats')
  getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.linksService.getStats(id, user.sub);
  }

  @ApiOperation({ summary: 'Delete one of my links and its clicks' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'The link belongs to another user' })
  @ApiResponse({ status: 404, description: 'Link not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.linksService.remove(id, user.sub);
  }
}
