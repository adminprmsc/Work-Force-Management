import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/users/create-user.use-case';
import { ResetUserCredentialsUseCase } from '../../application/use-cases/users/reset-credentials.use-case';
import {
  GetUserUseCase,
  ListUsersUseCase,
} from '../../application/use-cases/users/list-users.use-case';
import {
  DeleteUserUseCase,
  UpdateUserStatusUseCase,
  UpdateUserUseCase,
} from '../../application/use-cases/users/update-user.use-case';
import { UserRole } from '../../domain/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from './dto/user.dto';
import { toActorContext, toUserResponse } from './mappers/user.mapper';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SENIOR_MANAGER_ES)
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly resetCredentialsUseCase: ResetUserCredentialsUseCase,
  ) {}

  @Post()
  async create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateUserDto,
  ) {
    const user = await this.createUserUseCase.execute(
      toActorContext(actor),
      dto,
    );
    return toUserResponse(user);
  }

  @Get()
  async list() {
    const users = await this.listUsersUseCase.execute();
    return users.map(toUserResponse);
  }

  @Get(':id')
  async getOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const user = await this.getUserUseCase.execute(toActorContext(actor), id);
    return toUserResponse(user);
  }

  @Patch(':id')
  async update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const user = await this.updateUserUseCase.execute(
      toActorContext(actor),
      id,
      dto,
    );
    return toUserResponse(user);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.deleteUserUseCase.execute(toActorContext(actor), id);
    return { success: true };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const user = await this.updateUserStatusUseCase.execute(
      toActorContext(actor),
      id,
      dto.active,
    );
    return toUserResponse(user);
  }

  @Post(':id/reset-credentials')
  async resetCredentials(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.resetCredentialsUseCase.execute(toActorContext(actor), id);
  }
}
