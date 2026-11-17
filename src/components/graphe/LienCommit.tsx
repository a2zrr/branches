import { motion, useReducedMotion } from 'motion/react';
import type { LienG } from './layout';

export interface LienCommitProps {
  lien: LienG;
  /** Lien tracé à l'apparition (fusion, nouveau commit). */
  trace: boolean;
  delai?: number;
}

/** Lien entre un commit et son parent : trait de 4 px, bouts ronds, tracé animé quand il est nouveau. */
export function LienCommit({ lien, trace, delai = 0 }: LienCommitProps) {
  const reduit = useReducedMotion() === true;
  const animer = trace && !reduit;
  return (
    <motion.path
      d={lien.chemin}
      fill="none"
      strokeWidth={4}
      strokeLinecap="round"
      strokeDasharray={lien.tirets === 'none' ? undefined : lien.tirets}
      style={{ stroke: `var(--branch-${lien.couleur})` }}
      initial={animer ? { pathLength: 0 } : false}
      animate={{ pathLength: 1 }}
      transition={{ duration: animer ? 0.25 : 0, delay: delai }}
      data-lien={`${lien.de}-${lien.vers}`}
    />
  );
}
