import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { configSchema } from '../src/config.js';
const output = JSON.stringify(z.toJSONSchema(configSchema), null, 2) + '\n';
if (process.argv.includes('--check')) { if (await readFile('driftdetect.schema.json', 'utf8') !== output) process.exitCode = 1; }
else await writeFile('driftdetect.schema.json', output);
