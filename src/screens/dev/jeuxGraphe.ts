import c1m4 from '../../data/missions/c1-m4.json';
import c2m2 from '../../data/missions/c2-m2.json';
import c1m6 from '../../data/missions/c1-m6.json';
import { creerDepot } from '../../engine/depot';
import { executer } from '../../engine/executer';
import type { Depot, FicheDepot } from '../../engine/types';
import { depotVersGraphe } from '../../components/graphe/adaptateur';
import type { DonneesGraphe } from '../../components/graphe/layout';

function jouer(depot: Depot, lignes: string[]): Depot {
  return lignes.reduce((d, l) => executer(d, l).depot, depot);
}

export interface JeuGraphe {
  id: string;
  titre: string;
  description: string;
  /** Étapes successives : la dernière est affichée au repos, les autres se rejouent. */
  etapes: DonneesGraphe[];
}

const fiche = (f: { depot: unknown }): Depot => creerDepot(f.depot as FicheDepot);

/** Jeu généré : 30 commits sur 8 branches, avec des fusions. */
function genere(nombre: number): FicheDepot {
  const noms = ['main', 'feature/a', 'feature/b', 'feature/c', 'fix/x', 'fix/y', 'release', 'exp'];
  const dernier: Record<string, string> = {};
  const commits: FicheDepot['commits'] = [];
  const hash = (i: number): string => (0xa0000 + i).toString(16);
  noms.forEach((nom, i) => {
    if (i === 0) return;
    dernier[nom] = '';
  });
  for (let i = 0; i < nombre; i += 1) {
    const b = noms[i % noms.length] ?? 'main';
    const id = hash(i);
    const parents: string[] = [];
    const precedent = dernier[b];
    if (precedent !== undefined && precedent !== '') parents.push(precedent);
    else if (i > 0) parents.push(hash(0));
    if (i % 7 === 6) {
      const autre = noms[(i + 3) % noms.length] ?? 'main';
      const pa = dernier[autre];
      if (pa !== undefined && pa !== '' && !parents.includes(pa)) parents.push(pa);
    }
    commits.push({ id, message: `commit ${i + 1} sur ${b}`, branche: b, parents });
    dernier[b] = id;
  }
  const branches = noms
    .map((nom) => ({ nom, pointe: dernier[nom] ?? hash(0) }))
    .filter((b) => b.pointe !== '');
  return { branches, commits, head: { branche: 'main' } };
}

export function jeuxGraphe(): JeuGraphe[] {
  const m4 = fiche(c1m4);
  const m4Revert = jouer(m4, ['git revert a3f9c2e']);

  const m2 = fiche(c2m2);
  const m2Fusion = jouer(m2, [
    'git merge feature/paiement',
    'git add src/BoutonPayer.jsx',
    'git commit -m "Fusion du paiement"',
  ]);
  const m2Avant = jouer(m2, ['git merge feature/paiement']);

  const m6 = fiche(c1m6);
  const m6Etapes = [
    jouer(m6, ['git bisect start', 'git bisect bad', 'git bisect good v0.9']),
    jouer(m6, [
      'git bisect start',
      'git bisect bad',
      'git bisect good v0.9',
      'npm run test:prix',
      'git bisect bad',
    ]),
    jouer(m6, [
      'git bisect start',
      'git bisect bad',
      'git bisect good v0.9',
      'npm run test:prix',
      'git bisect bad',
      'npm run test:prix',
      'git bisect good',
    ]),
    jouer(m6, [
      'git bisect start',
      'git bisect bad',
      'git bisect good v0.9',
      'npm run test:prix',
      'git bisect bad',
      'npm run test:prix',
      'git bisect good',
      'npm run test:prix',
      'git bisect bad',
    ]),
  ];

  const gen = creerDepot(genere(30));
  const gen29 = creerDepot(genere(29));

  return [
    {
      id: 'c1-m4',
      titre: 'c1-m4 : avant et après le revert',
      description: 'Le commit a3f9c2e est annulé par f0e1d2c, sans réécrire l’historique.',
      etapes: [depotVersGraphe(m4), depotVersGraphe(m4Revert, { nouveau: 'f0e1d2c' })],
    },
    {
      id: 'c2-m2',
      titre: 'c2-m2 : conflit puis fusion résolue',
      description:
        'Deux branches ont modifié le même bouton. La fusion résolue crée un commit à deux parents.',
      etapes: [depotVersGraphe(m2Avant), depotVersGraphe(m2Fusion, { nouveau: idDernier(m2Fusion) })],
    },
    {
      id: 'c1-m6',
      titre: 'c1-m6 : git bisect en cours',
      description: 'Les commits en pointillés sont à tester. Le badge indique le verdict de chaque test.',
      etapes: m6Etapes.map((d) => depotVersGraphe(d)),
    },
    {
      id: 'genere-30',
      titre: 'Jeu généré : 30 commits sur 8 branches',
      description: 'Des fusions entre branches, pour vérifier la lisibilité et les performances.',
      etapes: [depotVersGraphe(gen29), depotVersGraphe(gen, { nouveau: idDernier(gen) })],
    },
  ];
}

function idDernier(depot: Depot): string {
  const dernier = Object.values(depot.commits).sort((a, b) => b.seq - a.seq)[0];
  return dernier?.id ?? '';
}
