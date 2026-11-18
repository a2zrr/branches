import { useEffect, useRef, type ReactNode } from 'react';
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
  /** Sans boîte : barre plate du bas de la coque (maquette JeuTerminal.png). */
  plat?: boolean;
  /** Contenu de gauche de la barre neutre (fourni par l'exercice). */
  resume?: ReactNode;
  /** Taille du bouton principal en barre neutre. */
  tailleAction?: 'm' | 'l';
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
  plat = false,
  resume,
  tailleAction = 'm',
}: BandeauRetourProps) {
  const defauts = DEFAUTS[type];
  const racine = useRef<HTMLElement>(null);
  useEffect(() => {
    // Le bouton du bandeau reçoit le focus à son apparition (retour clavier).
    if (type !== 'neutre') racine.current?.querySelector('button')?.focus();
  }, [type]);
  const titreAffiche = titre ?? defauts.titre;
  const libelle = action ?? defauts.action;

  if (type === 'neutre') {
    return (
      <section
        className={`${styles.bandeau} ${styles.neutre} ${plat ? styles.plat : ''}`}
        aria-label="Barre de vérification"
      >
        <span className={styles.compteur}>
          {resume ?? `Commandes : ${commandes ?? 0} · Optimal : ${optimal ?? 0}`}
        </span>
        <div className={styles.actions}>
          {onReinitialiser && (
            <Bouton variante="secondaire" onClick={onReinitialiser}>
              Réinitialiser
            </Bouton>
          )}
          <Bouton variante="primaire" taille={tailleAction} onClick={onAction}>
            {libelle}
          </Bouton>
        </div>
      </section>
    );
  }

  const reussi = type === 'reussi';
  return (
    <section
      className={`${styles.bandeau} ${reussi ? styles.reussi : styles.rate} ${plat ? styles.alertePlate : ''}`}
      ref={racine}
      role={reussi ? 'status' : 'alert'}
      aria-live={reussi ? 'polite' : 'assertive'}
    >
      <div className={styles.gauche}>
        {reussi ? (
          <span className={styles.pastille}>
            <Icone nom="coche" taille={30} couleur="var(--color-success)" />
          </span>
        ) : (
          <Mascotte expression="panique" taille={68} anime={false} />
        )}
        <div className={styles.textes}>
          <strong className={styles.titre}>{titreAffiche}</strong>
          {(message !== '' || commandes !== undefined) && (
            <span className={styles.message}>
              {message}
              {commandes !== undefined && `${message !== '' ? ' · ' : ''}Commandes : ${commandes}`}
            </span>
          )}
        </div>
      </div>
      <Bouton variante={reussi ? 'succes' : 'danger'} taille={plat ? 'l' : 'm'} onClick={onAction}>
        {libelle}
      </Bouton>
    </section>
  );
}
