import { describe, expect, it } from 'vitest';
import {
  cheminForme,
  cheminLien,
  colonnes,
  GAP,
  PAD,
  placerGraphe,
  ROW,
  styleBranche,
  x,
  y,
  type DonneesGraphe,
} from './layout';

/** Jeu de 30 commits sur 8 branches, avec des fusions (même principe que la page de développement). */
function jeuGenere(n: number): DonneesGraphe {
  const noms = ['main', 'a', 'b', 'c', 'd', 'e', 'f', 'g'];
  const dernier: Record<string, string> = {};
  const commits: DonneesGraphe['commits'][number][] = [];
  const hash = (i: number): string => (0xa0000 + i).toString(16);
  for (let i = 0; i < n; i += 1) {
    const b = noms[i % noms.length] ?? 'main';
    const parents: string[] = [];
    const prec = dernier[b];
    if (prec !== undefined) parents.push(prec);
    if (i % 7 === 6) {
      const autre = dernier[noms[(i + 3) % noms.length] ?? 'main'];
      if (autre !== undefined && !parents.includes(autre)) parents.push(autre);
    }
    commits.push({ id: hash(i), message: `c${i}`, branche: b, parents });
    dernier[b] = hash(i);
  }
  return {
    branches: noms.map((nom) => ({ nom, pointe: dernier[nom] ?? hash(0) })),
    commits,
    head: { branche: 'main' },
  };
}

const petit: DonneesGraphe = {
  branches: [
    { nom: 'main', pointe: 'c3' },
    { nom: 'dev', pointe: 'c2' },
  ],
  commits: [
    { id: 'c0', message: 'racine', branche: 'main', parents: [] },
    { id: 'c1', message: 'sur dev', branche: 'dev', parents: ['c0'] },
    { id: 'c2', message: 'dev 2', branche: 'dev', parents: ['c1'] },
    { id: 'c3', message: 'fusion', branche: 'main', parents: ['c0', 'c2'] },
  ],
  head: { branche: 'main' },
  tags: [{ nom: 'v1', commit: 'c0' }],
};

describe('formules x et y', () => {
  it('x = 26 + colonne × 34 ; y = rang × 50 + 25', () => {
    expect(PAD).toBe(26);
    expect(GAP).toBe(34);
    expect(ROW).toBe(50);
    expect(x(0)).toBe(26);
    expect(x(3)).toBe(26 + 3 * 34);
    expect(y(0)).toBe(25);
    expect(y(2)).toBe(2 * 50 + 25);
  });

  it('colonne = celle de la branche ; sinon celle du premier parent ; sinon 0', () => {
    const col = colonnes(petit);
    expect(col['c0']).toBe(0);
    expect(col['c1']).toBe(1);
    expect(col['c2']).toBe(1);
    expect(col['c3']).toBe(0);
    const sansBranche = colonnes({
      ...petit,
      commits: [{ id: 'z', message: '', branche: 'inconnue', parents: [] }],
    });
    expect(sansBranche['z']).toBe(0);
  });

  it('largeur du graphe = 52 + (colonnes − 1) × 34', () => {
    const g = placerGraphe(petit);
    expect(g.largeur).toBe(52 + (2 - 1) * 34);
    expect(g.hauteur).toBe(4 * 50);
  });
});

describe('couleur et forme cycliques, motif par tranche de 6', () => {
  it('index 0 : cercle, couleur 1, plein', () => {
    expect(styleBranche(0)).toMatchObject({
      couleur: 1,
      forme: 'cercle',
      motif: 0,
      tirets: 'none',
      evide: false,
    });
  });

  it('cycle de couleur et de forme tous les 6 index', () => {
    expect(styleBranche(6).couleur).toBe(1);
    expect(styleBranche(6).forme).toBe('cercle');
    expect(styleBranche(5).forme).toBe('etoile');
    expect(styleBranche(1).forme).toBe('carre');
  });

  it('motif tirets à l’index 6, pointillés à l’index 12', () => {
    expect(styleBranche(6)).toMatchObject({ motif: 1, tirets: '7 6', evide: true });
    expect(styleBranche(12)).toMatchObject({ motif: 2, tirets: '2 7', evide: true });
  });
});

