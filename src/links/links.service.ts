import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ClicksService } from '@/clicks/clicks.service.js';
import { paginate } from '@/common/pagination/paginate.js';
import { PaginationQueryDto } from '@/common/pagination/pagination-query.dto.js';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { ReportLinkDto } from './dto/report-link.dto.js';
import { Plan, Prisma } from '@/generated/prisma/client.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { SafeBrowsingService } from '@/safe-browsing/safe-browsing.service.js';
import { UsersService } from '@/users/users.service.js';

// 5 random bytes give a 7-character slug that already matches our slug rules
const GENERATED_SLUG_BYTES = 5;
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
const FREE_LINK_LIMIT = 5;
// First path segments of real routes. Keep in sync with the controllers; Express ignores case.
const RESERVED_SLUGS = ['links', 'auth', 'users', 'admin', 'docs', 'docs-json'];

const generateSlug = () =>
  randomBytes(GENERATED_SLUG_BYTES).toString('base64url');

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly clicks: ClicksService,
    private readonly safeBrowsing: SafeBrowsingService,
  ) {}

  // shortcut: a generated slug that collides returns 409, add a retry loop if it ever happens
  async create(userId: string, { slug, url }: CreateLinkDto) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isPro = user.plan === Plan.PRO;
    if (slug && !isPro) {
      throw new ForbiddenException('Custom slugs are a Pro feature');
    }
    if (slug && RESERVED_SLUGS.includes(slug.toLowerCase())) {
      throw new ConflictException('That slug is reserved');
    }
    // shortcut: two simultaneous requests can both pass this count, fine for a small limit
    if (!isPro) {
      const linkCount = await this.prisma.link.count({ where: { userId } });
      if (linkCount >= FREE_LINK_LIMIT) {
        throw new ForbiddenException(
          `Free plan is limited to ${FREE_LINK_LIMIT} links`,
        );
      }
    }

    // last on purpose: it is the only check that calls another server
    await this.assertUrlIsSafe(url);

    try {
      return await this.prisma.link.create({
        data: { slug: slug ?? generateSlug(), url, userId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        throw new ConflictException('Slug is already taken');
      }
      throw error;
    }
  }

  private async assertUrlIsSafe(url: string) {
    let isSafe: boolean;
    try {
      isSafe = await this.safeBrowsing.isUrlSafe(url);
    } catch (error) {
      // fail open: a Google outage must not stop people from creating links
      this.logger.warn(`Safe Browsing check failed, allowing ${url}`, error);
      return;
    }
    if (!isSafe) {
      throw new BadRequestException('This URL is flagged as unsafe');
    }
  }

  findAll(userId: string, pagination: PaginationQueryDto) {
    const where = { userId };
    return paginate(
      pagination,
      (range) =>
        this.prisma.link.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          ...range,
        }),
      () => this.prisma.link.count({ where }),
    );
  }

  findBySlug(slug: string) {
    return this.prisma.link.findUnique({ where: { slug } });
  }

  async report({ slug, reason }: ReportLinkDto) {
    const link = await this.findBySlug(slug);
    if (!link) {
      throw new NotFoundException('Link not found');
    }
    await this.prisma.report.create({ data: { linkId: link.id, reason } });
  }

  async findOne(id: string, userId: string) {
    const link = await this.prisma.link.findUnique({ where: { id } });
    if (!link) {
      throw new NotFoundException('Link not found');
    }
    if (link.userId !== userId) {
      throw new ForbiddenException('This link belongs to another user');
    }
    return link;
  }

  async getStats(id: string, userId: string) {
    await this.findOne(id, userId);
    const [total, perDay, topReferrers] = await Promise.all([
      this.clicks.countForLink(id),
      this.clicks.countPerDay(id),
      this.clicks.topReferrers(id),
    ]);
    return { total, perDay, topReferrers };
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.link.delete({ where: { id } });
  }
}
