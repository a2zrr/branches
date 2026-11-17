import { BarreProgression } from './BarreProgression';
import styles from './EnTeteJeu.module.css';

export interface EnTeteJeuProps {
  chapitre: number;
  numero: number;
  total: number;
  faites: number;
  titre: string;
  objectif: string;
  indicesRestants: number;
  onIndice: () => void;
  onQuitter: () => void;
}

/** En-tête de la coque : quitter, progression du chapitre, indice, chapitre · mission, titre, objectif. */
export function EnTeteJeu({
  chapitre,
  numero,
  total,
  faites,
  titre,
  objectif,
  indicesRestants,
  onIndice,
  onQuitter,
}: EnTeteJeuProps) {
  return (
    <header className={styles.entete}>
      <div className={styles.haut}>
        <button type="button" className={styles.quitter} aria-label="Quitter la mission" onClick={onQuitter}>
          ✕
        </button>
        <div className={styles.progression}>
          <BarreProgression valeur={faites} max={total} etiquette="Progression dans le chapitre" />
          <span className={styles.compte}>
            Mission {numero} sur {total}
          </span>
        </div>
        <button
          type="button"
          className={styles.indice}
          aria-label={`Ouvrir un indice, ${indicesRestants} disponibles`}
          onClick={onIndice}
        >
          Indice <span className={styles.badge}>{indicesRestants}</span>
        </button>
      </div>
      <div className={styles.bas}>
        <span className={styles.surtitre}>
          Chapitre {chapitre} · Mission {numero}
        </span>
        <h1 className={styles.titre}>{titre}</h1>
        <p className={styles.objectif}>
          <strong>Objectif :</strong> {objectif}
        </p>
      </div>
    </header>
  );
}
