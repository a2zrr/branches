import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Bouton } from './Bouton';
import { CarteChoix } from './CarteChoix';
import { BarreProgression } from './BarreProgression';
import { BandeauRetour } from './BandeauRetour';
import { PastilleMission } from './PastilleMission';
import { PuceNotion } from './PuceNotion';
import { Badge } from './Badge';
import { Mascotte } from '../mascotte/Mascotte';
import type { Badge as DonneesBadge } from '../../game/types';

describe('Bouton', () => {
  it.each(['primaire', 'secondaire', 'danger', 'indice', 'succes'] as const)(
    'rend la variante %s',
    (variante) => {
      render(<Bouton variante={variante}>Vérifier</Bouton>);
      expect(screen.getByRole('button', { name: 'Vérifier' })).toHaveClass(variante);
    },
  );

  it('est un vrai bouton (Entrée et Espace activent un <button> natif)', () => {
    const onClick = vi.fn();
    render(<Bouton onClick={onClick}>Continuer</Bouton>);
    const bouton = screen.getByRole('button', { name: 'Continuer' });
    expect(bouton.tagName).toBe('BUTTON');
    expect(bouton).toHaveAttribute('type', 'button');
  });

  it('est inactif quand desactive', () => {
    const onClick = vi.fn();
    render(
      <Bouton desactive onClick={onClick}>
        Vérifier
      </Bouton>,
    );
    const bouton = screen.getByRole('button', { name: 'Vérifier' });
    expect(bouton).toBeDisabled();
    bouton.click();
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('CarteChoix', () => {
  it('expose aria-pressed selon la sélection', () => {
    const { rerender } = render(
      <CarteChoix raccourci={1} titre="Garder ma version" selectionnee={false} onSelect={() => undefined} />,
    );
    expect(screen.getByRole('button', { name: /Garder ma version/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    rerender(<CarteChoix raccourci={1} titre="Garder ma version" selectionnee onSelect={() => undefined} />);
    expect(screen.getByRole('button', { name: /Garder ma version/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('BarreProgression', () => {
  it('expose role progressbar et ses aria-*', () => {
    render(<BarreProgression valeur={4} max={12} etiquette="Commandes maîtrisées" />);
    const barre = screen.getByRole('progressbar', { name: 'Commandes maîtrisées' });
    expect(barre).toHaveAttribute('aria-valuemin', '0');
    expect(barre).toHaveAttribute('aria-valuemax', '12');
    expect(barre).toHaveAttribute('aria-valuenow', '4');
    expect(within(barre).queryByText('33 %')).toBeNull();
    expect(screen.getByText('33 %')).toBeInTheDocument();
  });

  it('plafonne la valeur au maximum', () => {
    render(<BarreProgression valeur={20} max={10} etiquette="Test" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');
  });
});

describe('BandeauRetour', () => {
  it('le bandeau raté est une alerte avec le libellé COMPRIS', () => {
    render(<BandeauRetour type="rate" message="Git ne connaît pas « rever »." onAction={() => undefined} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Presque !');
    expect(screen.getByRole('button', { name: 'Compris' })).toBeInTheDocument();
  });

  it('le bandeau réussi propose CONTINUER', () => {
    render(<BandeauRetour type="reussi" onAction={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Continuer' })).toBeInTheDocument();
  });

  it('le bandeau neutre affiche les commandes et l’optimal', () => {
    render(<BandeauRetour type="neutre" commandes={2} optimal={3} onAction={() => undefined} />);
    expect(screen.getByText('Commandes : 2 · Optimal : 3')).toBeInTheDocument();
  });
});

describe('PastilleMission', () => {
  it('une mission verrouillée est désactivée', () => {
    render(<PastilleMission etat="verrouillee" etoiles={0} numero={5} titre="Fusionne" />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('la mission en cours affiche le popover COMMENCER', () => {
    const onClick = vi.fn();
    render(
      <PastilleMission etat="en-cours" etoiles={0} numero={4} titre="La clé qui fuit" onClick={onClick} />,
    );
    screen.getByRole('button', { name: 'Commencer' }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('PuceNotion et Badge', () => {
  it('une notion maîtrisée est annoncée comme telle', () => {
    render(<PuceNotion nom="git revert" etat="maitrisee" />);
    expect(screen.getByText('maîtrisée', { exact: false })).toBeInTheDocument();
  });

  it('un badge verrouillé est annoncé verrouillé', () => {
    const badge: DonneesBadge = {
      id: 'annuleur',
      nom: 'Annuleur',
      notion: 'git revert',
      couleur: '#FF9600',
      couleurArete: '#D97E00',
      icone: 'M9 13L4 8l5-5M4 8h11a5 5 0 0 1 0 10h-4',
    };
    render(<Badge badge={badge} debloque={false} />);
    expect(screen.getByRole('group', { name: 'Annuleur : verrouillé' })).toBeInTheDocument();
  });
});

describe('Mascotte', () => {
  it.each(['accueillant', 'panique', 'pensif', 'fier'] as const)(
    'rend l’expression %s avec un libellé',
    (expression) => {
      render(<Mascotte expression={expression} taille={120} />);
      expect(
        screen.getByRole('img', { name: new RegExp(expression === 'panique' ? 'paniqué' : expression) }),
      ).toBeInTheDocument();
    },
  );

  it('applique la taille demandée', () => {
    const { container } = render(<Mascotte expression="fier" taille={96} />);
    const racine = container.firstElementChild as HTMLElement;
    expect(racine.style.width).toBe('96px');
  });
});
