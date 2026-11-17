import { CalquesHedi, SocleHedi } from './formes';
import { LIBELLES_HEDI } from './libelles';
import type { ExpressionHedi } from './types';
import styles from './Mascotte.module.css';

export interface MascotteProps {
  expression: ExpressionHedi;
  taille: number;
  anime?: boolean;
}

export function Mascotte({ expression, taille, anime = true }: MascotteProps) {
  return (
    <div
      className={anime ? styles.respire : undefined}
      style={{ width: taille, height: taille, display: 'inline-block', lineHeight: 0, flex: 'none' }}
      data-expression={expression}
    >
      {/* La clé force le rejeu de l'animation de changement d'expression. */}
      <div
        key={expression}
        className={anime ? styles.changement : undefined}
        style={{ width: '100%', height: '100%' }}
      >
        <div
          className={anime && expression === 'panique' ? styles.secousse : undefined}
          style={{ width: '100%', height: '100%' }}
        >
          <svg viewBox="0 0 200 200" role="img" aria-label={LIBELLES_HEDI[expression]} className={styles.svg}>
            <SocleHedi />
            <CalquesHedi expression={expression} />
          </svg>
        </div>
      </div>
    </div>
  );
}
