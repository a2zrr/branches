import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { EnTeteAppli } from '../components/ui/EnTeteAppli';
import { BarreProgression } from '../components/ui/BarreProgression';
import { PuceNotion } from '../components/ui/PuceNotion';
import { Mascotte } from '../components/mascotte/Mascotte';
import { ChapitreCarte } from '../components/carte/ChapitreCarte';
import { MurDeNuages } from '../components/carte/MurDeNuages';
import { VoileDecouverte } from '../components/carte/VoileDecouverte';
import { BarreMission } from '../components/carte/BarreMission';
import { FeuilleTonGit } from '../components/carte/FeuilleTonGit';
import { useMesures } from '../components/carte/useMesures';
import { CHAPITRES, MISSIONS } from '../game/missions';
import { compter } from '../game/pluriel';
import { chapitresVisibles } from '../game/carte';
import { estJouable, progressionChapitre } from '../game/regles';
import { useEtatJeu } from '../game/useEtatJeu';
import { useProgression } from '../game/store';
import styles from './Carte.module.css';

/** Durées de l'ouverture des nuages (spec § 9 bis, « Minutage »). */
const FIN_VOILE_MS = 1700;
const FIN_CLICS_BLOQUES_MS = 2400;
const DEPART_APRES_DEFILEMENT_MS = 500;

