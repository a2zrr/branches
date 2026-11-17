import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Lit tokens.css et vérifie les contrastes WCAG, en clair et en sombre.

const source = readFileSync(resolve(import.meta.dirname, 'tokens.css'), 'utf8');

function variables(bloc: RegExp): Record<string, string> {
  const corps = bloc.exec(source)?.[1] ?? '';
  const resultat: Record<string, string> = {};
  for (const [, nom, valeur] of corps.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    if (nom !== undefined && valeur !== undefined) resultat[nom] = valeur;
  }
  return resultat;
}

const CLAIR = variables(/:root\s*\{([\s\S]*?)\n\}/);
const SOMBRE = { ...CLAIR, ...variables(/\[data-theme="sombre"\]\s*\{([\s\S]*?)\n\}/) };

function luminance(hex: string): number {
  const canaux = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = canaux;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [clair, fonce] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (clair + 0.05) / (fonce + 0.05);
}

function valeur(theme: Record<string, string>, nom: string): string {
  const v = theme[nom];
  if (v === undefined) throw new Error(`Variable absente : ${nom}`);
  return v;
}

const PAIRES_TEXTE: [string, string][] = [
  ['--color-text', '--color-bg'],
  ['--color-text-muted', '--color-bg'],
  ['--color-on-primary', '--color-primary'],
  ['--color-success-text', '--color-success-bg'],
  ['--color-danger-text', '--color-danger-bg'],
  ['--color-hint-text', '--color-hint-bg'],
  ['--color-info', '--color-info-bg'],
  ['--term-text', '--term-bg'],
];

const BRANCHES = ['--branch-1', '--branch-2', '--branch-3', '--branch-4', '--branch-5', '--branch-6'];

describe.each([
  ['clair', CLAIR],
  ['sombre', SOMBRE],
])('contrastes en mode %s', (_nom, theme) => {
  it.each(PAIRES_TEXTE)('%s sur %s ≥ 4,5:1', (texte, fond) => {
    expect(contraste(valeur(theme, texte), valeur(theme, fond))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(BRANCHES)('texte des étiquettes (--branch-ink) sur %s ≥ 4,5:1', (branche) => {
    expect(contraste(valeur(theme, '--branch-ink'), valeur(theme, branche))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(BRANCHES)('%s face à --color-bg et --color-surface ≥ 3:1', (branche) => {
    expect(contraste(valeur(theme, branche), valeur(theme, '--color-bg'))).toBeGreaterThanOrEqual(3);
    expect(contraste(valeur(theme, branche), valeur(theme, '--color-surface'))).toBeGreaterThanOrEqual(3);
  });
});
