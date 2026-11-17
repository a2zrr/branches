import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Aucune couleur en dur dans les composants et les écrans : seulement des variables de tokens.css.
const RACINE = resolve(import.meta.dirname, '..');

/** Seuls fichiers autorisés à contenir des couleurs : les SVG de la mascotte (et de l'icône). */
const EXCEPTIONS = new Set(['components/mascotte/formes.tsx']);

const MOTIF_INTERDIT = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.(tsx|module\.css)$/.test(nom) && !/\.test\.tsx$/.test(nom) ? [chemin] : [];
  });
}

describe('aucune couleur en dur', () => {
  const cibles = [...fichiers(join(RACINE, 'components')), ...fichiers(join(RACINE, 'screens'))];

  it('examine des fichiers', () => {
    expect(cibles.length).toBeGreaterThan(10);
  });

  it.each(cibles.map((c) => [relative(RACINE, c), c]))('%s n’utilise que des variables', (_nom, chemin) => {
    const relatif = relative(RACINE, chemin);
    if (EXCEPTIONS.has(relatif)) return;
    const contenu = readFileSync(chemin, 'utf8');
    const trouve = contenu.split('\n').filter((ligne) => MOTIF_INTERDIT.test(ligne));
    expect(trouve).toEqual([]);
  });
});
