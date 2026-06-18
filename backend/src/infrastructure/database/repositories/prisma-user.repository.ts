import { Injectable } from '@nestjs/common';
import {
  OfficeType as PrismaOfficeType,
  UserRole as PrismaUserRole,
  UserStatus as PrismaUserStatus,
} from '@prisma/client';
import {
  User,
  UserRole,
  UserStatus,
  OfficeType,
} from '../../../domain/entities/user.entity';
import {
  CreateUserData,
  ListUsersFilter,
  UpdateUserData,
  UserRepositoryPort,
} from '../../../application/ports/user.repository.port';
import { PrismaService } from '../prisma/prisma.service';

type UserRecord = {
  id: string;
  email: string;
  username: string;
  password: string;
  role: PrismaUserRole;
  status: PrismaUserStatus;
  officeId: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  office?: {
    name: string;
    type: PrismaOfficeType;
    tehsil?: { name: string } | null;
  } | null;
};

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    office: { include: { tehsil: true } },
  };

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: this.include,
    });
    return record ? this.toDomain(record) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { username },
      include: this.include,
    });
    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: this.include,
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll(filter?: ListUsersFilter): Promise<User[]> {
    const records = await this.prisma.user.findMany({
      where: {
        role: filter?.role,
        officeId: filter?.officeId,
        createdById: filter?.createdById,
      },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return records.map((r) => this.toDomain(r));
  }

  async create(data: CreateUserData): Promise<User> {
    const record = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
        role: data.role,
        officeId: data.officeId ?? null,
        createdById: data.createdById,
      },
      include: this.include,
    });
    return this.toDomain(record);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
        role: data.role,
        officeId: data.officeId,
      },
      include: this.include,
    });
    return this.toDomain(record);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const record = await this.prisma.user.update({
      where: { id },
      data: { status: status },
      include: this.include,
    });
    return this.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toDomain(record: UserRecord): User {
    return new User(
      record.id,
      record.email,
      record.username,
      record.password,
      record.role as UserRole,
      record.status as UserStatus,
      record.officeId,
      record.office?.name ?? null,
      (record.office?.type as OfficeType) ?? null,
      record.office?.tehsil?.name ?? null,
      record.createdById,
      record.createdAt,
      record.updatedAt,
    );
  }
}
