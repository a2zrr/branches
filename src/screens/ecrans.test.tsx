import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { Accueil } from './Accueil';
import { Carte } from './Carte';
import { Parametres } from './Parametres';
import { useProgression } from '../game/store';
import { MISSIONS } from '../game/missions';

function rendre(chemin: string, element: React.ReactElement) {
  const routeur = createMemoryRouter(
    [
      { path: '/', element },
      { path: '/carte', element: <Carte /> },
      { path: '/parametres', element: <Parametres /> },
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
    expect(screen.getByText(`0 commandes maîtrisées sur ${NOTIONS_TOTAL}`)).toBeInTheDocument();
    expect(screen.getByText('Salut ! Ce soir on a une démo… et le projet est cassé.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Commencer' })).toHaveAttribute('href', '/mission/c1-m1');
  });

  it('carte : c1-m1 en cours, le reste verrouillé, chapitre 4 « bientôt »', () => {
    rendre('/carte', <Carte />);
    expect(screen.getByRole('button', { name: /Mission 1, Ton premier commit, en cours/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Commencer' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Mission 2, Qui a cassé quoi \?, verrouillée/ }),
    ).toBeDisabled();
    const chapitre4 = screen.getByRole('region', { name: 'Chapitre 4' });
    expect(within(chapitre4).getByText('Patience')).toBeInTheDocument();
    expect(within(chapitre4).getAllByText(/Hédi prépare déjà ses excuses/).length).toBeGreaterThan(0);
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
    expect(screen.getByText(`3 commandes maîtrisées sur ${NOTIONS_TOTAL}`)).toBeInTheDocument();
    expect(
      screen.getByText('Prochaine commande : git revert, dans la mission « La clé qui fuit ».'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Commencer' })).toHaveAttribute('href', '/mission/c1-m4');
    expect(screen.getByText('Bon. On reprend « La clé qui fuit » ?')).toBeInTheDocument();
  });
});

describe('paramètres', () => {
  it('le thème se bascule et se mémorise', async () => {
    const utilisateur = userEvent.setup();
    rendre('/parametres', <Parametres />);
    await utilisateur.click(screen.getByRole('button', { name: 'Sombre' }));
    expect(useProgression.getState().theme).toBe('sombre');
    expect(screen.getByRole('button', { name: 'Sombre' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('réinitialiser demande confirmation, puis efface la progression et garde le thème', async () => {
    const utilisateur = userEvent.setup();
    useProgression.setState({
      theme: 'sombre',
      progression: { 'c1-m1': { etoiles: 3, commandes: 2, reussie: true } },
      xp: 30,
    });
    rendre('/parametres', <Parametres />);
    await utilisateur.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await act(async () => {
      await utilisateur.click(screen.getByRole('button', { name: 'Annuler' }));
    });
    expect(useProgression.getState().progression['c1-m1']).toBeDefined();
    await utilisateur.click(screen.getByRole('button', { name: 'Réinitialiser' }));
    await act(async () => {
      await utilisateur.click(screen.getAllByRole('button', { name: 'Réinitialiser' }).at(-1) as HTMLElement);
    });
    expect(useProgression.getState().progression).toEqual({});
    expect(useProgression.getState().theme).toBe('sombre');
  });
});
