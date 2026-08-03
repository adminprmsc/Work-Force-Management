import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  SurveyFieldType,
  SurveyFrequency,
} from '../../../domain/entities/survey.entity';

export class SurveyFieldDto {
  @IsOptional()
  @IsUUID()
  id?: string;

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

export class UpdateSurveyAssignmentDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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

export type SurveyAnswerBody = {
  fieldId: string;
  value: unknown;
};

export type SaveSurveyResponseBody = {
  answers: SurveyAnswerBody[];
};

export type SubmitSurveyResponseBody = SaveSurveyResponseBody & {
  latitude: number;
  longitude: number;
  locationAccuracyMeters?: number | null;
};

export type ReviewSurveyResponseBody = {
  remarks?: string | null;
};

export class SurveyAnswerDto implements SurveyAnswerBody {
  @IsUUID()
  fieldId!: string;

  @Allow()
  value!: unknown;
}

export class SaveSurveyResponseDto implements SaveSurveyResponseBody {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerDto)
  answers!: SurveyAnswerDto[];
}

export class SubmitSurveyResponseDto implements SubmitSurveyResponseBody {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerDto)
  answers!: SurveyAnswerDto[];

  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  locationAccuracyMeters?: number | null;
}

export class ReviewSurveyResponseDto implements ReviewSurveyResponseBody {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string | null;
}

export class ListSurveyResponsesQueryDto {
  @IsOptional()
  @IsUUID()
  formId?: string;

  @IsOptional()
  @IsUUID()
  tehsilId?: string;

  @IsOptional()
  @IsUUID()
  assignmentId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([25, 50, 100])
  limit?: number;
}
