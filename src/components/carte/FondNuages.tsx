import { Mascotte } from '../mascotte/Mascotte';
import type { Mesures } from './geometrie';
import type { ExpressionHedi } from '../mascotte/types';
import banqueSvg from '../../assets/nuages/banque.svg?raw';
import petitNuageSvg from '../../assets/nuages/petit-nuage.svg?raw';
import styles from './FondNuages.module.css';

export interface FondNuagesProps {
  /** « mur » : nuages fixes ; « voile » : nuages qui s'écartent à l'ouverture d'un chapitre. */
  variante: 'mur' | 'voile';
  /** Animation de l'ouverture : « attente » (figé) ou « joue » (les nuages s'écartent). */
  phase?: 'attente' | 'joue';
  expression: ExpressionHedi;
  mesures: Mesures;
}

/**
 * Le fond des nuages : Hédi qui dépasse, la banque en trois morceaux, deux petits nuages et le fondu.
 * Les morceaux lisent les tokens --nuage-* : le SVG est inséré en ligne (spec § 9 bis).
 */
export function FondNuages({ variante, phase = 'attente', expression, mesures }: FondNuagesProps) {
  const racine = `${styles.fond} ${mesures.pc ? styles.pc : ''}`;
  return (
    <div className={racine} data-variante={variante} data-phase={phase} aria-hidden="true">
      <div className={styles.hedi}>
        <Mascotte expression={expression} taille={mesures.pc ? 112 : 84} anime={false} />
      </div>
      <div className={`${styles.morceau} ${styles.gauche}`} dangerouslySetInnerHTML={{ __html: banqueSvg }} />
      <div className={`${styles.morceau} ${styles.droite}`} dangerouslySetInnerHTML={{ __html: banqueSvg }} />
      <div className={`${styles.morceau} ${styles.milieu}`} dangerouslySetInnerHTML={{ __html: banqueSvg }} />
      <div className={`${styles.petit} ${styles.petit1}`} dangerouslySetInnerHTML={{ __html: petitNuageSvg }} />
      <div className={`${styles.petit} ${styles.petit2}`} dangerouslySetInnerHTML={{ __html: petitNuageSvg }} />
      <div className={styles.fondu} />
    </div>
  );
}
