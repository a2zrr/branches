// Mise en situation d'une mission et application de sa solution (sert aux tests et aux vérifications).
import { creerDepot } from '../engine/depot';
import { executer } from '../engine/executer';
import { resoudreFichier } from '../engine/commandes/fusion';
import type { Choix, Depot } from '../engine/types';
import type { MissionJouableValidee } from './schemas';

/** État initial d'une mission. Pour un conflit, la commande de départ est exécutée au chargement. */
export function depotInitial(mission: MissionJouableValidee): Depot {
  const depart = creerDepot(mission.depot);
  if (mission.exercice !== undefined) {
    return executer(depart, mission.exercice.commandeDeDepart).depot;
  }
  return depart;
}

/**
 * Applique une solution : une ligne de commande, ou « choix:X » pour un conflit
 * (résolution du fichier puis validation de la fusion, qui compte pour une étape).
 */
export function appliquerSolution(mission: MissionJouableValidee, depot: Depot): Depot {
  return mission.solution.reduce((d, ligne) => {
    if (ligne.startsWith('choix:')) {
      const choix: Choix = ligne.slice('choix:'.length) as Choix;
      const fichier = mission.exercice?.fichier ?? '';
      const resolu = resoudreFichier(d, fichier, [choix]);
      return executer(resolu, 'git commit -m "Fusion : résolution du conflit"').depot;
    }
    return executer(d, ligne).depot;
  }, depot);
}
