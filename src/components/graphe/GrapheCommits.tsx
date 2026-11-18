import { motion, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';
import { Etiquette } from './Etiquettes';
import { LienCommit } from './LienCommit';
import { NoeudCommit } from './NoeudCommit';
import { PAD, placerGraphe, ROW, type DonneesGraphe } from './layout';
import styles from './GrapheCommits.module.css';

export interface GrapheCommitsProps {
  donnees: DonneesGraphe;
  theme?: 'clair' | 'sombre';
  /** Hauteur de la zone défilante, en px. */
  hauteur?: number;
  onSelect?: (id: string) => void;
  /** Sans cadre : le conteneur parent porte la bordure. */
  sansCadre?: boolean;
}

/**
 * Graphe des commits : une colonne par branche, une rangée par commit (le plus récent en haut).
 * Le graphe SVG est décoratif (aria-hidden) ; la liste des rangées est lisible au lecteur d'écran.
 */
export function GrapheCommits({
  donnees,
  theme = 'clair',
  hauteur = 560,
  onSelect,
  sansCadre = false,
}: GrapheCommitsProps) {
  const graphe = useMemo(() => placerGraphe(donnees), [donnees]);
  const reduit = useReducedMotion() === true;
  const nouveau = donnees.vue?.nouveau;
  const idsSelection = donnees.vue?.selection;
  const headNoeud = graphe.noeuds.find((n) => n.etat === 'head');
  const headX = headNoeud?.x ?? PAD;
  const headY = headNoeud?.y ?? ROW / 2;

  return (
    <div
      className={sansCadre ? styles.sansCadre : styles.conteneur}
      data-theme-graphe={theme}
      style={{ maxHeight: hauteur }}
    >
      <div className={styles.corps} style={{ width: 'max-content' }}>
        <svg
          className={styles.svg}
          width={graphe.largeur}
          height={Math.max(graphe.hauteur, ROW)}
          viewBox={`0 0 ${graphe.largeur} ${Math.max(graphe.hauteur, ROW)}`}
          aria-hidden="true"
          focusable="false"
        >
          {graphe.liens.map((lien) => (
            <LienCommit key={`${lien.de}-${lien.vers}`} lien={lien} trace={lien.de === nouveau} />
          ))}
          {graphe.noeuds.map((noeud) => (
            <NoeudCommit key={noeud.id} noeud={noeud} nouveau={noeud.id === nouveau} />
          ))}
          {headNoeud !== undefined && (
            <motion.circle
              cx={0}
              cy={0}
              r={17.5}
              fill="none"
              strokeWidth={3}
              style={{ stroke: 'var(--color-text)' }}
              initial={false}
              animate={{ x: headX, y: headY }}
              transition={reduit ? { duration: 0 } : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              data-head-anneau=""
            />
          )}
        </svg>
        <ol className={styles.lignes} style={{ width: 'max-content' }}>
          {graphe.lignes.map((ligne) => {
            const selectionnee = ligne.id === idsSelection;
            const contenu = (
              <>
                <span className={styles.hash}>{ligne.id}</span>
                <span className={styles.etiquettes}>
                  {ligne.etiquettes.map((e, i) => (
                    <Etiquette key={`${e.type}-${i}`} etiquette={e} />
                  ))}
                </span>
                <span className={`${styles.message} ${ligne.annule ? styles.annule : ''}`}>
                  {ligne.message}
                </span>
              </>
            );
            return (
              <li
                key={ligne.id}
                className={`${styles.ligne} ${ligne.etat === 'nouveau' ? styles.nouveau : ''} ${selectionnee ? styles.selection : ''}`}
                style={{ height: ROW }}
                data-ligne={ligne.id}
              >
                {onSelect ? (
                  <button
                    type="button"
                    className={styles.bouton}
                    aria-pressed={selectionnee}
                    onClick={() => {
                      onSelect(ligne.id);
                    }}
                  >
                    {contenu}
                  </button>
                ) : (
                  <span className={styles.bouton}>{contenu}</span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
