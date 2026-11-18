import { describe, expect, it } from 'vitest';
import { chapitresVisibles } from './carte';
import { CHAPITRES, MISSIONS } from './missions';
import type { Progression } from './regles';

const C1 = ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5', 'c1-m6'];
const C2 = ['c2-m2'];

function reussies(ids: string[]): Progression {
  return Object.fromEntries(ids.map((id) => [id, { etoiles: 3 as const, commandes: 1, reussie: true }]));
}

describe('chapitresVisibles (spec § 9 bis)', () => {
  it('partie neuve : seul le chapitre 1 est visible, mur caché n° 2, avancement 0 / 6', () => {
    const vue = chapitresVisibles(CHAPITRES, MISSIONS, {}, [1]);
    expect(vue.chapitres.map((c) => c.numero)).toEqual([1]);
    expect(vue.mur).toEqual({
      variante: 'cache',
      numero: 2,
      precedent: 1,
      texte: 'Termine les 6 missions du chapitre 1 pour les dissiper.',
      avancement: { faites: 0, total: 6 },
    });
    expect(vue.aDecouvrir).toBeNull();
  });

  it('chapitre 1 fini, pas encore découvert : chapitres 1 et 2 visibles, à découvrir = 2, mur caché n° 3', () => {
    const vue = chapitresVisibles(CHAPITRES, MISSIONS, reussies(C1), [1]);
    expect(vue.chapitres.map((c) => c.numero)).toEqual([1, 2]);
    expect(vue.aDecouvrir).toBe(2);
    expect(vue.mur).toMatchObject({
      variante: 'cache',
      numero: 3,
      texte: 'Termine la mission du chapitre 2 pour les dissiper.',
    });
  });

  it('chapitre 2 fini : mur « bientôt » n° 3, avec le sous-titre du chapitre annoncé', () => {
    const vue = chapitresVisibles(CHAPITRES, MISSIONS, reussies([...C1, ...C2]), [1, 2]);
    expect(vue.chapitres.map((c) => c.numero)).toEqual([1, 2]);
    expect(vue.mur).toEqual({
      variante: 'bientot',
      numero: 3,
      sousTitre: 'De nouvelles galères arrivent. Hédi prépare déjà ses excuses.',
    });
  });

  it('aucune mission d’un chapitre caché dans les listes renvoyées', () => {
    const vue = chapitresVisibles(CHAPITRES, MISSIONS, {}, [1]);
    expect(vue.missions.every((m) => m.chapitre === 1)).toBe(true);
    expect(vue.missions.length).toBe(6);
  });

  it('une progression de chapitre 1 partielle ne montre pas le chapitre 2', () => {
    const vue = chapitresVisibles(CHAPITRES, MISSIONS, reussies(C1.slice(0, 5)), [1]);
    expect(vue.chapitres.map((c) => c.numero)).toEqual([1]);
    expect(vue.mur).toMatchObject({ variante: 'cache', avancement: { faites: 5, total: 6 } });
  });

  it('le texte du mur met « la mission » au singulier', () => {
    const vue = chapitresVisibles(CHAPITRES, MISSIONS, reussies(C1), [1]);
    expect(vue.mur.variante === 'cache' && vue.mur.texte).toContain('Termine la mission du chapitre 2');
  });

  it('la ponctuation française a une espace insécable (?, !, :)', () => {
    const vue = chapitresVisibles(CHAPITRES, MISSIONS, reussies([...C1, ...C2]), [1, 2]);
    expect(vue.mur.variante === 'bientot' && vue.mur.sousTitre).not.toContain(' ?');
  });
});
