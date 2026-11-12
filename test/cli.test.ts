import { test, expect, vi } from 'vitest';
import { main } from '../src/cli.js';
test('help and invalid command', async () => { vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {}); expect(await main(['--help'], {})).toBe(0); expect(await main(['wat'], {})).toBe(2); vi.restoreAllMocks(); });
