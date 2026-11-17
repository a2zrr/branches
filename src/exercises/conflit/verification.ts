// Vérification de l'exercice « conflit » : résolution de chaque bloc, puis commit de fusion (compte pour 1).
import { executer } from '../../engine/executer';
import { nombreBlocs, resoudreFichier } from '../../engine/commandes/fusion';
import type { Choix, Depot } from '../../engine/types';
import type { MissionJouableValidee } from '../../game/schemas';
import type { ReponseChoix, ResultatVerification } from '../registre';

export function preparerVerificationConflit(
  mission: MissionJouableValidee,
  depot: Depot,
  reponse: ReponseChoix,
): ResultatVerification {
  const exercice = mission.exercice;
  if (exercice === undefined) return { ok: false, message: 'Exercice mal configuré.' };
  const blocs = nombreBlocs(depot, exercice.fichier);
  const choisis = reponse.slice(0, blocs);
  const manquants = choisis.filter((c) => c === null).length + Math.max(0, blocs - reponse.length);
  if (manquants > 0) {
    return {
      ok: false,
      message: manquants === 1 ? 'Il reste un bloc sans choix.' : `Il reste ${manquants} blocs sans choix.`,
    };
  }
  const valides = choisis.filter((c): c is Choix => c !== null);
  if (!valides.every((c) => exercice.choixAcceptes.includes(c))) {
    return { ok: false, message: 'Ce choix n’est pas accepté pour ce fichier.' };
  }
  const resolu = resoudreFichier(depot, exercice.fichier, valides);
  const commit = executer(resolu, 'git commit -m "Fusion : résolution du conflit"');
  if (commit.erreur !== undefined) {
    return { ok: false, message: commit.erreur.explication };
  }
  const premier = valides[0];
  return {
    ok: true,
    depot: commit.depot,
    ...(premier !== undefined ? { reaction: exercice.reactions[premier] } : {}),
  };
}
