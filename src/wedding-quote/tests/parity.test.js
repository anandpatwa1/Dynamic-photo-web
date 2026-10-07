/** The engine is duplicated client/server; this fails the build if the copies drift. */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const clientDir = path.resolve(__dirname, '../utils/engine');
const serverDir = path.resolve(__dirname, '../../../../server/src/wedding-quote/services/engine');

describe('engine parity', () => {
  const files = fs.readdirSync(clientDir).filter((f) => f.endsWith('.js'));
  it('same file list', () => {
    if (!fs.existsSync(serverDir)) return; // client-only checkout
    expect(fs.readdirSync(serverDir).filter((f) => f.endsWith('.js')).sort()).toEqual(files.sort());
  });
  for (const f of files) {
    it(`${f} identical`, () => {
      if (!fs.existsSync(serverDir)) return;
      expect(fs.readFileSync(path.join(clientDir, f), 'utf8')).toBe(fs.readFileSync(path.join(serverDir, f), 'utf8'));
    });
  }
  it('test vectors identical', () => {
    const s = path.resolve(serverDir, '../../tests/fixtures/vectors.json');
    if (!fs.existsSync(s)) return;
    expect(fs.readFileSync(path.resolve(__dirname, 'fixtures/vectors.json'), 'utf8')).toBe(fs.readFileSync(s, 'utf8'));
  });
});
