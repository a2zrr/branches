// Registre des types d'exercice. Ajouter un type = un composant de plus et une ligne ici.
import type { ComponentType } from 'react';
import type { Depot, Evenement } from '../engine/types';
import type { MissionJouableValidee } from '../game/schemas';
import { TerminalGraphe } from './terminal-graphe/TerminalGraphe';
import { Conflit } from './conflit/Conflit';

export type TypeExercice = 'terminal-graphe' | 'conflit';

export interface PropsExercice {
  mission: MissionJouableValidee;
  depot: Depot;
  majDepot: (depot: Depot, evenements?: Evenement[]) => void;
  compterCommande: () => void;
  signalerErreur: (explication: string) => void;
  setPret: (pret: boolean) => void;
}

export interface DefinitionExercice {
  Composant: ComponentType<PropsExercice>;
  compteLesValidations?: boolean;
}

export const REGISTRE: Record<TypeExercice, DefinitionExercice> = {
  'terminal-graphe': { Composant: TerminalGraphe },
  conflit: { Composant: Conflit, compteLesValidations: true },
};
