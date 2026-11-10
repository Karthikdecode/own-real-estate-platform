// Creates the root .env from .env.example. Never overwrites an existing .env.
// Required secrets left empty in the template get random, local-only values.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const examplePath = join(rootDir, '.env.example');
const envPath = join(rootDir, '.env');

const generators = new Map([
  ['JWT_ACCESS_SECRET', () => randomBytes(48).toString('base64url')],
  ['DATABASE_PASSWORD', () => randomBytes(24).toString('base64url')],
]);

if (existsSync(envPath)) {
  console.log('.env already exists - left unchanged.');
  process.exit(0);
}

const generatedKeys = [];
const lines = readFileSync(examplePath, 'utf8')
  .split(/\r?\n/)
  .map((line) => {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line);
    const generate = match ? generators.get(match[1]) : undefined;
    if (!match || !generate || match[2].trim() !== '') return line;
    generatedKeys.push(match[1]);
    return `${match[1]}=${generate()}`;
  });

writeFileSync(envPath, lines.join('\n'), { encoding: 'utf8', flag: 'wx' });

const generatedNote = generatedKeys.length > 0 ? ` Generated: ${generatedKeys.join(', ')}.` : '';
console.log(`Created .env from .env.example.${generatedNote}`);
