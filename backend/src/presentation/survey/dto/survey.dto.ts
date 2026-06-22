import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  SurveyFieldType,
  SurveyFrequency,
} from '../../../domain/entities/survey.entity';

export class SurveyFieldDto {
  @IsEnum(SurveyFieldType)
  type!: SurveyFieldType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  helpText?: string | null;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsInt()
  @Min(0)
  order!: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;
}

export class SurveyFormBaselineFieldDto extends SurveyFieldDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsBoolean()
  writeOnce?: boolean;
}

export class CreateSurveyFormDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  requiresPackageBaseline?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  baselineTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  baselineDescription?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyFieldDto)
  fields!: SurveyFieldDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyFormBaselineFieldDto)
  baselineFields?: SurveyFormBaselineFieldDto[];
}

export class UpdateSurveyFormDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  requiresPackageBaseline?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  baselineTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  baselineDescription?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyFieldDto)
  fields?: SurveyFieldDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyFormBaselineFieldDto)
  baselineFields?: SurveyFormBaselineFieldDto[];
}

export class CreateSurveyAssignmentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  procurementPackageIds!: string[];

  @IsEnum(SurveyFrequency)
  frequency!: SurveyFrequency;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string | null;
}

export class StartSurveyResponseDto {
  @IsUUID()
  assignmentId!: string;

  @IsUUID()
  villageId!: string;

  @IsOptional()
  @IsUUID()
  settlementId?: string | null;

  @IsOptional()
  @IsDateString()
  visitDate?: string | null;
}

export class SurveyAnswerDto {
  @IsUUID()
  fieldId!: string;

  @Allow()
  value!: unknown;
}

export class SaveSurveyResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerDto)
  answers!: SurveyAnswerDto[];
}
