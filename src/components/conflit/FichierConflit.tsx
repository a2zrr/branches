import type { LigneConflit, TypeLigneConflit } from './analyse';
import styles from './FichierConflit.module.css';

const ANNOTATIONS: Partial<Record<TypeLigneConflit, string>> = {
  debut: 'début de TA version',
  separation: 'séparation',
  fin: 'fin de LEUR version',
};

export interface FichierConflitProps {
  chemin: string;
  lignes: LigneConflit[];
  blocActif: number;
}

/** Fichier avec marqueurs : numéros de ligne, annotations, blocs teintés, bloc actif mis en valeur. */
export function FichierConflit({ chemin, lignes, blocActif }: FichierConflitProps) {
  return (
    <section className={styles.fichier} aria-label={`Fichier en conflit ${chemin}`}>
      <header className={styles.entete}>
        <code>{chemin}</code>
      </header>
      <ol className={styles.lignes}>
        {lignes.map((l, i) => (
          <li
            key={i}
            className={`${styles.ligne} ${styles[l.type]} ${l.bloc === blocActif ? styles.actif : ''}`}
            data-type={l.type}
            data-bloc={l.bloc ?? undefined}
          >
            <span className={styles.numero} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.texte}>{l.texte === '' ? ' ' : l.texte}</span>
            {ANNOTATIONS[l.type] !== undefined && (
              <span className={styles.annotation}>{ANNOTATIONS[l.type]}</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
