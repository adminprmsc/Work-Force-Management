import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GeographyNameDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;
}
