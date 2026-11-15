// Rebuilds bruno/ from the running API's Swagger spec, then adds our hand-kept files on top.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OPENAPI_URL =
  process.env.OPENAPI_URL ?? 'http://localhost:3000/docs-json';
const OUTPUT_DIR = 'docs/bruno';
const EXTRAS_DIR = 'scripts/bruno-extras';
const COLLECTION_NAME = 'snipsh-api';

// The importer leaves values empty; fill them with the variables collection.bru saves
const FILL_INS = [
  [/"email": ""/g, '"email": "{{email}}"'],
  [/"password": ""/g, '"password": "{{password}}"'],
  [/"url": ""/g, '"url": "https://docs.nestjs.com"'],
  [/^\s+"slug": "",\n/gm, ''],
  [/^ {2}id: $/gm, '  id: {{linkId}}'],
  [/^ {2}slug: $/gm, '  slug: {{slug}}'],
];

const tempDir = mkdtempSync(join(tmpdir(), 'bruno-'));
// bru writes the collection into a folder named after it
const generatedDir = join(tempDir, COLLECTION_NAME);
execFileSync(
  'bru',
  [
    'import',
    'openapi',
    '-s',
    OPENAPI_URL,
    '-o',
    tempDir,
    '-n',
    COLLECTION_NAME,
    '--collection-format',
    'bru',
  ],
  { stdio: 'inherit' },
);

for (const file of readdirSync(generatedDir, { recursive: true })) {
  if (!file.endsWith('.bru')) continue;
  const path = join(generatedDir, file);
  const text = FILL_INS.reduce(
    (result, [pattern, value]) => result.replace(pattern, value),
    readFileSync(path, 'utf8'),
  );
  writeFileSync(path, text);
}

rmSync(OUTPUT_DIR, { recursive: true, force: true });
cpSync(generatedDir, OUTPUT_DIR, { recursive: true });
cpSync(EXTRAS_DIR, OUTPUT_DIR, { recursive: true });
rmSync(tempDir, { recursive: true, force: true });
console.log(`Bruno collection written to ${OUTPUT_DIR}/`);
