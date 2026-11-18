import { useEffect, useRef } from 'react';
import { PuceNotion } from '../ui/PuceNotion';
import type { EtatNotion } from '../../game/regles';
import styles from './FeuilleTonGit.module.css';

export interface FeuilleTonGitProps {
  notions: { nom: string; etat: EtatNotion }[];
  maitrisees: number;
  total: number;
  onFermer: () => void;
}

/**
 * « Ton Git » sur téléphone : panneau qui monte du bas, Échap et clic sur le voile le ferment.
 * Le focus entre dans la feuille et revient au bouton qui l'a ouverte.
 */
export function FeuilleTonGit({ notions, maitrisees, total, onFermer }: FeuilleTonGitProps) {
  const feuille = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const declencheur = document.activeElement as HTMLElement | null;
    feuille.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const toucheEchap = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onFermer();
    };
    document.addEventListener('keydown', toucheEchap);
    return () => {
      document.removeEventListener('keydown', toucheEchap);
      declencheur?.focus();
    };
  }, [onFermer]);

  return (
    <>
      <button type="button" className={styles.voile} onClick={onFermer} aria-label="Fermer Ton Git" />
      <div
        ref={feuille}
        className={styles.feuille}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feuille-ton-git"
      >
        <div className={styles.entete}>
          <h2 id="feuille-ton-git" className={styles.titre}>
            Ton Git
          </h2>
          <button type="button" className={styles.fermer} onClick={onFermer}>
            Fermer
          </button>
        </div>
        <p className={styles.compte}>
          {maitrisees} notion{maitrisees > 1 ? 's' : ''} maîtrisée{maitrisees > 1 ? 's' : ''} sur {total}
        </p>
        <ul className={styles.puces}>
          {notions.map((n) => (
            <li key={n.nom}>
              <PuceNotion nom={n.nom} etat={n.etat} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
