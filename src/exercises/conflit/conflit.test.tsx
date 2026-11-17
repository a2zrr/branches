import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { analyserMarqueurs } from '../../components/conflit/analyse';
import { creerDepot } from '../../engine/depot';
import { executer } from '../../engine/executer';
import { resoudreFichier, marqueursRestants } from '../../engine/commandes/fusion';
import { preparerVerificationConflit } from './verification';
import { Conflit } from './Conflit';
import { REGISTRE, type DefinitionExercice, type PropsExercice } from '../registre';
import { CoqueMission } from '../../screens/CoqueJeu';
import { depotInitial } from '../../game/solution';
import { trouverMission } from '../../game/missions';
import type { FicheDepot, Depot } from '../../engine/types';
import type { MissionJouableValidee } from '../../game/schemas';
import m2 from '../../data/missions/c2-m2.json';

const mission = trouverMission('c2-m2') as MissionJouableValidee;

/** Fiche à deux blocs de conflit dans un même fichier. */
const deuxBlocs: FicheDepot = {
  branches: [
    { nom: 'main', pointe: 'm2' },
    { nom: 'dev', pointe: 'd1' },
  ],
  commits: [
    {
      id: 'b0',
      message: 'base',
      branche: 'main',
      parents: [],
      fichiers: { 'f.txt': ['a', 'b', 'c', 'd', 'e'] },
    },
    {
      id: 'm2',
      message: 'main',
      branche: 'main',
      parents: ['b0'],
      fichiers: { 'f.txt': ['A1', 'b', 'c', 'D1', 'e'] },
    },
    {
      id: 'd1',
      message: 'dev',
      branche: 'dev',
      parents: ['b0'],
      fichiers: { 'f.txt': ['A2', 'b', 'c', 'D2', 'e'] },
    },
  ],
  head: { branche: 'main' },
};

describe('marqueurs de conflit', () => {
  it('lit un bloc : début, version de ta branche, séparation, version de l’autre, fin', () => {
    const lignes = analyserMarqueurs([
      'x',
      '<<<<<<< HEAD',
      'mine',
      '=======',
      'theirs',
      '>>>>>>> feature',
      'y',
    ]);
    expect(lignes.map((l) => l.type)).toEqual([
      'normale',
      'debut',
      'ours',
      'separation',
      'theirs',
      'fin',
      'normale',
    ]);
    expect(lignes[1]?.bloc).toBe(0);
    expect(lignes[6]?.bloc).toBeNull();
  });

  it('lit deux blocs dans un même fichier (numérotés 0 et 1)', () => {
    const lignes = analyserMarqueurs([
      '<<<<<<< HEAD',
      'a',
      '=======',
      'b',
      '>>>>>>> dev',
      'milieu',
      '<<<<<<< HEAD',
      'c',
      '=======',
      'd',
      '>>>>>>> dev',
    ]);
    expect(lignes.filter((l) => l.type === 'debut').map((l) => l.bloc)).toEqual([0, 1]);
    expect(lignes.filter((l) => l.type === 'fin').map((l) => l.bloc)).toEqual([0, 1]);
  });

  it('le fichier de c2-m2 contient les trois marqueurs à leur place', () => {
    const conflit = executer(depotInitial(mission), 'git merge feature/paiement').depot;
    const types = analyserMarqueurs(conflit.travail['src/BoutonPayer.jsx'] ?? []).map((l) => l.type);
    expect(types).toContain('debut');
    expect(types).toContain('separation');
    expect(types).toContain('fin');
  });
});

