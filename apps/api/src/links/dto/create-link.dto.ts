import {
  IsOptional,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const MAX_URL_LENGTH = 2048;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 32;
const SLUG_PATTERN = /^[A-Za-z0-9_-]+$/;
// Our own host would make a redirect loop. The validator compares hosts exactly and
// case-sensitively, so a regex with `i` and an optional trailing dot closes the easy bypasses
const OWN_HOST = /^snipsh-api\.onrender\.com\.?$/i;

export class CreateLinkDto {
  @IsOptional()
  @MinLength(MIN_SLUG_LENGTH)
  @MaxLength(MAX_SLUG_LENGTH)
  @Matches(SLUG_PATTERN, {
    message: 'slug can only contain letters, numbers, - and _',
  })
  slug?: string;

  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    host_blacklist: [OWN_HOST],
  })
  @MaxLength(MAX_URL_LENGTH)
  url: string;
}
