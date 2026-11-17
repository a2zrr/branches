import type { Badge as DonneesBadge } from '../../game/types';
import { Icone } from './Icone';
import styles from './Badge.module.css';

export interface BadgeProps {
  badge: DonneesBadge;
  debloque: boolean;
}

/** Badge débloqué : médaille de sa couleur et son icône. Verrouillé : cercle gris avec un cadenas. */
export function Badge({ badge, debloque }: BadgeProps) {
  return (
    <div
      className={`${styles.badge} ${debloque ? styles.debloque : styles.verrouille}`}
      role="group"
      aria-label={`${badge.nom} : ${debloque ? 'débloqué' : 'verrouillé'}`}
      style={{
        ['--badge-couleur' as string]: badge.couleur,
        ['--badge-arete' as string]: badge.couleurArete,
      }}
    >
      <span className={styles.medaille} aria-hidden="true">
        {debloque ? (
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
        ) : (
          <Icone nom="cadenas" taille={26} trait={2.6} couleur="var(--color-disabled-text)" />
        )}
      </span>
      <span className={styles.nom}>{badge.nom}</span>
    </div>
  );
}
