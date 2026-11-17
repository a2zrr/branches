import { describe, expect, it } from 'vitest';
import { MISSIONS, CHAPITRES, BADGES } from './missions';
import { evaluerReussite } from './reussite';
import { appliquerSolution, depotInitial } from './solution';
import { estJouable } from './regles';

describe('fiches de mission', () => {
  it('toutes les fiches sont valides et chargées', () => {
    expect(MISSIONS.length).toBeGreaterThanOrEqual(15);
    expect(CHAPITRES.length).toBe(4);
    expect(BADGES.length).toBe(6);
  });

  it('aucune fiche ne contient « aCompleter », les id sont uniques, le couple (chapitre, ordre) aussi', () => {
    for (const m of MISSIONS) expect((m as unknown as Record<string, unknown>)['aCompleter'], m.id).toBeUndefined();
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    expect(new Set(MISSIONS.map((m) => `${m.chapitre}:${m.ordre}`)).size).toBe(MISSIONS.length);
  });

  it('les fiches sont triées par chapitre puis ordre', () => {
    const cles = MISSIONS.map((m) => m.chapitre * 1000 + m.ordre);
    expect([...cles].sort((a, b) => a - b)).toEqual(cles);
  });
});

describe.each(MISSIONS.filter(estJouable).map((m) => [m.id, m] as const))('mission jouable %s', (_id, mission) => {
  it("l'état initial ne satisfait pas la réussite", () => {
    expect(evaluerReussite(depotInitial(mission), mission.reussite).ok).toBe(false);
  });

  it('exécuter la solution satisfait la réussite', () => {
    const fin = appliquerSolution(mission, depotInitial(mission));
    const resultat = evaluerReussite(fin, mission.reussite);
    expect(resultat.messageDuPremierEchec).toBeUndefined();
    expect(resultat.ok).toBe(true);
  });

  it('solution.length === optimal', () => {
    expect(mission.solution.length).toBe(mission.optimal);
  });
});
