import { motion, useReducedMotion } from 'motion/react';
import { cheminForme, type NoeudG } from './layout';
import { CHEMIN_CHECK, CHEMIN_CROIX, CHEMIN_FUSION, CHEMIN_QUESTION, CHEMIN_REVERT } from './icones';

export interface NoeudCommitProps {
  noeud: NoeudG;
  /** Animation d'apparition (commit tout juste créé). */
  nouveau: boolean;
}

/** Nœud d'un commit : forme de sa branche, halo, anneau HEAD / sélection, icône fusion ou revert, badge bisect. */
export function NoeudCommit({ noeud, nouveau }: NoeudCommitProps) {
  const reduit = useReducedMotion() === true;
  const d = cheminForme(noeud.forme, noeud.R);
  const couleur = `var(--branch-${noeud.couleur})`;
  const bord = `var(--branch-${noeud.couleur}-edge)`;
  const remplissage = noeud.evide ? 'var(--color-surface)' : couleur;
  const trait = noeud.evide ? couleur : bord;
  const animer = !reduit && nouveau;

  return (
    <motion.g
      initial={animer ? { scale: 0 } : false}
      animate={{ scale: 1 }}
      transition={reduit ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 14 }}
      style={{ originX: `${noeud.x}px`, originY: `${noeud.y}px` }}
      data-noeud={noeud.id}
      data-etat={noeud.etat}
    >
      {noeud.etat === 'nouveau' && (
        <motion.circle
          cx={noeud.x}
          cy={noeud.y}
          r={noeud.R}
          style={{ fill: 'var(--graph-halo)' }}
          initial={reduit ? false : { scale: 0.4, opacity: 0.5 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.9 }}
        />
      )}
      {noeud.etat === 'selection' && (
        <circle
          cx={noeud.x}
          cy={noeud.y}
          r={17.5}
          fill="none"
          style={{ stroke: 'var(--color-focus)' }}
          strokeWidth={3}
        />
      )}
      <g transform={`translate(${noeud.x} ${noeud.y})`}>
        <path
          d={d}
          strokeWidth={noeud.evide ? 4 : 3}
          strokeDasharray={noeud.annule ? '4 4' : undefined}
          style={{ fill: remplissage, stroke: trait }}
          strokeLinejoin="round"
        />
        {noeud.type !== 'normal' && (
          <path
            d={noeud.type === 'fusion' ? CHEMIN_FUSION : CHEMIN_REVERT}
            fill="none"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: noeud.evide ? couleur : 'var(--color-surface)' }}
          />
        )}
      </g>
      {noeud.bisect !== undefined && (
        <motion.g
          initial={reduit ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={reduit ? { duration: 0 } : { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ originX: `${noeud.x + 6}px`, originY: `${noeud.y - 24}px` }}
        >
          <circle
            cx={noeud.x + 6}
            cy={noeud.y - 24}
            r={9}
            style={{
              fill:
                noeud.bisect === 'bon'
                  ? 'var(--color-success)'
                  : noeud.bisect === 'mauvais'
                    ? 'var(--color-danger)'
                    : 'var(--color-hint)',
            }}
          />
          <path
            d={
              noeud.bisect === 'bon'
                ? CHEMIN_CHECK
                : noeud.bisect === 'mauvais'
                  ? CHEMIN_CROIX
                  : CHEMIN_QUESTION
            }
            transform={`translate(${noeud.x + 6} ${noeud.y - 24})`}
            fill="none"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ stroke: noeud.bisect === 'test' ? 'var(--color-on-hint)' : 'var(--color-on-primary)' }}
          />
        </motion.g>
      )}
    </motion.g>
  );
}
