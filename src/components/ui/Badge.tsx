import type { Badge as DonneesBadge } from '../../game/types';
import styles from './Badge.module.css';

export interface BadgeProps {
  badge: DonneesBadge;
  debloque: boolean;
}

export function Badge({ badge, debloque }: BadgeProps) {
  return (
    <div
      className={`${styles.badge} ${debloque ? styles.debloque : styles.verrouille}`}
      style={{
        ['--badge-couleur' as string]: badge.couleur,
        ['--badge-arete' as string]: badge.couleurArete,
      }}
      role="group"
      aria-label={`${badge.nom} : ${debloque ? 'débloqué' : 'verrouillé'}`}
    >
      <span className={styles.medaille} aria-hidden="true">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={badge.icone} />
        </svg>
      </span>
      <span className={styles.nom}>{badge.nom}</span>
    </div>
  );
}
