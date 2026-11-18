// Vue d'ensemble de la partie, calculée à partir de la progression et des fiches.
import { useMemo } from 'react';
import { useProgression } from './store';
import { MISSIONS, BADGES } from './missions';
import {
  badgesDebloques,
  etatsMissions,
  missionEnCours,
  notionsTonGit,
  xpTotal,
  type EtatMission,
} from './regles';

export function useEtatJeu() {
  const progression = useProgression((s) => s.progression);
  const debug = useProgression((s) => s.debug);
  const chapitresDecouverts = useProgression((s) => s.chapitresDecouverts);
  return useMemo(() => {
    const etats: Record<string, EtatMission> = etatsMissions(MISSIONS, progression, debug);
    const enCours = missionEnCours(MISSIONS, progression);
    const notions = notionsTonGit(MISSIONS, progression, enCours);
    const debloquees = badgesDebloques(BADGES, notions);
    return {
      progression,
      etats,
      enCours,
      notions,
      debloquees,
      notionsMaitrisees: notions.filter((n) => n.etat === 'maitrisee').length,
      notionsTotal: notions.length,
      xp: xpTotal(progression),
      etoiles: Object.values(progression).reduce((s, r) => s + r.etoiles, 0),
      premiereVisite: Object.keys(progression).length === 0,
      chapitresDecouverts,
    };
  }, [progression, debug, chapitresDecouverts]);
}
