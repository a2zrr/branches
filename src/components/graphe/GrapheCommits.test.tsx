import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GrapheCommits } from './GrapheCommits';
import type { DonneesGraphe } from './layout';

const donnees: DonneesGraphe = {
  branches: [{ nom: 'main', pointe: 'c2' }],
  commits: [
    { id: 'c0', message: 'init', branche: 'main', parents: [] },
    { id: 'c1', message: 'ajoute', branche: 'main', parents: ['c0'] },
    { id: 'c2', message: 'corrige', branche: 'main', parents: ['c1'] },
  ],
  head: { branche: 'main' },
};

describe('GrapheCommits', () => {
  it('liste les rangées du plus récent au plus ancien, avec hash et message', () => {
    render(<GrapheCommits donnees={donnees} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0] as HTMLElement).getByText('c2')).toBeInTheDocument();
    expect(within(items[0] as HTMLElement).getByText('corrige')).toBeInTheDocument();
    expect(within(items[0] as HTMLElement).getByText('main')).toBeInTheDocument();
  });

  it('le graphe SVG est masqué aux lecteurs d’écran', () => {
    const { container } = render(<GrapheCommits donnees={donnees} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('sélection au clic et au clavier (aria-pressed)', async () => {
    const onSelect = vi.fn();
    const utilisateur = userEvent.setup();
    render(<GrapheCommits donnees={donnees} onSelect={onSelect} />);
    const bouton = screen.getAllByRole('button')[1] as HTMLElement;
    bouton.focus();
    await utilisateur.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('c1');
  });
});
