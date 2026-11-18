import { Icone } from '../ui/Icone';
import { BarreProgression } from '../ui/BarreProgression';
import { CarteMur } from './CarteMur';
import { FondNuages } from './FondNuages';
import type { Mesures } from './geometrie';
import styles from './VoileDecouverte.module.css';

export interface VoileDecouverteProps {
  /** Numéro du chapitre qui vient d'être terminé. */
  precedent: number;
  /** Numéro du chapitre qui se découvre. */
  suivant: number;
  avancement: { faites: number; total: number };
  phase: 'attente' | 'joue';
  mesures: Mesures;
}

/**
 * Le voile : le mur du chapitre précédent, posé par-dessus le nouveau chapitre, qui s'écarte à
 * l'ouverture (spec § 9 bis, « Découverte »). Il ne prend aucune place : aucun décalage (CLS = 0).
 */
export function VoileDecouverte({ precedent, suivant, avancement, phase, mesures }: VoileDecouverteProps) {
  return (
    <div
      className={styles.voile}
      data-voile=""
      data-phase={phase}
      aria-hidden="true"
      style={{ top: `calc(100% - ${mesures.murRemonte}px)`, height: mesures.murHauteur }}
    >
      <FondNuages variante="voile" phase={phase} expression="fier" mesures={mesures} />
      <div className={styles.carteWrap}>
        <CarteMur
          idTitre="titre-voile"
          top={mesures.carteMurTop}
          icone={<Icone nom="coche" taille={26} couleur="var(--color-success)" />}
          label={`Chapitre ${precedent} terminé`}
          titre="Les nuages se dissipent…"
          texte={`Place au chapitre ${suivant}.`}
        >
          <BarreProgression
            valeur={avancement.faites}
            max={avancement.total}
            etiquette={`Chapitre ${precedent}`}
            libelleValeur={`${avancement.faites} / ${avancement.total} missions`}
          />
        </CarteMur>
      </div>
    </div>
  );
}
