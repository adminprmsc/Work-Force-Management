import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UploadMobileAppReleaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  versionName!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  versionCode!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  releaseNotes?: string | null;
}
