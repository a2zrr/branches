import { Link } from 'react-router';
import { EnTeteAppli } from '../components/ui/EnTeteAppli';
import { PiedPage } from '../components/ui/PiedPage';
import { BarreProgression } from '../components/ui/BarreProgression';
import { Badge } from '../components/ui/Badge';
import { TonGit } from '../components/ui/TonGit';
import { Mascotte } from '../components/mascotte/Mascotte';
import { BADGES } from '../game/missions';
import { useEtatJeu } from '../game/useEtatJeu';
import styles from './Accueil.module.css';

export function Accueil() {
  const e = useEtatJeu();
  const bulle = e.premiereVisite
    ? 'Salut ! Ce soir on a une démo… et le projet est cassé.'
    : e.enCours !== null
      ? `Bon. On reprend « ${e.enCours.titre} » ?`
      : 'Tu maîtrises tout Git. Enfin, presque.';
  const prochaine = e.notions.find((n) => n.etat !== 'maitrisee');
  const cible = e.enCours !== null ? `/mission/${e.enCours.id}` : '/carte';

  return (
    <div className={styles.page}>
      <EnTeteAppli notionsMaitrisees={e.notionsMaitrisees} notionsTotal={e.notionsTotal} xp={e.xp} />

      <main>
        <section className={styles.hero} aria-labelledby="accueil-titre">
          <div className={styles.illustration}>
            <p className={styles.bulle} aria-live="polite">
              {bulle}
            </p>
            <div className={styles.hedi}>
              <Mascotte expression="accueillant" taille={320} />
            </div>
          </div>
          <div className={styles.texte}>
            <h1 id="accueil-titre" className={styles.titre}>
              Git, version jeu vidéo
            </h1>
            <p className={styles.intro}>
              Tape de vraies commandes, regarde ton historique bouger en direct, et deviens la personne qui
              répare main quand tout le monde panique.
            </p>
            <div className={styles.actions}>
              <Link to={cible} className={styles.commencer}>
                Commencer
              </Link>
              <Link to="/carte" className={styles.secondaire}>
                Voir la carte
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.bloc} aria-labelledby="ton-git">
          <div className={styles.colonne}>
            <h2 id="ton-git" className={styles.h2}>
              Ton Git
            </h2>
            <p className={styles.legende}>
              {e.notionsMaitrisees} notions maîtrisées sur {e.notionsTotal}
            </p>
            <BarreProgression
              valeur={e.notionsMaitrisees}
              max={e.notionsTotal}
              etiquette="Notions maîtrisées"
            />
            <TonGit notions={e.notions} />
            <p className={styles.suite}>
              {prochaine !== undefined
                ? `Prochaine notion : ${prochaine.nom}.`
                : 'Tu as maîtrisé toutes les notions du jeu.'}
            </p>
          </div>
          <div className={styles.colonne}>
            <h2 className={styles.h2}>Tes badges</h2>
            <div className={styles.badges}>
              {BADGES.map((b) => (
                <Badge key={b.id} badge={b} debloque={e.debloquees.has(b.id)} />
              ))}
            </div>
            <p className={styles.legende}>
              Chaque badge se gagne en maîtrisant une commande, jamais en revenant un certain nombre de jours.
            </p>
          </div>
        </section>

        <section className={styles.bloc} aria-labelledby="cartes-titre">
          <h2 id="cartes-titre" className={styles.h2}>
            Cette fois, tu vas vraiment comprendre Git
          </h2>
          <p className={styles.legende}>
            Pas de cours magistral. Une start-up en feu, un terminal et un graphe qui réagit à chaque
            commande.
          </p>
          <div className={styles.cartes}>
            <article className={styles.carte}>
              <pre className={styles.terminal}>
                <code>{'$ git switch -c fix\n$ git commit -m "ouf"\n$ git merge fix'}</code>
              </pre>
              <h3 className={styles.h3}>De vraies commandes</h3>
              <p className={styles.legende}>
                Pas de QCM déguisé : tu tapes git commit, git revert, git bisect… exactement comme au boulot.
              </p>
            </article>
            <article className={styles.carte}>
              <h3 className={styles.h3}>Ton historique en direct</h3>
              <p className={styles.legende}>
                Chaque commande s’anime sur le graphe. Tu vois enfin ce que fait vraiment un merge.
              </p>
            </article>
            <article className={styles.carte}>
              <div className={styles.petiteMascotte}>
                <Mascotte expression="panique" taille={120} />
              </div>
              <h3 className={styles.h3}>Une start-up à sauver</h3>
              <p className={styles.legende}>
                Chaque chapitre est une nouvelle galère chez Pivot &amp; Co. Hédi, ton chef de projet, compte
                sur toi.
              </p>
            </article>
          </div>
        </section>
      </main>

      <PiedPage />
    </div>
  );
}
