import { EnTeteChapitre } from '../ui/EnTeteChapitre';
import { CheminMissions } from './CheminMissions';
import { NoeudMission, type EtatNoeud } from './NoeudMission';
import { centre, hautDuRang, MESURES_PC, type Mesures } from './geometrie';
import type { ChapitreValide, MissionValidee } from '../../game/schemas';
import { estJouable, type EtatMission, type Progression } from '../../game/regles';
import styles from './ChapitreCarte.module.css';

export interface ChapitreCarteProps {
  chapitre: ChapitreValide;
  /** Missions de ce chapitre, dans l'ordre du jeu. */
  missions: MissionValidee[];
  etats: Record<string, EtatMission>;
  progression: Progression;
  onOpen: (id: string) => void;
  mesures?: Mesures;
}

/** État affiché d'une mission : une mission brouillon n'est jamais jouable. */
function etatNoeud(m: MissionValidee, etats: Record<string, EtatMission>): EtatNoeud {
  if (!estJouable(m)) return 'brouillon';
  return etats[m.id] ?? 'verrouillee';
}

/**
 * Un chapitre de la carte : son en-tête (inchangé), puis la zone du chemin en positions absolues.
 * Pas de fond ni de cadre : la page reste blanche.
 */
export function ChapitreCarte({
  chapitre,
  missions,
  etats,
  progression,
  onOpen,
  mesures = MESURES_PC,
}: ChapitreCarteProps) {
  const jouables = missions.filter(estJouable);
  const faites = jouables.filter((m) => progression[m.id]?.reussie === true).length;
  const etoiles = jouables.reduce((somme, m) => somme + (progression[m.id]?.etoiles ?? 0), 0);
  const noeuds = missions.map((m) => ({ mission: m, etat: etatNoeud(m, etats) }));
  const indexCourant = Math.max(
    noeuds.findIndex((n) => n.etat === 'en-cours' || n.etat === 'disponible'),
    0,
  );
  const hauteur = mesures.haut + missions.length * mesures.rang + mesures.bas;
  const teinte = chapitre.vignette?.teinte ?? 'bleu';

  return (
    <section className={styles.chapitre} aria-label={`Chapitre ${chapitre.numero}`}>
      <EnTeteChapitre
        numero={chapitre.numero}
        titre={chapitre.titre}
        sousTitre={chapitre.sousTitre}
        etat="ouvert"
        faites={faites}
        total={jouables.length}
        etoiles={etoiles}
        {...(chapitre.couleur !== undefined ? { couleur: chapitre.couleur } : {})}
        {...(chapitre.couleurArete !== undefined ? { couleurArete: chapitre.couleurArete } : {})}
      />
      <div className={styles.zone} style={{ height: hauteur }}>
        {missions.length > 0 && (
          <CheminMissions
            mesures={mesures}
            nombre={missions.length}
            indexCourant={indexCourant}
            couleurFaite={`var(--chemin-${teinte})`}
            hauteur={hauteur}
          />
        )}
        {noeuds.map(({ mission, etat }, i) => (
          <NoeudMission
            key={mission.id}
            mesures={mesures}
            numero={mission.ordre}
            titre={mission.titre}
            etat={etat}
            etoiles={progression[mission.id]?.etoiles ?? 0}
            dx={centre(mesures, i)[0]}
            top={hautDuRang(mesures, i)}
            onCommencer={() => {
              onOpen(mission.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}