describe('chemins des liens', () => {
  it('droit : segment', () => {
    expect(cheminLien('droit', 26, 25, 26, 75)).toBe('M26 25 L26 75');
  });

  it('départ de branche : descente puis courbe sur la dernière rangée', () => {
    expect(cheminLien('depart', 60, 25, 26, 125)).toBe('M60 25 L60 75 C60 105 26 95 26 125');
  });

  it('fusion : courbe sur la première rangée puis descente', () => {
    expect(cheminLien('fusion', 26, 25, 60, 75)).toBe('M26 25 C26 55 60 45 60 75 L60 75');
  });

  it('placerGraphe produit les trois types de liens et leurs couleurs', () => {
    const g = placerGraphe(petit);
    const types = new Set(g.liens.map((l) => l.type));
    expect(types).toEqual(new Set(['droit', 'depart', 'fusion']));
    expect(g.liens.find((l) => l.type === 'fusion')?.couleur).toBe(2);
  });
});

describe('formes', () => {
  it('chaque forme a un chemin non vide', () => {
    for (const f of ['cercle', 'carre', 'losange', 'triangle', 'croix', 'etoile'] as const) {
      expect(cheminForme(f, 11).length).toBeGreaterThan(5);
    }
  });
});

describe('nœuds et étiquettes', () => {
  it('rayon 13,5 pour fusion et revert, 11 sinon ; état HEAD et nouveau', () => {
    const g = placerGraphe({ ...petit, vue: { nouveau: 'c1' } });
    expect(g.noeuds.find((n) => n.id === 'c3')?.R).toBe(13.5);
    expect(g.noeuds.find((n) => n.id === 'c0')?.R).toBe(11);
    expect(g.noeuds.find((n) => n.id === 'c3')?.etat).toBe('head');
    expect(g.noeuds.find((n) => n.id === 'c1')?.etat).toBe('nouveau');
  });

  it('ordre des étiquettes : HEAD, branches, tags, puces', () => {
    const g = placerGraphe({
      ...petit,
      head: { branche: 'main' },
      tags: [{ nom: 'v1', commit: 'c3' }],
      vue: { nouveau: 'c3' },
    });
    const ligne = g.lignes.find((l) => l.id === 'c3');
    expect(ligne?.etiquettes.map((e) => e.type)).toEqual(['head', 'branche', 'tag', 'puce']);
  });

  it('HEAD détaché affiche « HEAD » seule', () => {
    const g = placerGraphe({ ...petit, head: { commit: 'c1' } });
    expect(g.lignes.find((l) => l.id === 'c1')?.etiquettes[0]).toEqual({
      type: 'head',
      nom: 'HEAD',
      detache: true,
    });
  });

  it('annulé : le commit visé par un revert est marqué et porte une puce', () => {
    const g = placerGraphe({
      ...petit,
      commits: [
        ...petit.commits,
        { id: 'r1', message: 'Revert', branche: 'main', parents: ['c3'], type: 'revert', annule: 'c1' },
      ],
      branches: [
        { nom: 'main', pointe: 'r1' },
        { nom: 'dev', pointe: 'c2' },
      ],
      head: { branche: 'main' },
    });
    const annule = g.noeuds.find((n) => n.id === 'c1');
    expect(annule?.annule).toBe(true);
    expect(annule?.tirets).toBe('4 4');
    expect(g.lignes.find((l) => l.id === 'c1')?.annule).toBe(true);
    expect(g.noeuds.find((n) => n.id === 'r1')?.type).toBe('revert');
  });

  it('bisect : marques bon, mauvais, à tester', () => {
    const g = placerGraphe({ ...petit, vue: { bisect: { bons: ['c0'], mauvais: ['c3'], test: 'c2' } } });
    expect(g.noeuds.find((n) => n.id === 'c0')?.bisect).toBe('bon');
    expect(g.noeuds.find((n) => n.id === 'c3')?.bisect).toBe('mauvais');
    expect(g.noeuds.find((n) => n.id === 'c2')?.bisect).toBe('test');
  });
});

describe('jeu de 30 commits sur 8 branches', () => {
  it('aucun nœud ne partage ses coordonnées avec un autre', () => {
    const g = placerGraphe(jeuGenere(30));
    const cles = new Set(g.noeuds.map((n) => `${n.x}:${n.y}`));
    expect(cles.size).toBe(30);
    expect(g.noeuds.length).toBe(30);
  });

  it('il contient des fusions', () => {
    const g = placerGraphe(jeuGenere(30));
    expect(g.noeuds.some((n) => n.type === 'fusion')).toBe(true);
  });

  it('rendu de 200 commits en moins de 100 ms', () => {
    const jeu = jeuGenere(200);
    placerGraphe(jeu);
    const debut = performance.now();
    placerGraphe(jeu);
    expect(performance.now() - debut).toBeLessThan(100);
  });
});