describe('chaque choix produit le bon fichier, sans marqueur, et un commit à deux parents', () => {
  const avant = depotInitial(mission);
  it.each([
    ['mienne', 'Payer {total} €'],
    ['autre', 'PAYER VITE'],
    ['deux', 'PAYER VITE'],
  ] as const)('%s', (choix, attendu) => {
    const verification = preparerVerificationConflit(mission, avant, [choix]);
    expect(verification.ok).toBe(true);
    if (!verification.ok) return;
    expect(marqueursRestants(verification.depot)).toBe(false);
    const tete = verification.depot.commits[verification.depot.branches['main'] ?? ''];
    expect(tete?.parents).toHaveLength(2);
    expect(tete?.arbre['src/BoutonPayer.jsx']?.join('\n')).toContain(attendu);
    if (choix === 'deux') expect(tete?.arbre['src/BoutonPayer.jsx']?.join('\n')).toContain('Payer {total} €');
  });

  it('refuse un choix non accepté ou un bloc sans choix', () => {
    expect(preparerVerificationConflit(mission, avant, []).ok).toBe(false);
    expect(preparerVerificationConflit(mission, avant, [null]).ok).toBe(false);
  });

  it('la réaction du choix est reprise de la fiche', () => {
    const r = preparerVerificationConflit(mission, avant, ['autre']);
    expect(r.ok && r.reaction).toBe(m2.exercice.reactions.autre);
  });

  it('résoudre deux blocs séparément donne le fichier attendu', () => {
    const fusion = executer(creerDepot(deuxBlocs), 'git merge dev').depot;
    expect(fusion.fusion?.fichiers['f.txt']?.filter((s) => 'conflit' in s)).toHaveLength(2);
    const resolu = resoudreFichier(fusion, 'f.txt', ['mienne', 'autre']);
    expect(resolu.index['f.txt']).toEqual(['A1', 'b', 'c', 'D2', 'e']);
  });
});

describe('exercice conflit : interface', () => {
  function rendre(depot: Depot, choix: (string | null)[], setChoix = vi.fn()) {
    const props: PropsExercice = {
      mission: depot === depotInitial(mission) ? mission : mission,
      depot,
      majDepot: () => undefined,
      compterCommande: () => undefined,
      signalerErreur: () => undefined,
      setPret: () => undefined,
      choix: choix as PropsExercice['choix'],
      setChoix,
    };
    render(
      <MemoryRouter>
        <Conflit {...props} />
      </MemoryRouter>,
    );
    return setChoix;
  }

  it('un seul bloc : pas de navigation, les trois cartes de choix sont présentes', () => {
    const depot = depotInitial(mission);
    rendre(depot, []);
    expect(screen.queryByText(/Conflit 1 sur/)).toBeNull();
    expect(screen.getByRole('button', { name: /Garder ma version/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: /Garder les deux/ })).toBeInTheDocument();
  });

  it('deux blocs : « Conflit 1 sur 2 », navigation Suivant, choix par bloc', async () => {
    const utilisateur = userEvent.setup();
    const fusion = executer(creerDepot(deuxBlocs), 'git merge dev').depot;
    const setChoix = rendre(fusion, [null, null]);
    expect(screen.getByText('Conflit 1 sur 2')).toBeInTheDocument();
    await utilisateur.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText('Conflit 2 sur 2')).toBeInTheDocument();
    await utilisateur.click(screen.getByRole('button', { name: /Garder l’autre/ }));
    expect(setChoix).toHaveBeenLastCalledWith([null, 'autre']);
  });

  it('les touches 1, 2 et 3 choisissent le bloc actif, et l’aperçu suit le choix', async () => {
    const utilisateur = userEvent.setup();
    const setChoix = rendre(depotInitial(mission), []);
    await utilisateur.keyboard('2');
    expect(setChoix).toHaveBeenLastCalledWith(['autre']);
    await utilisateur.keyboard('3');
    expect(setChoix).toHaveBeenLastCalledWith(['deux']);
  });
});

describe('extensibilité : un type d’exercice factice s’affiche sans modifier la coque', () => {
  it('le type « demo » s’enregistre dans le registre et s’affiche dans CoqueMission', () => {
    function Demo({ mission: m }: PropsExercice) {
      return <p>Exercice démo pour {m.titre}</p>;
    }
    const definition: DefinitionExercice = { Composant: Demo };
    (REGISTRE as unknown as Record<string, DefinitionExercice>)['demo'] = definition;
    const factice = { ...mission, type: 'demo' } as unknown as MissionJouableValidee;
    render(
      <MemoryRouter>
        <CoqueMission mission={factice} />
      </MemoryRouter>,
    );
    expect(screen.getByText(`Exercice démo pour ${mission.titre}`)).toBeInTheDocument();
    delete (REGISTRE as unknown as Record<string, DefinitionExercice | undefined>)['demo'];
  });
});
