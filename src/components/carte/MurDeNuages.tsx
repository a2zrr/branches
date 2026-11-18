import { Icone } from '../ui/Icone';
import { BarreProgression } from '../ui/BarreProgression';
import { CarteMur } from './CarteMur';
import { FondNuages } from './FondNuages';
import type { MurDeNuages as Mur } from '../../game/carte';
import type { Mesures } from './geometrie';
import styles from './MurDeNuages.module.css';

export interface MurDeNuagesProps {
  mur: Mur;
  mesures: Mesures;
  /** Pendant l'ouverture d'un chapitre, le mur suivant est invisible puis apparaît en fondu. */
  apparition?: 'attente' | 'joue';
}

const TITRE_CACHE = "Qu'y a-t-il derrière les nuages ?";
const TITRE_BIENTOT = 'La suite se prépare';

/**
 * Le mur de nuages qui cache la suite de la carte (spec § 9 bis, « Le mur de nuages »).
 * Après le mur, rien : les chapitres cachés ne sont pas rendus.
 */
export function MurDeNuages({ mur, mesures, apparition }: MurDeNuagesProps) {
  const cache = mur.variante === 'cache';
  const classeApparition =
    apparition === 'attente' ? styles.attente : apparition === 'joue' ? styles.apparait : '';

  return (
    <section
      className={`${styles.mur} ${classeApparition}`}
      aria-labelledby="titre-mur"
      data-mur={mur.variante}
      style={{ marginTop: -mesures.murRemonte, height: mesures.murHauteur }}
    >
      <FondNuages variante="mur" expression="pensif" mesures={mesures} />
      <CarteMur
        idTitre="titre-mur"
        top={mesures.carteMurTop}
        icone={<Icone nom={cache ? 'cadenas' : 'horloge'} taille={26} couleur="var(--color-primary)" />}
        label={`Chapitre ${mur.numero}`}
        titre={cache ? TITRE_CACHE : TITRE_BIENTOT}
        texte={cache ? mur.texte : mur.sousTitre}
      >
        {cache && (
          <BarreProgression
            valeur={mur.avancement.faites}
            max={mur.avancement.total}
            etiquette={`Chapitre ${mur.precedent}`}
            libelleValeur={`${mur.avancement.faites} / ${mur.avancement.total} missions`}
          />
        )}
      </CarteMur>
    </section>
  );
}
