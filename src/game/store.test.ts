import { beforeEach, describe, expect, it } from 'vitest';
import { CLE_STOCKAGE, migrer, useProgression } from './store';

const reinit = () => {
  localStorage.clear();
  useProgression.setState({ theme: 'clair', progression: {}, xp: 0, chapitresDecouverts: [1] });
};

describe('store de progression', () => {
  beforeEach(reinit);

  it('terminerMission garde la meilleure note et est idempotent', () => {
    const s = useProgression.getState();
    s.terminerMission('c1-m4', 3);
    expect(useProgression.getState().progression['c1-m4']?.etoiles).toBe(2);
    s.terminerMission('c1-m4', 2);
    expect(useProgression.getState().progression['c1-m4']).toMatchObject({ etoiles: 3, commandes: 2 });
    useProgression.getState().terminerMission('c1-m4', 2);
    expect(useProgression.getState().progression['c1-m4']).toMatchObject({ etoiles: 3, commandes: 2 });
    expect(useProgression.getState().xp).toBe(30);
    useProgression.getState().terminerMission('c1-m4', 9);
    expect(useProgression.getState().progression['c1-m4']?.etoiles).toBe(3);
  });

  it('mission inconnue ou brouillon : rien n’est enregistré', () => {
    expect(useProgression.getState().terminerMission('inconnue', 1)).toBeNull();
    expect(useProgression.getState().terminerMission('c2-m3', 1)).toBeNull();
  });

  it('exporter puis importer redonne exactement la même partie', () => {
    useProgression.getState().terminerMission('c1-m1', 2);
    useProgression.getState().terminerMission('c1-m2', 4);
    const avant = JSON.stringify(useProgression.getState().progression);
    const texte = useProgression.getState().exporter();
    useProgression.getState().reinitialiser();
    expect(useProgression.getState().progression).toEqual({});
    const r = useProgression.getState().importer(texte);
    expect(r.ok).toBe(true);
    expect(JSON.stringify(useProgression.getState().progression)).toBe(avant);
    expect(useProgression.getState().xp).toBe(50);
  });

  it('un fichier invalide est refusé et la partie reste intacte', () => {
    useProgression.getState().terminerMission('c1-m1', 2);
    const avant = JSON.stringify(useProgression.getState().progression);
    for (const mauvais of [
      'pas du json',
      '{"format":"autre"}',
      JSON.stringify({
        format: 'branches-progression',
        version: 1,
        theme: 'clair',
        progression: { x: { etoiles: 9, commandes: 1, reussie: true } },
      }),
    ]) {
      const r = useProgression.getState().importer(mauvais);
      expect(r.ok).toBe(false);
    }
    expect(JSON.stringify(useProgression.getState().progression)).toBe(avant);
  });

  it('la progression survit à un rechargement (rehydrate depuis localStorage)', async () => {
    useProgression.getState().terminerMission('c1-m3', 3);
    const brut = localStorage.getItem(CLE_STOCKAGE);
    expect(brut).not.toBeNull();
    useProgression.setState({ progression: {}, xp: 0 });
    // Simule un rechargement : la partie enregistrée revient dans le store.
    localStorage.setItem(CLE_STOCKAGE, brut ?? '');
    await useProgression.persist.rehydrate();
    expect(useProgression.getState().progression['c1-m3']?.etoiles).toBe(3);
    expect(useProgression.getState().xp).toBe(30);
  });

  it('la migration depuis une version 0 simulée convertit les étoiles', () => {
    const migre = migrer({ progression: { 'c1-m1': 3, 'c1-m2': 0 }, theme: 'sombre' }, 0);
    expect(migre.progression).toEqual({ 'c1-m1': { etoiles: 3, commandes: 0, reussie: true } });
    expect(migre.theme).toBe('sombre');
    expect(migre.xp).toBe(30);
  });

  it('la migration depuis une version 0 réelle passe par le store', async () => {
    localStorage.setItem(
      CLE_STOCKAGE,
      JSON.stringify({ state: { progression: { 'c1-m2': 2 } }, version: 0 }),
    );
    await useProgression.persist.rehydrate();
    expect(useProgression.getState().progression['c1-m2']).toMatchObject({ etoiles: 2, reussie: true });
  });

  it('thème : la valeur choisie est conservée', () => {
    useProgression.getState().definirTheme('sombre');
    expect(useProgression.getState().theme).toBe('sombre');
  });
});

describe('chapitres découverts (version 2)', () => {
  it('une sauvegarde v1 où le chapitre 1 est fini migre vers [1, 2]', () => {
    const progression = Object.fromEntries(
      ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5', 'c1-m6'].map((id) => [
        id,
        { etoiles: 3, commandes: 1, reussie: true },
      ]),
    );
    const migre = migrer({ progression, theme: 'clair' }, 1);
    expect(migre.chapitresDecouverts).toEqual([1, 2]);
  });

  it('une partie neuve commence avec [1]', () => {
    expect(useProgression.getState().chapitresDecouverts).toEqual([1]);
  });

  it('marquerDecouverts ajoute sans doublon et « Recommencer » remet [1]', () => {
    useProgression.getState().marquerDecouverts([2, 2, 1]);
    expect(useProgression.getState().chapitresDecouverts).toEqual([1, 2]);
    useProgression.getState().reinitialiser();
    expect(useProgression.getState().chapitresDecouverts).toEqual([1]);
  });
});
