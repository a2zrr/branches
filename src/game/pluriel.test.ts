import { describe, expect, it } from 'vitest';
import { compter, pluriel } from './pluriel';

describe('pluriel', () => {
  it('0 et 1 prennent le singulier', () => {
    expect(pluriel(0, 'commande', 'commandes')).toBe('commande');
    expect(pluriel(1, 'commande', 'commandes')).toBe('commande');
  });

  it('2 et 15 prennent le pluriel', () => {
    expect(pluriel(2, 'commande', 'commandes')).toBe('commandes');
    expect(pluriel(15, 'notion maîtrisée', 'notions maîtrisées')).toBe('notions maîtrisées');
  });

  it('compter écrit le nombre suivi de l’accord', () => {
    expect(compter(1, 'notion maîtrisée', 'notions maîtrisées')).toBe('1 notion maîtrisée');
    expect(compter(15, 'notion maîtrisée', 'notions maîtrisées')).toBe('15 notions maîtrisées');
  });
});
