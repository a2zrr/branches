import { Link } from 'react-router';
import { EnTeteAppli } from '../components/ui/EnTeteAppli';
import { PiedPage } from '../components/ui/PiedPage';
import { BarreProgression } from '../components/ui/BarreProgression';
import { Badge } from '../components/ui/Badge';
import { PuceNotion } from '../components/ui/PuceNotion';
import { Icone } from '../components/ui/Icone';
import { Mascotte } from '../components/mascotte/Mascotte';
import { BADGES, MISSIONS } from '../game/missions';
import { useEtatJeu } from '../game/useEtatJeu';
import { estJouable } from '../game/regles';
import { cheminForme } from '../components/graphe/layout';
import styles from './Accueil.module.css';

/** Formes des commits qui flottent autour de Hédi (coordonnées du viewBox 420). */
const FORMES = [
  { forme: 'cercle' as const, x: 62, y: 96, R: 15, couleur: 1, classe: 'deco' },
  { forme: 'carre' as const, x: 363, y: 79, R: 15, couleur: 2, classe: 'deco d2' },
  { forme: 'losange' as const, x: 376, y: 286, R: 15, couleur: 3, classe: 'deco d3' },
  { forme: 'triangle' as const, x: 44, y: 300, R: 15, couleur: 4, classe: 'deco d2' },
  { forme: 'croix' as const, x: 334, y: 36, R: 13, couleur: 5, classe: 'deco d3' },
];

/** Mini-graphe de la deuxième carte : main en vert, branche bleue, commit de fusion. */
function MiniGraphe() {
  return (
    <svg width="200" height="140" viewBox="0 0 200 140" aria-hidden="true" focusable="false">
      <line
        x1="48"
        y1="22"
        x2="48"
        y2="118"
        strokeWidth={4}
        strokeLinecap="round"
        style={{ stroke: 'var(--branch-1)' }}
      />
      <path
        d="M48 70 C 70 70, 80 80, 100 80 L 130 80"
        fill="none"
        strokeWidth={4}
        strokeLinecap="round"
        style={{ stroke: 'var(--branch-2)' }}
      />
      <path
        d="M130 80 C 110 60, 80 40, 48 22"
        fill="none"
        strokeWidth={4}
        strokeLinecap="round"
        style={{ stroke: 'var(--branch-2)' }}
      />
      <circle
        cx="48"
        cy="22"
        r="12"
        strokeWidth={3}
        style={{ fill: 'var(--branch-1)', stroke: 'var(--branch-1-edge)' }}
      />
      <circle
        cx="48"
        cy="70"
        r="12"
        strokeWidth={3}
        style={{ fill: 'var(--branch-1)', stroke: 'var(--branch-1-edge)' }}
      />
      <circle
        cx="48"
        cy="118"
        r="12"
        strokeWidth={3}
        style={{ fill: 'var(--branch-1)', stroke: 'var(--branch-1-edge)' }}
      />
      <rect
        x="122"
        y="72"
        width="16"
        height="16"
        rx="2"
        strokeWidth={3}
        style={{ fill: 'var(--branch-2)', stroke: 'var(--branch-2-edge)' }}
      />
      <rect x="148" y="12" width="44" height="22" rx="11" style={{ fill: 'var(--branch-1)' }} />
      <text
        x="170"
        y="27"
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        style={{ fill: 'var(--branch-ink)' }}
      >
        main
      </text>
    </svg>
  );
}

/** Mini-terminal de la première carte. */
function MiniTerminal() {
  return (
    <div className={styles.terminal}>
      <div>
        <span className={styles.invite}>$</span> git switch -c fix
      </div>
      <div>
        <span className={styles.invite}>$</span> git commit -m &quot;ouf&quot;
      </div>
      <div>
        <span className={styles.invite}>$</span> git merge fix
        <span className={styles.curseur} />
      </div>
    </div>
  );
}

