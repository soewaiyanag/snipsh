import type { MockInstance } from 'vitest';
import { BadRequestException, Logger } from '@nestjs/common';
import { Plan } from '@/generated/prisma/client.js';
import { LinksService } from './links.service.js';

const USER_ID = 'user-1';
const NEW_LINK = { id: 'link-1', slug: 'abc1234', url: 'https://example.com' };

function serviceWith(isUrlSafe: () => Promise<boolean>) {
  const prisma = { link: { create: vi.fn().mockResolvedValue(NEW_LINK) } };
  const users = { findById: async () => ({ plan: Plan.PRO }) };
  const service = new LinksService(
    prisma as never,
    users as never,
    {} as never,
    { isUrlSafe } as never,
  );
  return { service, prisma };
}

describe('LinksService.create and Safe Browsing', () => {
  let warn: MockInstance;

  beforeEach(() => {
    warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  it('creates the link when the url is clean', async () => {
    const { service, prisma } = serviceWith(async () => true);

    await service.create(USER_ID, { url: NEW_LINK.url });

    expect(prisma.link.create).toHaveBeenCalledOnce();
  });

  it('rejects a flagged url and saves nothing', async () => {
    const { service, prisma } = serviceWith(async () => false);

    await expect(
      service.create(USER_ID, { url: NEW_LINK.url }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.link.create).not.toHaveBeenCalled();
  });

  it('still creates the link when Google cannot be reached', async () => {
    const { service, prisma } = serviceWith(async () => {
      throw new Error('timeout');
    });

    await service.create(USER_ID, { url: NEW_LINK.url });

    expect(prisma.link.create).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalled();
  });
});
