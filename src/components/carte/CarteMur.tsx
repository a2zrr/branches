import type { ReactNode } from 'react';
import styles from './CarteMur.module.css';

export interface CarteMurProps {
  /** Position verticale de la carte, dans le mur (px). */
  top: number;
  icone: ReactNode;
  label: string;
  titre: string;
  texte: string;
  /** Barre de progression, facultative. */
  children?: ReactNode;
  /** Identifiant du titre, pour aria-labelledby. */
  idTitre: string;
}

/** La carte centrale des nuages : carte standard de l'interface (spec § 9 bis). */
export function CarteMur({ top, icone, label, titre, texte, children, idTitre }: CarteMurProps) {
  return (
    <div className={styles.carte} style={{ top }}>
      <div className={styles.entete}>
        <span className={styles.icone} aria-hidden="true">
          {icone}
        </span>
        <span className={styles.label}>{label}</span>
      </div>
      <h2 id={idTitre} className={styles.titre}>
        {titre}
      </h2>
      <p className={styles.texte}>{texte}</p>
      {children}
    </div>
  );
}
