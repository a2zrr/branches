import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { Accueil } from './Accueil';
import { Carte } from './Carte';
import { CarteAdmin } from './CarteAdmin';
import { FenetreParametres } from '../components/parametres/FenetreParametres';
import { useInterface } from '../game/ui';
import { useProgression } from '../game/store';
import { MISSIONS } from '../game/missions';

function rendre(chemin: string, element: React.ReactElement) {
  const routeur = createMemoryRouter(
    [
      { path: '/', element },
      { path: '/carte', element: <Carte /> },
      { path: '/mission/:id', element: <p>Mission</p> },
    ],
    { initialEntries: [chemin] },
  );
  return render(<RouterProvider router={routeur} />);
}

const NOTIONS_TOTAL = new Set(MISSIONS.map((m) => m.notion)).size;

beforeEach(() => {
  localStorage.clear();
  useProgression.setState({ theme: 'clair', progression: {}, xp: 0, debug: false });
});

describe('nouveau visiteur', () => {
  it('accueil : 0 / N notions, bulle de première visite, COMMENCER vers c1-m1', () => {
    rendre('/', <Accueil />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Apprends Git en sauvant la démo de ce soir.' }),
    ).toBeInTheDocument();
    expect(screen.getByText(`0 notion maîtrisée sur ${NOTIONS_TOTAL}`)).toBeInTheDocument();
    expect(screen.getByText('Salut ! Ce soir on a une démo… et le projet est cassé.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Commencer' })).toHaveAttribute('href', '/mission/c1-m1');
  });

  it('carte : c1-m1 en cours, le reste verrouillé, rien après le chapitre 1 (correctif 3 : chapitres cachés absents)', () => {
    rendre('/carte', <Carte />);
    expect(screen.getByRole('button', { name: /Mission 1, Ton premier commit, en cours/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Commencer' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Mission 2, Qui a cassé quoi \?, verrouillée/ }),
    ).toBeDisabled();
    expect(screen.getAllByRole('region', { name: 'Chapitre 1' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('region', { name: 'Chapitre 2' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Chapitre 4' })).not.toBeInTheDocument();
  });
});

describe('partie injectée (c1-m1 à c1-m3 réussies avec 3, 2 et 3 étoiles)', () => {
  beforeEach(() => {
    useProgression.setState({
      progression: {
        'c1-m1': { etoiles: 3, commandes: 2, reussie: true },
        'c1-m2': { etoiles: 2, commandes: 3, reussie: true },
        'c1-m3': { etoiles: 3, commandes: 3, reussie: true },
      },
      xp: 80,
    });
  });

  it('carte : 3 terminées, m4 en cours avec popover, m5 et m6 verrouillées, 8 étoiles', () => {
    rendre('/carte', <Carte />);
    expect(
      screen.getByRole('button', { name: /Mission 1, Ton premier commit, terminée, 3 étoiles/ }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: /Mission 4, La clé qui fuit, en cours/ })).toBeEnabled();
    expect(screen.getByRole('group', { name: 'Mission 4' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Mission 5, Fusionne avant 20 h, verrouillée/ }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /Mission 6, Le bug fantôme, verrouillée/ })).toBeDisabled();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reprendre la mission 4' })).toBeInTheDocument();
  });

  it('accueil : 3 notions maîtrisées et git revert en cours', () => {
    rendre('/', <Accueil />);
    expect(screen.getByText(`3 notions maîtrisées sur ${NOTIONS_TOTAL}`)).toBeInTheDocument();
    expect(
      screen.getByText('Prochaine commande : git revert, dans la mission « La clé qui fuit ».'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Commencer' })).toHaveAttribute('href', '/mission/c1-m4');
    expect(screen.getByText('Bon. On reprend « La clé qui fuit » ?')).toBeInTheDocument();
  });
});

describe('panneau paramètres', () => {
  beforeEach(() => {
    useInterface.setState({ parametresOuverts: true });
  });

  it('le thème se bascule et se mémorise', async () => {
    const utilisateur = userEvent.setup();
    render(<FenetreParametres />);
    await utilisateur.click(screen.getByRole('radio', { name: 'Sombre' }));
    expect(useProgression.getState().theme).toBe('sombre');
    expect(screen.getByRole('radio', { name: 'Sombre' })).toHaveAttribute('aria-checked', 'true');
  });

  it('recommencer demande deux confirmations, puis efface la progression et garde le thème', async () => {
    const utilisateur = userEvent.setup();
    useProgression.setState({
      theme: 'sombre',
      progression: { 'c1-m1': { etoiles: 3, commandes: 2, reussie: true } },
      xp: 30,
    });
    render(<FenetreParametres />);
    await utilisateur.click(screen.getByRole('button', { name: 'Recommencer à zéro' }));
    await utilisateur.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(useProgression.getState().progression['c1-m1']).toBeDefined();
    await utilisateur.click(screen.getByRole('button', { name: 'Recommencer à zéro' }));
    await utilisateur.click(screen.getByRole('button', { name: 'Oui' }));
    await utilisateur.click(screen.getByRole('button', { name: 'Tout effacer' }));
    expect(useProgression.getState().progression).toEqual({});
    expect(useProgression.getState().theme).toBe('sombre');
  });
});

describe('aperçu de design /carte/admin', () => {
  it('affiche tous les chapitres, y compris les chapitres cachés dans le jeu', () => {
    const routeur = createMemoryRouter(
      [
        { path: '/carte/admin', element: <CarteAdmin /> },
        { path: '/mission/:id', element: <p>Mission</p> },
      ],
      { initialEntries: ['/carte/admin'] },
    );
    render(<RouterProvider router={routeur} />);
    expect(screen.getByRole('region', { name: 'Chapitre 1' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Chapitre 2' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Chapitre 3' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Chapitre 4' })).toBeInTheDocument();
    expect(screen.getByText('Mais qui est Kévin ?')).toBeInTheDocument();
  });
});
