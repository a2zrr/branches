import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Bouton.module.css';

export type VarianteBouton = 'primaire' | 'secondaire' | 'danger' | 'indice' | 'succes';

export interface BoutonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variante?: VarianteBouton;
  taille?: 'm' | 'l';
  desactive?: boolean;
  icone?: ReactNode;
  children: ReactNode;
  /** Aperçu d'un état (design system uniquement) : force l'apparence « survol », « actif » ou « focus ». */
  etatApercu?: 'survol' | 'actif' | 'focus';
}

export function Bouton({
  variante = 'primaire',
  taille = 'm',
  desactive = false,
  icone,
  children,
  etatApercu,
  className,
  type = 'button',
  ...reste
}: BoutonProps) {
  const classes = [styles.bouton, styles[variante], styles[taille], className].filter(Boolean).join(' ');
  return (
    <button
      type={type}
      className={classes}
      disabled={desactive}
      aria-disabled={desactive || undefined}
      data-etat={etatApercu}
      {...reste}
    >
      {icone && <span className={styles.icone}>{icone}</span>}
      <span>{children}</span>
    </button>
  );
}
