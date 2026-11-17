import styles from './BarreProgression.module.css';

export interface BarreProgressionProps {
  valeur: number;
  max: number;
  etiquette: string;
}

export function BarreProgression({ valeur, max, etiquette }: BarreProgressionProps) {
  const borne = Math.min(Math.max(valeur, 0), max);
  const pourcentage = max > 0 ? Math.round((borne / max) * 100) : 0;
  const complete = pourcentage === 100;
  return (
    <div className={styles.conteneur}>
      <div className={styles.entete}>
        <span>{etiquette}</span>
        <span>{pourcentage} %</span>
      </div>
      <div
        role="progressbar"
        aria-label={etiquette}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={borne}
        aria-valuetext={`${pourcentage} %`}
        className={styles.piste}
      >
        <div
          className={`${styles.remplissage} ${complete ? styles.complete : ''}`}
          style={{ width: `${pourcentage}%` }}
        >
          <span className={styles.reflet} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
