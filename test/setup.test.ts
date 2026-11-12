import { test, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
test('setup names secrets without reading values', async () => { const skill = await readFile('skills/driftdetect-setup/SKILL.md','utf8'); expect(skill).toContain('Never read `.env`'); expect(skill).toContain('existing valid cases'); });
