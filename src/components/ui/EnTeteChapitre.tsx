import type { CSSProperties } from 'react';
import styles from './EnTeteChapitre.module.css';

export interface EnTeteChapitreProps {
  numero: number;
  titre: string;
  sousTitre?: string;
  etat: 'ouvert' | 'verrouille' | 'bientot';
  faites: number;
  total: number;
  etoiles: number;
  /** Couleurs du chapitre (chapitres.json), passées en variables CSS. */
  couleur?: string;
  couleurArete?: string;
}

export function EnTeteChapitre({
  numero,
  titre,
  sousTitre,
  etat,
  faites,
  total,
  etoiles,
  couleur,
  couleurArete,
}: EnTeteChapitreProps) {
  const style = {
    ...(couleur ? { '--chapitre-couleur': couleur } : {}),
    ...(couleurArete ? { '--chapitre-arete': couleurArete } : {}),
  } as CSSProperties;

  const libelle = etat === 'verrouille' ? `Chapitre ${numero} · verrouillé` : `Chapitre ${numero}`;
  const droite =
    etat === 'bientot'
      ? 'Patience'
      : etat === 'verrouille'
        ? `${faites} / ${total}`
        : `${faites} / ${total} · ${etoiles} ★`;

  return (
    <header className={`${styles.entete} ${styles[etat]}`} style={style} data-etat={etat}>
      <div className={styles.textes}>
        <span className={styles.libelle}>{libelle}</span>
        <h3 className={styles.titre}>{titre}</h3>
        {sousTitre && <p className={styles.sousTitre}>{sousTitre}</p>}
      </div>
      <span className={styles.pastille}>{droite}</span>
    </header>
  );
}
