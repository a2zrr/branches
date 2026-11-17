import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { Mascotte } from '../components/mascotte/Mascotte';
import { Bouton } from '../components/ui/Bouton';
import { Icone } from '../components/ui/Icone';
import { TonGit } from '../components/ui/TonGit';
import { BulleMascotte } from '../components/ui/BulleMascotte';
import { MISSIONS, trouverMission } from '../game/missions';
import { useProgression } from '../game/store';
import { estJouable, notionsTonGit, xpPour } from '../game/regles';
import type { ResultatMission } from '../game/regles';
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

  const resultat: ResultatMission | undefined = progression[id];
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
  const notion = notions.find((n) => n.nom === mission.notion);
  const etoiles = etat.etoiles;
  const xp = xpPour(etoiles);
  const meilleures = resultat?.etoiles ?? etoiles;

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
        <section className={styles.bloc} aria-labelledby="fin-titre">
          <BulleMascotte expression="fier" ton="reaction" texte="Je savais que tu étais la bonne recrue !" />
          <div className={styles.hedi}>
            <Mascotte expression="fier" taille={200} anime={!reduit} />
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
            aria-label={`${etoiles} étoile${etoiles > 1 ? 's' : ''} sur 3`}
          >
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`${styles.etoile} ${n <= etoilesAffichees ? styles.allumee : ''}`}
                aria-hidden="true"
              >
                <Icone
                  nom="etoile"
                  taille={56}
                  trait={1.5}
                  remplie
                  couleur={n <= etoiles ? 'var(--color-hint)' : 'var(--color-border)'}
                />
              </span>
            ))}
          </div>
          <p className={styles.commandes}>
            {etat.commandes} commande{etat.commandes > 1 ? 's' : ''} — optimal : {mission.optimal}
          </p>
        </section>

        <section className={styles.bloc} aria-labelledby="fin-stats">
          <h2 id="fin-stats" className={styles.h2}>
            Ce que tu as gagné
          </h2>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statTitre}>XP gagnés</span>
              <strong className={styles.statValeur}>+{xp}</strong>
            </div>
            <div className={styles.stat}>
              <span className={styles.statTitre}>Commandes</span>
              <strong className={styles.statValeur}>{etat.commandes}</strong>
              <span className={styles.statDetail}>optimal {mission.optimal}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statTitre}>Ton Git</span>
              <strong className={styles.statValeur}>
                {maitrisees} / {notions.length}
              </strong>
              <span className={styles.statDetail}>{notion?.nom ?? mission.notion}</span>
            </div>
          </div>
          <TonGit notions={notions} />
          <div className={styles.appris}>
            <h2 className={styles.h2}>Ce que tu as appris</h2>
            <code className={styles.commande}>$ {mission.solution[mission.solution.length - 1] ?? ''}</code>
            <ul className={styles.liste}>
              {mission.appris.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className={styles.pied}>
        <span className={styles.resume}>
          +{xp} XP · meilleure note : {meilleures} étoile{meilleures > 1 ? 's' : ''}
        </span>
        <div className={styles.actions}>
          {etoiles < 3 && (
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
