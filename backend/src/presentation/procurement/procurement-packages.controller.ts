import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateProcurementPackageExpenseUseCase,
  DeleteProcurementPackageExpenseUseCase,
  ListProcurementPackageExpensesUseCase,
  UpdateProcurementPackageExpenseUseCase,
} from '../../application/use-cases/procurement/manage-procurement-package-expenses.use-case';
import {
  CreateProcurementPackageUseCase,
  DeleteProcurementPackageUseCase,
  GetProcurementPackageUseCase,
  ListProcurementPackagesUseCase,
  PreviewProcurementPackageNameUseCase,
  UpdateProcurementPackageUseCase,
} from '../../application/use-cases/procurement/manage-procurement-packages.use-case';
import { UserRole } from '../../domain/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import {
  CreateProcurementPackageDto,
  CreateProcurementPackageExpenseDto,
  UpdateProcurementPackageDto,
  UpdateProcurementPackageExpenseDto,
} from './dto/procurement.dto';
import {
  toProcurementPackageExpenseResponse,
  toProcurementPackageResponse,
} from './mappers/procurement.mapper';

const PROCUREMENT_READERS = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
  UserRole.WORLD_BANK_USER,
  UserRole.RA_ES_TEHSIL,
] as const;

const PROCUREMENT_MANAGERS = [
  UserRole.SENIOR_MANAGER_ES,
  UserRole.RA_ENVIRONMENT_HO,
] as const;

@Controller('procurement-packages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcurementPackagesController {
  constructor(
    private readonly listPackagesUseCase: ListProcurementPackagesUseCase,
    private readonly getPackageUseCase: GetProcurementPackageUseCase,
    private readonly previewNameUseCase: PreviewProcurementPackageNameUseCase,
    private readonly createPackageUseCase: CreateProcurementPackageUseCase,
    private readonly updatePackageUseCase: UpdateProcurementPackageUseCase,
    private readonly deletePackageUseCase: DeleteProcurementPackageUseCase,
    private readonly listExpensesUseCase: ListProcurementPackageExpensesUseCase,
    private readonly createExpenseUseCase: CreateProcurementPackageExpenseUseCase,
    private readonly updateExpenseUseCase: UpdateProcurementPackageExpenseUseCase,
    private readonly deleteExpenseUseCase: DeleteProcurementPackageExpenseUseCase,
  ) {}

  @Get()
  @Roles(...PROCUREMENT_READERS)
  async list(@CurrentUser() user: AuthenticatedUser) {
    const packages = await this.listPackagesUseCase.execute(user);
    return packages.map(toProcurementPackageResponse);
  }

  @Get('naming-preview')
  @Roles(...PROCUREMENT_MANAGERS)
  async previewName(
    @CurrentUser() user: AuthenticatedUser,
    @Query('tehsilId', ParseUUIDPipe) tehsilId: string,
  ) {
    return this.previewNameUseCase.execute(user, tehsilId);
  }

  @Get(':id/expenses')
  @Roles(...PROCUREMENT_READERS)
  async listExpenses(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const expenses = await this.listExpensesUseCase.execute(user, id);
    return expenses.map(toProcurementPackageExpenseResponse);
  }

  @Post(':id/expenses')
  @Roles(...PROCUREMENT_MANAGERS)
  async createExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProcurementPackageExpenseDto,
  ) {
    const expense = await this.createExpenseUseCase.execute(user, id, dto);
    return toProcurementPackageExpenseResponse(expense);
  }

  @Patch(':id/expenses/:expenseId')
  @Roles(...PROCUREMENT_MANAGERS)
  async updateExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
    @Body() dto: UpdateProcurementPackageExpenseDto,
  ) {
    const expense = await this.updateExpenseUseCase.execute(
      user,
      id,
      expenseId,
      dto,
    );
    return toProcurementPackageExpenseResponse(expense);
  }

  @Delete(':id/expenses/:expenseId')
  @Roles(...PROCUREMENT_MANAGERS)
  async deleteExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('expenseId', ParseUUIDPipe) expenseId: string,
  ) {
    await this.deleteExpenseUseCase.execute(user, id, expenseId);
    return { success: true };
  }

  @Get(':id')
  @Roles(...PROCUREMENT_READERS)
  async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const pkg = await this.getPackageUseCase.execute(user, id);
    return toProcurementPackageResponse(pkg);
  }

  @Post()
  @Roles(...PROCUREMENT_MANAGERS)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProcurementPackageDto,
  ) {
    const pkg = await this.createPackageUseCase.execute(user, dto);
    return toProcurementPackageResponse(pkg);
  }

  @Patch(':id')
  @Roles(...PROCUREMENT_MANAGERS)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProcurementPackageDto,
  ) {
    const pkg = await this.updatePackageUseCase.execute(user, id, dto);
    return toProcurementPackageResponse(pkg);
  }

  @Delete(':id')
  @Roles(...PROCUREMENT_MANAGERS)
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.deletePackageUseCase.execute(user, id);
    return { success: true };
  }
}
