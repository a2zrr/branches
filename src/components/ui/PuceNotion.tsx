import { Icone, type NomIcone } from './Icone';
import styles from './PuceNotion.module.css';

export type EtatNotion = 'maitrisee' | 'en-cours' | 'a-decouvrir';

export interface PuceNotionProps {
  nom: string;
  etat: EtatNotion;
}

const ICONE: Record<EtatNotion, NomIcone> = {
  maitrisee: 'coche',
  'en-cours': 'terminal',
  'a-decouvrir': 'cadenas',
};

const LIBELLE: Record<EtatNotion, string> = {
  maitrisee: 'maîtrisée',
  'en-cours': 'en cours',
  'a-decouvrir': 'à découvrir',
};

export function PuceNotion({ nom, etat }: PuceNotionProps) {
  return (
    <span className={`${styles.puce} ${styles[etat.replace('-', '')] ?? ''}`}>
      <Icone nom={ICONE[etat]} taille={14} trait={3.2} />
      <span className={styles.nom}>{nom}</span>
      <span className="sr-only">: {LIBELLE[etat]}</span>
    </span>
  );
}
