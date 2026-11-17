import { describe, expect, it } from 'vitest';
import {
  badgesDebloques,
  etatsMissions,
  etoilesPour,
  meilleureNote,
  missionEnCours,
  notionsTonGit,
  progressionChapitre,
  xpTotal,
  xpPour,
  type Progression,
} from './regles';
import { BADGES, MISSIONS } from './missions';
import type { MissionValidee } from './schemas';

const ligne = (
  id: string,
  chapitre: number,
  ordre: number,
  notion: string,
  brouillon = false,
): MissionValidee =>
  brouillon
    ? ({ id, chapitre, ordre, titre: id, notion, brouillon: true })
    : ({
        id,
        chapitre,
        ordre,
        titre: id,
        notion,
        type: 'terminal-graphe',
        histoire: 'h',
        objectif: 'o',
        depot: { branches: [], commits: [], head: { branche: 'main' } },
        indices: [],
        reussite: [{ type: 'fichierPropre', message: 'm' }],
        optimal: 2,
        appris: [],
        solution: [],
      } as unknown as MissionValidee);

const ok = (etoiles: 0 | 1 | 2 | 3, commandes: number = etoiles) => ({ etoiles, commandes, reussie: etoiles > 0 });

describe('étoiles (optimal = 2)', () => {
  it.each([
    [1, 3],
    [2, 3],
    [3, 2],
    [4, 2],
    [5, 1],
  ] as const)('%i commandes donnent %i étoiles', (commandes, attendu) => {
    expect(etoilesPour(commandes, 2)).toBe(attendu);
  });
});

describe('XP', () => {
  it('XP = étoiles × 10, cumulés par mission', () => {
    expect(xpPour(3)).toBe(30);
    expect(xpTotal({ a: ok(3), b: ok(2), c: ok(1) })).toBe(60);
  });

  it('une meilleure note remplace la précédente, jamais une moins bonne', () => {
    expect(meilleureNote(ok(2, 3), ok(3, 2)).etoiles).toBe(3);
    expect(meilleureNote(ok(3, 2), ok(1, 9)).etoiles).toBe(3);
    expect(meilleureNote(ok(2, 4), ok(2, 3)).commandes).toBe(3);
    expect(meilleureNote(undefined, ok(1))).toEqual(ok(1));
  });
});

describe('déblocage', () => {
  const liste = [ligne('c1-m1', 1, 1, 'a'), ligne('c1-m2', 1, 2, 'b'), ligne('c1-m3', 1, 3, 'c')];
  it('la première mission est en cours, les suivantes verrouillées', () => {
    expect(etatsMissions(liste, {})).toEqual({
      'c1-m1': 'en-cours',
      'c1-m2': 'verrouillee',
      'c1-m3': 'verrouillee',
    });
  });

  it('la mission suivante s’ouvre quand la précédente est réussie', () => {
    expect(etatsMissions(liste, { 'c1-m1': ok(3) })).toEqual({
      'c1-m1': 'terminee',
      'c1-m2': 'en-cours',
      'c1-m3': 'verrouillee',
    });
  });

  it('les brouillons restent verrouillés et sont sautés', () => {
    const avecBrouillon = [
      ligne('c1-m1', 1, 1, 'a'),
      ligne('c1-m2', 1, 2, 'b', true),
      ligne('c2-m1', 2, 1, 'd'),
    ];
    const etats = etatsMissions(avecBrouillon, { 'c1-m1': ok(2) });
    expect(etats['c1-m2']).toBe('verrouillee');
    expect(etats['c2-m1']).toBe('en-cours');
  });

  it('un chapitre s’ouvre quand le précédent est fini, en mode débogage tout est jouable', () => {
    const debug = etatsMissions(liste, {}, true);
    expect(Object.values(debug).filter((e) => e === 'verrouillee')).toHaveLength(0);
    expect(missionEnCours(liste, {})?.id).toBe('c1-m1');
    expect(missionEnCours(liste, { 'c1-m1': ok(1), 'c1-m2': ok(1), 'c1-m3': ok(1) })).toBeNull();
  });

  it('sur les vraies fiches, c1-m1 est en cours au départ', () => {
    expect(etatsMissions(MISSIONS, {})['c1-m1']).toBe('en-cours');
    expect(etatsMissions(MISSIONS, {})['c2-m1']).toBe('verrouillee');
  });
});

describe('Ton Git', () => {
  const liste = [
    ligne('c1-m1', 1, 1, 'git commit'),
    ligne('c1-m2', 1, 2, 'git log'),
    ligne('c1-m4', 1, 4, 'git revert', false),
  ];
  it('états : maîtrisée, en cours, à découvrir, sans doublon', () => {
    const notions = notionsTonGit(liste, { 'c1-m1': ok(3) }, liste[1] ?? null);
    expect(notions).toEqual([
      { nom: 'git commit', etat: 'maitrisee' },
      { nom: 'git log', etat: 'en-cours' },
      { nom: 'git revert', etat: 'a-decouvrir' },
    ]);
  });
});

describe('badges', () => {
  it('un badge se débloque quand sa notion est maîtrisée', () => {
    const notions = [
      { nom: 'git revert', etat: 'maitrisee' as const },
      { nom: 'git merge', etat: 'a-decouvrir' as const },
    ];
    const debloques = badgesDebloques(BADGES, notions);
    expect(debloques.has('annuleur')).toBe(true);
    expect(debloques.has('fusionneur')).toBe(false);
  });
});

describe('progression par chapitre', () => {
  it('compte les missions jouables et leurs étoiles', () => {
    const progression: Progression = { 'c1-m1': ok(3), 'c1-m2': ok(2) };
    expect(progressionChapitre(MISSIONS, 1, progression)).toMatchObject({ faites: 2, etoiles: 5 });
  });
});
