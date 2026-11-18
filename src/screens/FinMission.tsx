import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { Mascotte } from '../components/mascotte/Mascotte';
import { Bouton } from '../components/ui/Bouton';
import { Icone } from '../components/ui/Icone';
import { MISSIONS, trouverMission } from '../game/missions';
import { useProgression } from '../game/store';
import { estJouable, notionsTonGit, xpPour } from '../game/regles';
import { compter } from '../game/pluriel';
import styles from './FinMission.module.css';

interface EtatFin {
  id: string;
  commandes: number;
  etoiles: 1 | 2 | 3;
}

const COULEURS = [1, 2, 3, 4, 5, 6];

/** Mission suivante dans l'ordre du jeu (brouillons sautés). */
function missionSuivante(id: string): string | null {
  const jouables = MISSIONS.filter(estJouable);
  const i = jouables.findIndex((m) => m.id === id);
  return jouables[i + 1]?.id ?? null;
}

/** Étoile à quatre branches, pour la décoration autour de Hédi. */
function Etincelle({ x, y, taille }: { x: number; y: number; taille: number }) {
  return (
    <svg
      className={styles.etincelle}
      style={{ left: x, top: y }}
      width={taille}
      height={taille}
      viewBox="-10 -10 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 -10 L2 -2 L10 0 L2 2 L0 10 L-2 2 L-10 0 L-2 -2 Z" style={{ fill: 'var(--color-hint)' }} />
    </svg>
  );
}

export function FinMission() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const progression = useProgression((s) => s.progression);
  const etat = location.state as EtatFin | null;
  const mission = trouverMission(id);
  const reduit =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [etoilesAffichees, setEtoilesAffichees] = useState(() => (reduit ? (etat?.etoiles ?? 0) : 0));

  const notions = useMemo(() => notionsTonGit(MISSIONS, progression, null), [progression]);

  useEffect(() => {
    if (etat === null || etat.id !== id || reduit) return;
    const minuteries: number[] = [];
    for (let i = 1; i <= etat.etoiles; i += 1) {
      minuteries.push(
        window.setTimeout(() => {
          setEtoilesAffichees(i);
        }, i * 850),
      );
    }
    return () => {
      minuteries.forEach((m) => {
        window.clearTimeout(m);
      });
    };
  }, [etat, id, reduit]);

  if (mission === undefined || !estJouable(mission)) return <Navigate to="/carte" replace />;
  if (etat === null || etat.id !== id) return <Navigate to="/carte" replace />;

  const suivante = missionSuivante(mission.id);
  const maitrisees = notions.filter((n) => n.etat === 'maitrisee').length;
  const xp = xpPour(etat.etoiles);
  const derniereCommande = mission.solution[mission.solution.length - 1] ?? '';

  return (
    <div className={styles.page}>
      {!reduit && (
        <div className={styles.confettis} aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <span
              key={i}
              className={styles.confetti}
              style={{
                left: `${(i * 37) % 100}%`,
                animationDelay: `${(i % 6) * 0.3}s`,
                background: `var(--branch-${COULEURS[i % COULEURS.length] ?? 1})`,
              }}
            />
          ))}
        </div>
      )}

      <main className={styles.principal}>
        <section className={styles.gauche} aria-labelledby="fin-titre">
          <div className={styles.bulle}>Je savais que tu étais la bonne recrue !</div>
          <div className={styles.hedi}>
            <Mascotte expression="fier" taille={220} anime={!reduit} />
            <Etincelle x={-6} y={22} taille={26} />
            <Etincelle x={210} y={48} taille={20} />
            <Etincelle x={206} y={170} taille={18} />
          </div>
          <h1 id="fin-titre" className={styles.titre}>
            Mission accomplie !
          </h1>
          <p className={styles.sousTitre}>
            Chapitre {mission.chapitre} · Mission {mission.ordre} — {mission.titre}
          </p>
          <div
            className={styles.etoiles}
            role="img"
            aria-label={`${compter(etat.etoiles, 'étoile', 'étoiles')} sur 3`}
          >
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`${styles.etoile} ${n <= etoilesAffichees ? styles.allumee : ''}`}
                aria-hidden="true"
              >
                <Icone
                  nom="etoile"
                  taille={66}
                  trait={1.2}
                  remplie
                  couleur={n <= etat.etoiles ? 'var(--color-hint)' : 'var(--color-border-strong)'}
                />
              </span>
            ))}
          </div>
          <p className={styles.pastille}>
            {compter(etat.commandes, 'commande', 'commandes')} — optimal : {mission.optimal}
          </p>
        </section>

        <section className={styles.droite} aria-label="Résultat">
          <div className={styles.stats}>
            <div className={`${styles.stat} ${styles.statXp}`}>
              <span className={styles.statTitre}>XP gagnés</span>
              <strong className={styles.statValeur}>+{xp}</strong>
              <span className={styles.statDetail}>{etat.etoiles} ★ × 10</span>
            </div>
            <div className={`${styles.stat} ${styles.statCommandes}`}>
              <span className={styles.statTitre}>Commandes</span>
              <strong className={styles.statValeur}>{etat.commandes}</strong>
              <span className={styles.statDetail}>optimal : {mission.optimal}</span>
            </div>
            <div className={`${styles.stat} ${styles.statGit}`}>
              <span className={styles.statTitre}>Ton Git</span>
              <strong className={styles.statValeur}>
                {maitrisees} / {notions.length}
              </strong>
              <span className={styles.statDetail}>+ {mission.notion}</span>
            </div>
          </div>

          <div className={styles.appris}>
            <div className={styles.apprisEntete}>
              <h2 className={styles.h2}>Ce que tu as appris</h2>
              {derniereCommande !== '' && (
                <code className={styles.commande}>$ {derniereCommande.replace(/^git /, 'git ')}</code>
              )}
            </div>
            <ul className={styles.liste}>
              {mission.appris.map((a) => (
                <li key={a} className={styles.item}>
                  <span className={styles.coche} aria-hidden="true">
                    <Icone nom="coche" taille={16} trait={3} couleur="var(--color-success)" />
                  </span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className={styles.pied}>
        <span className={styles.resume}>
          +{xp} XP · {mission.notion} rejoint ton Git :{' '}
          {compter(maitrisees, 'notion maîtrisée', 'notions maîtrisées')} sur {notions.length}
        </span>
        <div className={styles.actions}>
          {etat.etoiles < 3 && (
            <Bouton
              variante="secondaire"
              onClick={() => {
                void navigate(`/mission/${mission.id}`);
              }}
            >
              Rejouer pour ★★★
            </Bouton>
          )}
          {suivante !== null ? (
            <Link to={`/mission/${suivante}`} className={styles.suivante}>
              Mission suivante
            </Link>
          ) : (
            <Link to="/carte" className={styles.suivante}>
              Retour à la carte
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
}
