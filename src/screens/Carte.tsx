import { Link, useNavigate } from 'react-router';
import { EnTeteAppli } from '../components/ui/EnTeteAppli';
import { ChapitreCarte } from '../components/carte/ChapitreCarte';
import { MurDeNuages } from '../components/carte/MurDeNuages';
import { MESURES_PC } from '../components/carte/geometrie';
import { BarreProgression } from '../components/ui/BarreProgression';
import { PuceNotion } from '../components/ui/PuceNotion';
import { Mascotte } from '../components/mascotte/Mascotte';
import { CHAPITRES, MISSIONS } from '../game/missions';
import { compter } from '../game/pluriel';
import { chapitresVisibles } from '../game/carte';
import { estJouable, progressionChapitre } from '../game/regles';
import { useEtatJeu } from '../game/useEtatJeu';
import styles from './Carte.module.css';

export function Carte() {
  const e = useEtatJeu();
  const navigate = useNavigate();
  const chapitreCourant = e.enCours?.chapitre ?? 1;
  const progChapitre = progressionChapitre(MISSIONS, chapitreCourant, e.progression);
  const jouablesChapitre = MISSIONS.filter((m) => m.chapitre === chapitreCourant && estJouable(m)).length;
  const vue = chapitresVisibles(CHAPITRES, MISSIONS, e.progression, e.chapitresDecouverts);

  return (
    <div className={styles.page}>
      <h1 className={styles.visuellementCache}>Carte des missions</h1>
      <EnTeteAppli
        variante="carte"
        notionsMaitrisees={e.notionsMaitrisees}
        notionsTotal={e.notionsTotal}
        xp={e.xp}
        etoiles={{ valeur: e.etoiles }}
      />

      <div className={`conteneur ${styles.corps}`}>
        <main className={styles.chemin}>
          {vue.chapitres.map((chapitre, i) => (
            <ChapitreCarte
              key={chapitre.numero}
              chapitre={chapitre}
              missions={vue.missions.filter((m) => m.chapitre === chapitre.numero)}
              etats={e.etats}
              progression={e.progression}
              suiviDUnMur={i === vue.chapitres.length - 1}
              onOpen={(id) => {
                void navigate(`/mission/${id}`);
              }}
            />
          ))}
          {/* Rien après le mur : les chapitres cachés ne sont pas rendus. */}
          <MurDeNuages mur={vue.mur} mesures={MESURES_PC} />
        </main>

        <aside className={styles.colonne} aria-label="Hédi et progression">
          <section className={styles.carte} aria-label="Hédi">
            <div className={styles.hedi}>
              <Mascotte expression="accueillant" taille={96} />
              <p className={styles.bulle}>Bon. Démo à 20 h, et main est encore tout cassé. On s’y remet{'\u00A0'}?</p>
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
    </div>
  );
}
