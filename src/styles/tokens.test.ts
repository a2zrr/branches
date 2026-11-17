import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const tokens = readFileSync(resolve(import.meta.dirname, 'tokens.css'), 'utf8');

describe('tokens.css', () => {
  it('définit les variables de couleur sur :root', () => {
    expect(tokens).toMatch(/:root\s*\{/);
    expect(tokens).toContain('--color-bg:');
    expect(tokens).toContain('--color-primary:');
  });

  it('redéfinit les couleurs pour le mode sombre', () => {
    expect(tokens).toMatch(/\[data-theme="sombre"\]\s*\{/);
  });
});
