import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@/generated/prisma/client.js';
import { RolesGuard } from './roles.guard.js';

const USER_ID = 'user-1';

function contextFor(user?: { sub: string }) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function guardWith(requiredRoles: Role[] | undefined, role?: Role) {
  const reflector = {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;
  const users = { findById: async () => (role ? { role } : null) };
  return new RolesGuard(reflector, users as never);
}

describe('RolesGuard', () => {
  it('lets every request through a route without @Roles()', async () => {
    await expect(guardWith(undefined).canActivate(contextFor())).resolves.toBe(
      true,
    );
  });

  it('lets an admin through an admin route', async () => {
    const guard = guardWith([Role.ADMIN], Role.ADMIN);
    await expect(guard.canActivate(contextFor({ sub: USER_ID }))).resolves.toBe(
      true,
    );
  });

  it('answers 403 to a normal user, a deleted user and a request without a user', async () => {
    await expect(
      guardWith([Role.ADMIN], Role.USER).canActivate(
        contextFor({ sub: USER_ID }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      guardWith([Role.ADMIN]).canActivate(contextFor({ sub: USER_ID })),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      guardWith([Role.ADMIN], Role.ADMIN).canActivate(contextFor()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