function reduireLesAnimations(): boolean {
  if (typeof window === 'undefined') return false;
  const { matchMedia } = window as Partial<Window>;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function Carte() {
  const e = useEtatJeu();
  const navigate = useNavigate();
  const mesures = useMesures();
  const pc = mesures.pc;
  // Téléphone : la mission choisie (par défaut la mission en cours) s'affiche dans la barre du bas.
  const [choisie, setChoisie] = useState<string | null>(null);
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const marquerDecouverts = useProgression((s) => s.marquerDecouverts);
  const chapitreCourant = e.enCours?.chapitre ?? 1;
  const progChapitre = progressionChapitre(MISSIONS, chapitreCourant, e.progression);
  const jouablesChapitre = MISSIONS.filter((m) => m.chapitre === chapitreCourant && estJouable(m)).length;
  const vue = useMemo(
    () => chapitresVisibles(CHAPITRES, MISSIONS, e.progression, e.chapitresDecouverts),
    [e.progression, e.chapitresDecouverts],
  );

  // Ouverture : un chapitre visible pas encore découvert. Joué une seule fois ; réduit = pas d'animation.
  const reduit = useMemo(() => reduireLesAnimations(), []);
  const [ouverture, setOuverture] = useState<number | null>(() => (reduit ? null : vue.aDecouvrir));
  const [joue, setJoue] = useState(false);
  const [clicsBloques, setClicsBloques] = useState(ouverture !== null);
  // Réduit : pas de voile, le chapitre est affiché d'emblée ; l'annonce est faite quand même.
  const [annonce, setAnnonce] = useState(() => {
    if (!reduit) return '';
    const tous = vue.chapitres.filter((c) => !e.chapitresDecouverts.includes(c.numero));
    if (tous.length === 0) return '';
    const plusHaut = tous[tous.length - 1];
    return plusHaut === undefined ? '' : `Chapitre ${plusHaut.numero} découvert : ${plusHaut.titre}`;
  });
  const demarre = useRef(false);

  // Au premier affichage : les chapitres visibles autres que le plus haut sont marqués sans animation.
  // Si le chapitre à découvrir n'est pas à l'écran, on y défile, puis l'animation part.
  useEffect(() => {
    if (demarre.current) return;
    demarre.current = true;
    const autres = vue.chapitres
      .map((c) => c.numero)
      .filter((n) => n !== ouverture && !e.chapitresDecouverts.includes(n));
    if (reduit) {
      const tous = vue.chapitres.map((c) => c.numero).filter((n) => !e.chapitresDecouverts.includes(n));
      if (tous.length > 0) marquerDecouverts(tous);
      return;
    }
    if (ouverture === null) return;
    if (autres.length > 0) marquerDecouverts(autres);
    const voile = document.querySelector('[data-voile]');
    const r = voile?.getBoundingClientRect();
    if (voile !== null && r !== undefined && (r.top < 0 || r.bottom > window.innerHeight)) {
      voile.scrollIntoView({ block: 'center', behavior: 'smooth' });
      window.setTimeout(() => {
        setJoue(true);
      }, DEPART_APRES_DEFILEMENT_MS);
    } else {
      window.setTimeout(() => {
        setJoue(true);
      }, 0);
    }
  }, [ouverture, reduit, vue.chapitres, e.chapitresDecouverts, marquerDecouverts]);

  // Le voile se retire à 1 700 ms : le chapitre est marqué découvert, puis l'annonce est faite.
  useEffect(() => {
    if (!joue || ouverture === null) return;
    const titre = CHAPITRES.find((c) => c.numero === ouverture)?.titre ?? '';
    const t = window.setTimeout(() => {
      marquerDecouverts([ouverture]);
      setOuverture(null);
      setAnnonce(`Chapitre ${ouverture} découvert : ${titre}`);
    }, FIN_VOILE_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [joue, ouverture, marquerDecouverts]);

  // Les clics sont ignorés pendant 2,4 s après le début de l'ouverture.
  useEffect(() => {
    if (!joue) return;
    const t = window.setTimeout(() => {
      setClicsBloques(false);
    }, FIN_CLICS_BLOQUES_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [joue]);

  const dernier = vue.chapitres.length - 1;
  const missionBarre = MISSIONS.find((m) => m.id === (choisie ?? e.enCours?.id));
  const phase = joue ? 'joue' : 'attente';

  return (
    <div className={styles.page}>
      <h1 className={styles.visuellementCache}>Carte des missions</h1>
      <div className={styles.enteteCollante}>
        <EnTeteAppli
          variante="carte"
          notionsMaitrisees={e.notionsMaitrisees}
          notionsTotal={e.notionsTotal}
          xp={e.xp}
          etoiles={{ valeur: e.etoiles }}
          {...(pc
            ? {}
            : {
                onNotions: () => {
                  setFeuilleOuverte(true);
                },
              })}
        />
      </div>

      <div className={`conteneur ${styles.corps}`}>
        <main className={styles.chemin} inert={clicsBloques}>
          {vue.chapitres.map((chapitre, i) => {
            const suivant = ouverture !== null && chapitre.numero === ouverture - 1 ? ouverture : null;
            const nouveau = ouverture !== null && chapitre.numero === ouverture;
            const jouables = MISSIONS.filter((m) => m.chapitre === chapitre.numero && estJouable(m));
            return (
              <ChapitreCarte
                key={chapitre.numero}
                mesures={mesures}
                chapitre={chapitre}
                missions={vue.missions.filter((m) => m.chapitre === chapitre.numero)}
                etats={e.etats}
                progression={e.progression}
                suiviDUnMur={i === dernier || suivant !== null}
                {...(nouveau ? { revele: phase } : {})}
                onOpen={(id) => {
                  if (pc) void navigate(`/mission/${id}`);
                  else setChoisie(id);
                }}
              >
                {suivant !== null && (
                  <VoileDecouverte
                    precedent={chapitre.numero}
                    suivant={suivant}
                    avancement={{
                      faites: jouables.filter((m) => e.progression[m.id]?.reussie === true).length,
                      total: jouables.length,
                    }}
                    phase={phase}
                    mesures={mesures}
                  />
                )}
              </ChapitreCarte>
            );
          })}
          {/* Rien après le mur : les chapitres cachés ne sont pas rendus. */}
          <MurDeNuages
            mur={vue.mur}
            mesures={mesures}
            {...(ouverture !== null ? { apparition: phase } : {})}
          />
        </main>

        <p className={styles.visuellementCache} role="status" aria-live="polite">
          {annonce}
        </p>

        <aside className={styles.colonne} aria-label="Hédi et progression">
          <section className={styles.carte} aria-label="Hédi">
            <div className={styles.hedi}>
              <Mascotte expression="accueillant" taille={96} />
              <p className={styles.bulle}>Bon. Démo à 20 h, et main est encore tout cassé. On s’y remet{' '}?</p>
            </div>
            {e.enCours !== null ? (
              <Link to={`/mission/${e.enCours.id}`} className={styles.reprendre}>
                Reprendre la mission {e.enCours.ordre}
              </Link>
            ) : (
              <p className={styles.legende}>Toutes les missions jouables sont terminées.</p>
            )}
          </section>

          <section className={styles.carte} aria-labelledby="carte-ton-git">
            <div className={styles.entete}>
              <h2 id="carte-ton-git" className={styles.h2}>
                Ton Git
              </h2>
              <span className={styles.compte}>
                {compter(e.notionsMaitrisees, 'notion maîtrisée', 'notions maîtrisées')} sur {e.notionsTotal}
              </span>
            </div>
            <ul className={styles.puces}>
              {e.notions.map((n) => (
                <li key={n.nom}>
                  <PuceNotion nom={n.nom} etat={n.etat} />
                </li>
              ))}
            </ul>
            <p className={styles.legende}>Ici on compte les commandes que tu maîtrises, pas les jours.</p>
          </section>

          <section className={styles.carte} aria-labelledby="carte-chapitre">
            <h2 id="carte-chapitre" className={styles.h2}>
              Chapitre {chapitreCourant}
            </h2>
            <BarreProgression
              valeur={progChapitre.faites}
              max={jouablesChapitre}
              etiquette="Missions"
              libelleValeur={`${progChapitre.faites} / ${jouablesChapitre}`}
            />
            <BarreProgression
              valeur={progChapitre.etoiles}
              max={jouablesChapitre * 3}
              etiquette="Étoiles"
              libelleValeur={`${progChapitre.etoiles} / ${jouablesChapitre * 3}`}
            />
          </section>
        </aside>
      </div>

      {!pc && missionBarre !== undefined && (
        <BarreMission
          numero={missionBarre.ordre}
          titre={missionBarre.titre}
          terminee={e.progression[missionBarre.id]?.reussie === true}
          onJouer={() => {
            void navigate(`/mission/${missionBarre.id}`);
          }}
        />
      )}
      {!pc && feuilleOuverte && (
        <FeuilleTonGit
          notions={e.notions}
          maitrisees={e.notionsMaitrisees}
          total={e.notionsTotal}
          onFermer={() => {
            setFeuilleOuverte(false);
          }}
        />
      )}
    </div>
  );
}
