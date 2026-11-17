import { useEffect, useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import styles from './Terminal.module.css';

export interface LigneTerminal {
  type: 'commande' | 'sortie' | 'erreur' | 'info';
  texte: string;
}

export interface TerminalProps {
  lignes: LigneTerminal[];
  invite: string;
  onSubmit: (texte: string) => void;
  /** Noms complétés par Tab (branches). */
  completions?: string[];
  /** Le champ prend le focus au démarrage. */
  focusAuDemarrage?: boolean;
}

/** Terminal sombre : historique ↑ ↓, Tab complète les noms de branches, champ étiqueté. */
export function Terminal({
  lignes,
  invite,
  onSubmit,
  completions = [],
  focusAuDemarrage = true,
}: TerminalProps) {
  const [saisie, setSaisie] = useState('');
  const [historique, setHistorique] = useState<string[]>([]);
  const [curseurHistorique, setCurseurHistorique] = useState<number | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusAuDemarrage) champ.current?.focus();
  }, [focusAuDemarrage]);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'nearest' });
  }, [lignes]);

  const soumettre = (evenement: SyntheticEvent<HTMLFormElement>) => {
    evenement.preventDefault();
    const texte = saisie.trim();
    if (texte === '') return;
    setHistorique((h) => [...h, texte]);
    setCurseurHistorique(null);
    setSaisie('');
    onSubmit(texte);
  };

  const toucheSpeciale = (evenement: KeyboardEvent<HTMLInputElement>) => {
    if (evenement.key === 'ArrowUp') {
      evenement.preventDefault();
      if (historique.length === 0) return;
      const nouveau = curseurHistorique === null ? historique.length - 1 : Math.max(0, curseurHistorique - 1);
      setCurseurHistorique(nouveau);
      setSaisie(historique[nouveau] ?? '');
    } else if (evenement.key === 'ArrowDown') {
      evenement.preventDefault();
      if (curseurHistorique === null) return;
      const suivant = curseurHistorique + 1;
      if (suivant >= historique.length) {
        setCurseurHistorique(null);
        setSaisie('');
      } else {
        setCurseurHistorique(suivant);
        setSaisie(historique[suivant] ?? '');
      }
    } else if (evenement.key === 'Tab') {
      const mots = saisie.split(' ');
      const dernier = mots[mots.length - 1] ?? '';
      const trouves = completions.filter((c) => c.startsWith(dernier) && c !== dernier);
      if (trouves.length === 1 && trouves[0] !== undefined) {
        evenement.preventDefault();
        mots[mots.length - 1] = trouves[0];
        setSaisie(mots.join(' '));
      }
    }
  };

  return (
    <div className={styles.terminal}>
      <div className={styles.barre}>
        <span className={styles.titre}>terminal — ~/startup-demo</span>
        <span className={styles.aide}>Entrée pour exécuter · ↑ historique</span>
      </div>
      <div className={styles.ecran} role="log" aria-live="polite" aria-relevant="additions">
        {lignes.map((l, i) => (
          <div key={i} className={`${styles.ligne} ${styles[l.type]}`}>
            {l.texte}
          </div>
        ))}
        <form onSubmit={soumettre} className={styles.invite}>
          <label htmlFor="saisie-terminal" className={styles.etiquette}>
            Commande Git
          </label>
          <span className={styles.prompt} aria-hidden="true">
            {invite}
          </span>
          <input
            ref={champ}
            id="saisie-terminal"
            className={styles.saisie}
            value={saisie}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            onChange={(e) => {
              setSaisie(e.target.value);
            }}
            onKeyDown={toucheSpeciale}
          />
        </form>
        <div ref={fin} />
      </div>
    </div>
  );
}
