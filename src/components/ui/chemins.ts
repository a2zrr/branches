// Chemins d'icônes (grille 24, trait arrondi). Les couleurs viennent du CSS appelant (currentColor).
export const CHEMINS = {
  coche: 'M5 12.5l4.5 4.5L19 7',
  cadenas: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3',
  lecture: 'M8 5.5v13l10.5-6.5z',
  terminal: 'M7 8l4 4-4 4M13 16h5',
  etoile: 'M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.1 6.4 20l1.1-6.2L2.9 9.4l6.3-.9z',
  retour: 'M9 13L4 8l5-5M4 8h11a5 5 0 0 1 0 10h-4',
  fusion:
    'M4 5a2 2 0 1 0 4 0a2 2 0 1 0-4 0M4 19a2 2 0 1 0 4 0a2 2 0 1 0-4 0M16 15a2 2 0 1 0 4 0a2 2 0 1 0-4 0M6 7v10M6 7c0 6 12 2 12 6',
  etiquette: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z',
  engrenage: 'M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 1 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3',
} as const;

export type NomIcone = keyof typeof CHEMINS;
