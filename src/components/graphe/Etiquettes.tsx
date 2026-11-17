import { cheminForme, styleBranche, type EtiquetteG } from './layout';
import { CHEMIN_TAG } from './icones';
import styles from './Etiquettes.module.css';

/** Étiquette HEAD : pilule foncée « HEAD → » collée à sa branche, ou « HEAD » seule si détaché. */
export function EtiquetteHead({ nom }: { nom: string }) {
  return <span className={styles.head}>{nom}</span>;
}

/** Étiquette de branche : pilule de la couleur de la branche, avec sa forme (jamais la couleur seule). */
export function EtiquetteBranche({ nom, index }: { nom: string; index: number }) {
  const style = styleBranche(index);
  return (
    <span
      className={styles.branche}
      style={{
        background: `var(--branch-${style.couleur})`,
        borderColor: `var(--branch-${style.couleur}-edge)`,
      }}
    >
      <svg width="16" height="16" viewBox="-10 -10 20 20" aria-hidden="true" focusable="false">
        <path d={cheminForme(style.forme, 6)} style={{ fill: 'var(--branch-ink)' }} />
      </svg>
      {nom}
    </span>
  );
}

/** Étiquette de tag : contour jaune, icône étiquette. */
export function EtiquetteTag({ nom }: { nom: string }) {
  return (
    <span className={styles.tag}>
      <svg width="16" height="16" viewBox="-12 -12 24 24" aria-hidden="true" focusable="false">
        <path d={CHEMIN_TAG} fill="none" strokeWidth={2} style={{ stroke: 'var(--color-hint-text)' }} />
      </svg>
      {nom}
    </span>
  );
}

/** Puce : nouveau, annulé par, bon, mauvais, à tester. */
export function Puce({ libelle, ton }: { libelle: string; ton: 'info' | 'ok' | 'ko' | 'indice' }) {
  return <span className={`${styles.puce} ${styles[ton]}`}>{libelle}</span>;
}

export function Etiquette({ etiquette }: { etiquette: EtiquetteG }) {
  if (etiquette.type === 'head') return <EtiquetteHead nom={etiquette.nom} />;
  if (etiquette.type === 'branche') return <EtiquetteBranche nom={etiquette.nom} index={etiquette.index} />;
  if (etiquette.type === 'tag') return <EtiquetteTag nom={etiquette.nom} />;
  return <Puce libelle={etiquette.libelle} ton={etiquette.ton} />;
}
