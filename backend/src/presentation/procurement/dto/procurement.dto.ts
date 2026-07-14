import { Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';

export class CreateMasterNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}

export class UpdateMasterNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}

export class VillageAllocationDto {
  @IsUUID()
  villageId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  allocatedBudget!: number;
}

export class CreateProcurementPackageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  cluster!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  code!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budgetAmount!: number;

  @IsUUID()
  contractorId!: string;

  @IsUUID()
  consultantId!: string;

  @IsUUID()
  tehsilId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  villageIds!: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VillageAllocationDto)
  villageAllocations?: VillageAllocationDto[];
}

export class UpdateProcurementPackageDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budgetAmount?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  villageIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VillageAllocationDto)
  villageAllocations?: VillageAllocationDto[];
}

export class CreateProcurementPackageExpenseDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}

export class UpdateProcurementPackageExpenseDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}

export class SavePackageBaselineDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageBaselineAnswerDto)
  answers!: PackageBaselineAnswerDto[];
}

export class PackageBaselineAnswerDto {
  @IsUUID()
  fieldId!: string;

  @Allow()
  value!: unknown;
}
