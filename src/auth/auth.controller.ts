import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AUTH_RATE_LIMIT } from '@/common/rate-limits.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { DeleteAccountDto } from './dto/delete-account.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import type { JwtPayload } from './jwt-auth.guard.js';
import { Public } from './decorators/public.decorator.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @ApiOperation({ summary: 'Create an account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 400, description: 'Invalid email or password' })
  @ApiResponse({ status: 409, description: 'Email is already registered' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @Public()
  @Throttle(AUTH_RATE_LIMIT)
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @ApiOperation({ summary: 'Log in and get an access token' })
  @ApiResponse({ status: 200, description: 'Returns { accessToken }' })
  @ApiResponse({ status: 401, description: 'Wrong email or password' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @Public()
  @Throttle(AUTH_RATE_LIMIT)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiOperation({ summary: 'Show who the token belongs to' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @ApiOperation({ summary: 'Delete my account, links and clicks' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 401, description: 'Wrong password or invalid token' })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  @Throttle(AUTH_RATE_LIMIT)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.auth.deleteAccount(user.sub, dto);
  }
}
