import { Mascotte } from '../mascotte/Mascotte';
import type { ExpressionHedi } from '../mascotte/types';
import styles from './BulleMascotte.module.css';

export type TonBulle = 'histoire' | 'indice' | 'reaction';

export interface BulleMascotteProps {
  expression: ExpressionHedi;
  ton: TonBulle;
  titre?: string;
  texte: string;
  taille?: number;
}

const TITRES_PAR_DEFAUT: Record<TonBulle, string> = {
  histoire: 'Hédi',
  indice: 'Indice',
  reaction: 'Réaction',
};

/** Hédi et sa bulle. La queue en losange pointe vers Hédi. */
export function BulleMascotte({ expression, ton, titre, texte, taille = 76 }: BulleMascotteProps) {
  return (
    <div className={styles.rangee}>
      <Mascotte expression={expression} taille={taille} />
      <div className={`${styles.bulle} ${styles[ton]}`}>
        <span className={styles.queue} aria-hidden="true" />
        {(titre ?? TITRES_PAR_DEFAUT[ton]) !== '' && (
          <span className={styles.titre}>{titre ?? TITRES_PAR_DEFAUT[ton]}</span>
        )}
        <p className={styles.texte}>{texte}</p>
      </div>
    </div>
  );
}
