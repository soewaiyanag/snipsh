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
    status: HttpStatus.CREATED,
    description: 'Created; Location header points at the link',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid url or slug',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Custom slug needs Pro, or the free limit is reached',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Slug is taken or reserved',
  })
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: '{ items, total, page, limit }',
  })
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.linksService.findAll(user.sub, pagination);
  }

  @ApiOperation({ summary: 'Get one of my links' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The link belongs to another user',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Link not found' })
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.linksService.findOne(id, user.sub);
  }

  @ApiOperation({ summary: 'Click statistics for one of my links' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '{ total, perDay, topReferrers }',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The link belongs to another user',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Link not found' })
  @Get(':id/stats')
  getStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.linksService.getStats(id, user.sub);
  }

  @ApiOperation({ summary: 'Delete one of my links and its clicks' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Deleted' })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'The link belongs to another user',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Link not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.linksService.remove(id, user.sub);
  }
}
