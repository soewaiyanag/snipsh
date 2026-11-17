import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@/generated/prisma/client.js';
import { UsersService } from '@/users/users.service.js';
import { ROLES_KEY } from './decorators/roles.decorator.js';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // Read the role from the database, not the token, so a demoted admin loses access at once
    const account = user ? await this.users.findById(user.sub) : null;
    if (!account || !requiredRoles.includes(account.role)) {
      throw new ForbiddenException('Admins only');
    }
    return true;
  }
}
