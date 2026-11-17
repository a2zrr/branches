import { Link, useNavigate } from 'react-router';
import { EnTeteAppli } from '../components/ui/EnTeteAppli';
import { EnTeteChapitre } from '../components/ui/EnTeteChapitre';
import { PastilleMission } from '../components/ui/PastilleMission';
import { BarreProgression } from '../components/ui/BarreProgression';
import { TonGit } from '../components/ui/TonGit';
import { PiedPage } from '../components/ui/PiedPage';
import { Mascotte } from '../components/mascotte/Mascotte';
import { CHAPITRES, MISSIONS } from '../game/missions';
import { estJouable, progressionChapitre } from '../game/regles';
import { useEtatJeu } from '../game/useEtatJeu';
import type { EtatMission } from '../game/regles';
import styles from './Carte.module.css';

/** Décalages en zigzag des pastilles (spec §9). */
const ZIGZAG = [0, 70, 105, 70, 0, -70, -105, -70];

export function Carte() {
  const e = useEtatJeu();
  const navigate = useNavigate();
  const chapitreCourant = e.enCours?.chapitre ?? 1;
  const progChapitre = progressionChapitre(MISSIONS, chapitreCourant, e.progression);
  const jouablesChapitre = MISSIONS.filter((m) => m.chapitre === chapitreCourant && estJouable(m)).length;

  return (
    <div className={styles.page}>
      <h1 className={styles.visuellementCache}>Carte des missions</h1>
      <EnTeteAppli
        notionsMaitrisees={e.notionsMaitrisees}
        notionsTotal={e.notionsTotal}
        xp={e.xp}
        etoiles={{ valeur: e.etoiles }}
      />

      <div className={styles.corps}>
        <main className={styles.chemin}>
          {CHAPITRES.map((chapitre) => {
            const missions = MISSIONS.filter((m) => m.chapitre === chapitre.numero);
            const prog = progressionChapitre(MISSIONS, chapitre.numero, e.progression);
            const ouvert =
              chapitre.bientot !== true &&
              (chapitre.numero === 1 ||
                missions.some((m) => e.etats[m.id] !== undefined && e.etats[m.id] !== 'verrouillee'));
            const etat = chapitre.bientot === true ? 'bientot' : ouvert ? 'ouvert' : 'verrouille';
            return (
              <section
                key={chapitre.numero}
                className={styles.chapitre}
                aria-label={`Chapitre ${chapitre.numero}`}
              >
                <EnTeteChapitre
                  numero={chapitre.numero}
                  titre={chapitre.titre}
                  sousTitre={chapitre.sousTitre}
                  etat={etat}
                  faites={prog.faites}
                  total={prog.total}
                  etoiles={prog.etoiles}
                  {...(chapitre.couleur !== undefined ? { couleur: chapitre.couleur } : {})}
                  {...(chapitre.couleurArete !== undefined ? { couleurArete: chapitre.couleurArete } : {})}
                />
                {etat !== 'bientot' && (
                  <ol className={styles.pastilles}>
                    {missions.map((m, i) => {
                      const etatM: EtatMission =
                        m.id in e.etats ? (e.etats[m.id] ?? 'verrouillee') : 'verrouillee';
                      const pastille = etatM === 'verrouillee' ? 'verrouillee' : etatM;
                      return (
                        <li key={m.id} className={styles.noeud}>
                          <PastilleMission
                            etat={pastille}
                            etoiles={e.progression[m.id]?.etoiles ?? 0}
                            numero={m.ordre}
                            titre={m.titre}
                            decalage={ZIGZAG[i % ZIGZAG.length] ?? 0}
                            onClick={() => {
                              void navigate(`/mission/${m.id}`);
                            }}
                          />
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            );
          })}
        </main>

        <aside className={styles.colonne} aria-label="Hédi et progression">
          <div className={styles.bloc}>
            <div className={styles.hedi}>
              <Mascotte expression="accueillant" taille={96} />
              <p className={styles.bulle}>Bon. Démo à 20 h, et main est encore tout cassé. On s’y remet ?</p>
            </div>
            {e.enCours !== null ? (
              <Link to={`/mission/${e.enCours.id}`} className={styles.reprendre}>
                Reprendre la mission {e.enCours.ordre}
              </Link>
            ) : (
              <p className={styles.legende}>Toutes les missions jouables sont terminées.</p>
            )}
          </div>

          <div className={styles.bloc}>
            <TonGit notions={e.notions} />
          </div>

          <div className={styles.bloc}>
            <h2 className={styles.h2}>Chapitre {chapitreCourant}</h2>
            <BarreProgression
              valeur={progChapitre.faites}
              max={jouablesChapitre}
              etiquette={`Missions terminées du chapitre ${chapitreCourant}`}
            />
            <BarreProgression
              valeur={progChapitre.etoiles}
              max={jouablesChapitre * 3}
              etiquette={`Étoiles du chapitre ${chapitreCourant}`}
            />
          </div>
        </aside>
      </div>

      <PiedPage />
    </div>
  );
}