export function Accueil() {
  const e = useEtatJeu();
  const bulle = e.premiereVisite
    ? 'Salut ! Ce soir on a une démo… et le projet est cassé.'
    : e.enCours !== null
      ? `Bon. On reprend « ${e.enCours.titre} » ?`
      : 'Tu maîtrises tout Git. Enfin, presque.';
  const suivante = e.notions.find((n) => n.etat !== 'maitrisee');
  const missionSuivante =
    suivante !== undefined ? MISSIONS.find((m) => estJouable(m) && m.notion === suivante.nom) : undefined;
  const cible = e.enCours !== null ? `/mission/${e.enCours.id}` : '/carte';

  return (
    <div className={styles.page}>
      <EnTeteAppli notionsMaitrisees={e.notionsMaitrisees} notionsTotal={e.notionsTotal} xp={e.xp} />

      <main className={`conteneur ${styles.principal}`}>
        <section className={styles.hero} aria-labelledby="accueil-titre">
          <div className={styles.illustration}>
            <p className={styles.bulle} aria-live="polite">
              {bulle}
            </p>
            <div className={styles.scene}>
              <svg className={styles.formes} viewBox="0 0 420 420" aria-hidden="true" focusable="false">
                {FORMES.map((f, i) => (
                  <g key={i} className={f.classe}>
                    <path
                      d={cheminForme(f.forme, f.R)}
                      transform={`translate(${f.x} ${f.y})`}
                      strokeWidth={3}
                      strokeLinejoin="round"
                      style={{
                        fill: `var(--branch-${f.couleur})`,
                        stroke: `var(--branch-${f.couleur}-edge)`,
                      }}
                    />
                  </g>
                ))}
              </svg>
              <div className={styles.cercle} />
              <div className={styles.hedi}>
                <Mascotte expression="accueillant" taille={320} />
              </div>
            </div>
          </div>

          <div className={styles.texte}>
            <p className={styles.pastille}>
              <Icone nom="cadreTerminal" taille={18} trait={2.8} couleur="var(--color-primary)" />
              Git, version jeu vidéo
            </p>
            <h1 id="accueil-titre" className={styles.titre}>
              Apprends{' '}
              <span className={styles.mot}>
                Git
                <svg
                  className={styles.souligne}
                  viewBox="0 0 120 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M3 8 C 22 2, 38 2, 60 7 S 100 12, 117 4"
                    fill="none"
                    strokeWidth={5}
                    strokeLinecap="round"
                    style={{ stroke: 'var(--color-hint)' }}
                  />
                </svg>
              </span>{' '}
              en sauvant la démo de ce soir.
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

        <section className={styles.tonGit} aria-label="Ton Git et badges">
          <div className={styles.colonne}>
            <div className={styles.entete}>
              <h2 id="ton-git" className={styles.h2}>
                Ton Git
              </h2>
              <span className={styles.compte}>
                {e.notionsMaitrisees} commandes maîtrisées sur {e.notionsTotal}
              </span>
            </div>
            <BarreProgression
              valeur={e.notionsMaitrisees}
              max={e.notionsTotal}
              etiquette="Notions maîtrisées"
              sansEtiquette
              haute
            />
            <ul className={styles.puces}>
              {e.notions.map((n) => (
                <li key={n.nom}>
                  <PuceNotion nom={n.nom} etat={n.etat === 'en-cours' ? 'en-cours' : n.etat} />
                </li>
              ))}
            </ul>
            {suivante !== undefined && (
              <p className={styles.suite}>
                Prochaine commande : {suivante.nom}
                {missionSuivante !== undefined ? `, dans la mission « ${missionSuivante.titre} »` : ''}.
              </p>
            )}
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

        <section className={styles.presentation} aria-labelledby="cartes-titre">
          <h2 id="cartes-titre" className={styles.grandTitre}>
            Cette fois, tu vas vraiment comprendre Git
          </h2>
          <p className={styles.sousTitre}>
            Pas de cours magistral. Une start-up en feu, un terminal et un graphe qui réagit à chaque
            commande.
          </p>
          <div className={styles.cartes}>
            <article className={styles.carte}>
              <div className={`${styles.illustrationCarte} ${styles.fondBleu}`}>
                <MiniTerminal />
              </div>
              <h3 className={styles.h3}>De vraies commandes</h3>
              <p className={styles.texteCarte}>
                Pas de QCM déguisé : tu tapes git commit, git revert, git bisect… exactement comme au boulot.
              </p>
            </article>
            <article className={styles.carte}>
              <div className={`${styles.illustrationCarte} ${styles.fondJaune}`}>
                <MiniGraphe />
              </div>
              <h3 className={styles.h3}>Ton historique en direct</h3>
              <p className={styles.texteCarte}>
                Chaque commande s’anime sur le graphe. Tu vois enfin ce que fait vraiment un merge.
              </p>
            </article>
            <article className={styles.carte}>
              <div className={`${styles.illustrationCarte} ${styles.fondRose}`}>
                <Mascotte expression="panique" taille={140} />
              </div>
              <h3 className={styles.h3}>Une start-up à sauver</h3>
              <p className={styles.texteCarte}>
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
