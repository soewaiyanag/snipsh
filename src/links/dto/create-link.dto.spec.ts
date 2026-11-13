import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateLinkDto } from './create-link.dto.js';

const urlErrors = async (url: string) => {
  const errors = await validate(plainToInstance(CreateLinkDto, { url }));
  return errors.filter((error) => error.property === 'url');
};

describe('CreateLinkDto url', () => {
  it('accepts a normal https url', async () => {
    expect(await urlErrors('https://example.com/page')).toHaveLength(0);
  });

  it.each([
    'https://snipsh-api.onrender.com/abc',
    'HTTPS://SnipSh-Api.OnRender.com/abc',
    'https://snipsh-api.onrender.com./abc',
  ])('rejects our own domain: %s', async (url) => {
    expect(await urlErrors(url)).toHaveLength(1);
  });

  it('rejects other protocols', async () => {
    expect(await urlErrors('ftp://example.com/file')).toHaveLength(1);
  });
});
