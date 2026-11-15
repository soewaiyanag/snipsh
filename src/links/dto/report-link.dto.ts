import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const MAX_SLUG_LENGTH = 32;
const MAX_REASON_LENGTH = 500;

export class ReportLinkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_SLUG_LENGTH)
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_REASON_LENGTH)
  reason: string;
}
