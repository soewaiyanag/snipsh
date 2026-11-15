import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
    });
  }

  // includes passwordHash, only for checking a password
  findByIdWithPassword(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  create(email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: { email, passwordHash },
      omit: { passwordHash: true },
    });
  }

  // links and clicks go too, through onDelete: Cascade in the schema
  delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
