import {
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

export class CreateProcurementPackageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  name!: string;

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
