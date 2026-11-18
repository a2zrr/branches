import { Icone } from '../ui/Icone';
import { BarreProgression } from '../ui/BarreProgression';
import { Mascotte } from '../mascotte/Mascotte';
import type { MurDeNuages as Mur } from '../../game/carte';
import type { Mesures } from './geometrie';
import banqueSvg from '../../assets/nuages/banque.svg?raw';
import petitNuageSvg from '../../assets/nuages/petit-nuage.svg?raw';
import styles from './MurDeNuages.module.css';

export interface MurDeNuagesProps {
  mur: Mur;
  mesures: Mesures;
}

const TITRE_CACHE = "Qu'y a-t-il derrière les nuages ?";
const TITRE_BIENTOT = 'La suite se prépare';

/**
 * Le mur de nuages qui cache la suite de la carte (spec § 9 bis, « Le mur de nuages »).
 * Les morceaux de la banque (SVG) lisent les tokens --nuage-* : ils sont insérés en ligne.
 * Après le mur, rien : les chapitres cachés ne sont pas rendus.
 */
export function MurDeNuages({ mur, mesures }: MurDeNuagesProps) {
  const cache = mur.variante === 'cache';
  const numero = mur.numero;

  return (
    <section
      className={`${styles.mur} ${mesures.pc ? styles.pc : ''}`}
      aria-labelledby="titre-mur"
      data-mur={mur.variante}
      style={{ marginTop: -mesures.murRemonte, height: mesures.murHauteur }}
    >
      <div className={styles.hedi} aria-hidden="true">
        <Mascotte expression="pensif" taille={mesures.pc ? 112 : 84} anime={false} />
      </div>
      <div
        className={`${styles.morceau} ${styles.gauche}`}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: banqueSvg }}
      />
      <div
        className={`${styles.morceau} ${styles.droite}`}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: banqueSvg }}
      />
      <div
        className={`${styles.morceau} ${styles.milieu}`}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: banqueSvg }}
      />
      <div className={`${styles.petit} ${styles.petit1}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: petitNuageSvg }} />
      <div className={`${styles.petit} ${styles.petit2}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: petitNuageSvg }} />
      <div className={styles.fondu} aria-hidden="true" />

      <div className={styles.carte} style={{ top: mesures.carteMurTop }}>
        <div className={styles.entete}>
          <span className={styles.icone} aria-hidden="true">
            <Icone nom={cache ? 'cadenas' : 'horloge'} taille={26} couleur="var(--color-primary)" />
          </span>
          <span className={styles.label}>Chapitre {numero}</span>
        </div>
        <h2 id="titre-mur" className={styles.titre}>
          {cache ? TITRE_CACHE : TITRE_BIENTOT}
        </h2>
        <p className={styles.texte}>{cache ? mur.texte : mur.sousTitre}</p>
        {cache && (
          <BarreProgression
            valeur={mur.avancement.faites}
            max={mur.avancement.total}
            etiquette={`Chapitre ${mur.precedent}`}
            libelleValeur={`${mur.avancement.faites} / ${mur.avancement.total} missions`}
          />
        )}
      </div>
    </section>
  );
}
