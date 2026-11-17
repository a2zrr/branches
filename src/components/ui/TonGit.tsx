import { PuceNotion, type EtatNotion } from './PuceNotion';
import styles from './TonGit.module.css';

export interface NotionTonGit {
  nom: string;
  etat: EtatNotion;
}

export interface TonGitProps {
  notions: NotionTonGit[];
}

export function TonGit({ notions }: TonGitProps) {
  const maitrisees = notions.filter((n) => n.etat === 'maitrisee').length;
  return (
    <section className={styles.bloc} aria-labelledby="ton-git-titre">
      <div className={styles.entete}>
        <h3 id="ton-git-titre" className={styles.titre}>
          Ton Git
        </h3>
        <span className={styles.compte}>
          {maitrisees} / {notions.length}
        </span>
      </div>
      <ul className={styles.liste}>
        {notions.map((notion) => (
          <li key={notion.nom}>
            <PuceNotion nom={notion.nom} etat={notion.etat} />
          </li>
        ))}
      </ul>
    </section>
  );
}
