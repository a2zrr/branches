import type { CSSProperties } from 'react';
import { Icone } from './Icone';
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

/**
 * En-tête de chapitre (maquette Carte.png). Ouvert : couleur du chapitre, pastille « x / n · e ★ ».
 * Verrouillé : gris, cadenas, « Termine le chapitre n-1 pour débloquer ». Bientôt : pointillés, « Patience ».
 */
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
  const soustitre =
    etat === 'verrouille'
      ? `Termine le chapitre ${numero - 1} pour débloquer`
      : etat === 'ouvert'
        ? sousTitre
        : undefined;

  return (
    <header className={`${styles.entete} ${styles[etat]}`} style={style} data-etat={etat}>
      <div className={styles.textes}>
        <span className={styles.libelle}>{libelle}</span>
        <h3 className={styles.titre}>{titre}</h3>
        {soustitre !== undefined && <p className={styles.sousTitre}>{soustitre}</p>}
      </div>
      <span className={styles.pastille}>
        {etat === 'verrouille' && <Icone nom="cadenas" taille={14} trait={2.8} couleur="currentColor" />}
        {etat === 'bientot' ? 'Patience' : `${faites} / ${total} · ${etoiles} ★`}
      </span>
    </header>
  );
}
