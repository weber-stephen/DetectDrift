import { test, expect } from 'vitest';
import { makeReport, renderJson } from '../src/report.js';
test('incomplete run remains an error', () => { const report = makeReport([{ id: 'safe', status: 'error', checks: [{ code: 'exit', status: 'failed', reason: 'command exit' }] }], true); expect(report.status).toBe('error'); expect(renderJson(report)).not.toContain('secret'); });
