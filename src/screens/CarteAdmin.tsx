import { useNavigate } from 'react-router';
import { ChapitreCarte } from '../components/carte/ChapitreCarte';
import { useMesures } from '../components/carte/useMesures';
import { EnTeteChapitre } from '../components/ui/EnTeteChapitre';
import { CHAPITRES, MISSIONS } from '../game/missions';
import { useEtatJeu } from '../game/useEtatJeu';
import styles from './Carte.module.css';

/**
 * Aperçu de design : tous les chapitres de la carte, y compris ceux que le joueur ne voit pas encore.
 * Pas de voile, pas de mur, rien n'est enregistré. Les états des missions viennent de la vraie partie.
 */
export function CarteAdmin() {
  const e = useEtatJeu();
  const navigate = useNavigate();
  const mesures = useMesures();

  return (
    <div className={styles.page}>
      <h1 className={styles.visuellementCache}>Aperçu de la carte : tous les chapitres</h1>
      <div className={`conteneur ${styles.corps}`}>
        <main className={styles.chemin}>
          {CHAPITRES.map((chapitre) => {
            const missions = MISSIONS.filter((m) => m.chapitre === chapitre.numero);
            if (chapitre.bientot === true || missions.length === 0) {
              return (
                <section key={chapitre.numero} aria-label={`Chapitre ${chapitre.numero}`}>
                  <EnTeteChapitre
                    numero={chapitre.numero}
                    titre={chapitre.titre}
                    sousTitre={chapitre.sousTitre}
                    etat="bientot"
                    faites={0}
                    total={0}
                    etoiles={0}
                  />
                </section>
              );
            }
            return (
              <ChapitreCarte
                key={chapitre.numero}
                mesures={mesures}
                chapitre={chapitre}
                missions={missions}
                etats={e.etats}
                progression={e.progression}
                onOpen={(id) => {
                  void navigate(`/mission/${id}`);
                }}
              />
            );
          })}
        </main>
      </div>
    </div>
  );
}
