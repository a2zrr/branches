// Registre des types d'exercice. Ajouter un type = un composant de plus et une ligne ici.
import type { ComponentType } from 'react';
import type { Depot, Evenement } from '../engine/types';
import type { Choix } from '../engine/types';
import type { MissionJouableValidee } from '../game/schemas';
import { TerminalGraphe } from './terminal-graphe/TerminalGraphe';
import { Conflit, ResumeConflit } from './conflit/Conflit';
import { preparerVerificationConflit } from './conflit/verification';

export type TypeExercice = 'terminal-graphe' | 'conflit';

/** Réponse saisie dans l'exercice : un choix par bloc de conflit (null = pas encore choisi). */
export type ReponseChoix = readonly (Choix | null)[];

export interface PropsExercice {
  mission: MissionJouableValidee;
  depot: Depot;
  majDepot: (depot: Depot, evenements?: Evenement[]) => void;
  compterCommande: () => void;
  signalerErreur: (explication: string) => void;
  setPret: (pret: boolean) => void;
  choix: ReponseChoix;
  setChoix: (choix: ReponseChoix) => void;
}

export type ResultatVerification =
  { ok: true; depot: Depot; reaction?: string } | { ok: false; message: string };

/** Contenu de gauche de la barre neutre, fourni par l'exercice (ex. « Choix : … »). */
export interface PropsResume {
  choix: ReponseChoix;
  mission: MissionJouableValidee;
}

export interface DefinitionExercice {
  Composant: ComponentType<PropsExercice>;
  ResumeBarre?: ComponentType<PropsResume>;
  /** Chaque vérification compte pour une étape (conflit). */
  compteLesValidations?: boolean;
  /** Étape propre au type avant la vérification générique (ex. appliquer le choix et valider la fusion). */
  preparerVerification?: (
    mission: MissionJouableValidee,
    depot: Depot,
    choix: ReponseChoix,
  ) => ResultatVerification;
}

export const REGISTRE: Record<TypeExercice, DefinitionExercice> = {
  'terminal-graphe': { Composant: TerminalGraphe },
  conflit: {
    Composant: Conflit,
    ResumeBarre: ResumeConflit,
    compteLesValidations: true,
    preparerVerification: preparerVerificationConflit,
  },
};
