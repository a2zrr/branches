import { Icone } from './Icone';
import styles from './EnTeteJeu.module.css';

export interface EnTeteJeuProps {
  chapitre: number;
  numero: number;
  total: number;
  faites: number;
  titre: string;
  objectif: string;
  indicesRestants: number;
  /** Le panneau d'indice est ouvert (bouton bascule). */
  ouvert: boolean;
  onIndice: () => void;
  onQuitter: () => void;
}

/**
 * En-tête de la coque (maquette JeuTerminal.png) : ligne 1 = quitter, progression du chapitre,
 * INDICE ; ligne 2 = chapitre · mission, titre, et l'objectif dans une pilule.
 */
export function EnTeteJeu({
  chapitre,
  numero,
  total,
  faites,
  titre,
  objectif,
  indicesRestants,
  ouvert,
  onIndice,
  onQuitter,
}: EnTeteJeuProps) {
  const pourcentage = total > 0 ? Math.round((faites / total) * 100) : 0;
  return (
    <header className={styles.entete}>
      <div className={styles.ligne1}>
        <button type="button" className={styles.quitter} aria-label="Quitter la mission" onClick={onQuitter}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M5 5l14 14M19 5L5 19"
              fill="none"
              strokeWidth={2.6}
              strokeLinecap="round"
              style={{ stroke: 'var(--color-text)' }}
            />
          </svg>
        </button>
        <div
          className={styles.piste}
          role="progressbar"
          aria-label="Progression dans le chapitre"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={faites}
          aria-valuetext={`${pourcentage} %`}
        >
          <div className={styles.remplissage} style={{ width: `${pourcentage}%` }} />
        </div>
        <span className={styles.compte}>
          Mission {numero} sur {total}
        </span>
        <button
          type="button"
          className={styles.indice}
          aria-expanded={ouvert}
          aria-controls="panneau-indice"
          data-indice-bouton=""
          onClick={onIndice}
        >
          <Icone nom="ampoule" taille={22} trait={2.2} couleur="var(--color-on-hint)" />
          Indice
          <span className={styles.badge}>{indicesRestants}</span>
        </button>
      </div>
      <div className={styles.ligne2}>
        <div className={styles.titres}>
          <span className={styles.surtitre}>
            Chapitre {chapitre} · Mission {numero}
          </span>
          <h1 className={styles.titre}>{titre}</h1>
        </div>
        <p className={styles.objectif}>
          <Icone nom="cible" taille={22} trait={2.2} couleur="var(--color-primary)" />
          <span>
            <strong>Objectif :</strong> {objectif}
          </span>
        </p>
      </div>
    </header>
  );
}
