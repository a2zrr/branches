import type { ReactNode } from 'react';
import { Bouton } from './Bouton';
import { Icone } from './Icone';
import { Mascotte } from '../mascotte/Mascotte';
import styles from './BandeauRetour.module.css';

export type TypeBandeau = 'neutre' | 'reussi' | 'rate';

export interface BandeauRetourProps {
  type: TypeBandeau;
  titre?: string;
  message?: ReactNode;
  commandes?: number;
  optimal?: number;
  /** Libellé du bouton principal. Par défaut : VÉRIFIER, CONTINUER ou COMPRIS selon le type. */
  action?: string;
  onAction: () => void;
  /** Bouton secondaire RÉINITIALISER (affiché en neutre). */
  onReinitialiser?: () => void;
}

const DEFAUTS: Record<TypeBandeau, { titre?: string; action: string }> = {
  neutre: { action: 'Vérifier' },
  reussi: { titre: 'Bien joué !', action: 'Continuer' },
  rate: { titre: 'Presque !', action: 'Compris' },
};

export function BandeauRetour({
  type,
  titre,
  message,
  commandes,
  optimal,
  action,
  onAction,
  onReinitialiser,
}: BandeauRetourProps) {
  const defauts = DEFAUTS[type];
  const titreAffiche = titre ?? defauts.titre;
  const libelle = action ?? defauts.action;

  if (type === 'neutre') {
    return (
      <section className={`${styles.bandeau} ${styles.neutre}`} aria-label="Barre de vérification">
        <span className={styles.compteur}>
          Commandes : {commandes ?? 0} · Optimal : {optimal ?? 0}
        </span>
        <div className={styles.actions}>
          {onReinitialiser && (
            <Bouton variante="secondaire" onClick={onReinitialiser}>
              Réinitialiser
            </Bouton>
          )}
          <Bouton variante="primaire" onClick={onAction}>
            {libelle}
          </Bouton>
        </div>
      </section>
    );
  }

  const reussi = type === 'reussi';
  return (
    <section
      className={`${styles.bandeau} ${reussi ? styles.reussi : styles.rate}`}
      role={reussi ? 'status' : 'alert'}
      aria-live={reussi ? 'polite' : 'assertive'}
    >
      <div className={styles.gauche}>
        {reussi ? (
          <span className={styles.pastille}>
            <span className={styles.iconeRebond}>
              <Icone nom="coche" taille={30} couleur="var(--color-success)" />
            </span>
          </span>
        ) : (
          <Mascotte expression="panique" taille={68} anime={false} />
        )}
        <div className={styles.textes}>
          <strong className={styles.titre}>{titreAffiche}</strong>
          {message && <span className={styles.message}>{message}</span>}
        </div>
      </div>
      <Bouton variante={reussi ? 'succes' : 'danger'} onClick={onAction}>
        {libelle}
      </Bouton>
    </section>
  );
}
