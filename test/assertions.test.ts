import { test, expect } from 'vitest';
import { evaluate } from '../src/assertions.js';
test('boolean regression and escaped JSON pointers', () => {
  const assertion = { fields: [{ path: '/urgent', type: 'boolean' as const }, { path: '/a~1b/~0', type: 'string' as const }] };
  expect(evaluate('{"urgent":true,"a/b":{"~":"ok"}}', assertion)).toEqual([]);
  expect(evaluate('{"urgent":"true","a/b":{"~":"ok"}}', assertion)).toContainEqual({ code: 'field_type', status: 'failed', path: '/urgent', reason: 'expected boolean, got string' });
});
