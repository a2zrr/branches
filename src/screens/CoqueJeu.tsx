import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { EnTeteJeu } from '../components/ui/EnTeteJeu';
import { BandeauRetour } from '../components/ui/BandeauRetour';
import { Modale } from '../components/ui/Modale';
import { PanneauIndice } from '../components/ui/PanneauIndice';
import { REGISTRE, type ReponseChoix } from '../exercises/registre';
import { depotInitial } from '../game/solution';
import { trouverMission, MISSIONS } from '../game/missions';
import { useProgression } from '../game/store';
import { estJouable, progressionChapitre } from '../game/regles';
import { useEtatJeu } from '../game/useEtatJeu';
import { evaluerReussite } from '../game/reussite';
import { Introuvable } from './Introuvable';
import type { MissionJouableValidee } from '../game/schemas';
import type { Depot } from '../engine/types';
import styles from './CoqueJeu.module.css';

type Bandeau = { type: 'neutre' } | { type: 'rate'; message: string } | { type: 'reussi'; message: string };

export function CoqueJeu() {
  const { id = '' } = useParams();
  const mission = trouverMission(id);
  const etat = useEtatJeu();
  if (mission === undefined) return <Introuvable />;
  if (!estJouable(mission)) return <Navigate to="/carte" replace />;
  if (etat.etats[mission.id] === 'verrouillee') return <Navigate to="/carte" replace />;
  return <CoqueMission key={mission.id} mission={mission} />;
}

export function CoqueMission({ mission }: { mission: MissionJouableValidee }) {
  const navigate = useNavigate();
  const terminerMission = useProgression((s) => s.terminerMission);
  const progression = useProgression((s) => s.progression);
  const [depot, setDepot] = useState<Depot>(() => depotInitial(mission));
  const [commandes, setCommandes] = useState(0);
  const [pret, setPret] = useState(false);
  const [bandeau, setBandeau] = useState<Bandeau>({ type: 'neutre' });
  const [indicesReveles, setIndicesReveles] = useState(0);
  const [indiceOuvert, setIndiceOuvert] = useState(false);
  const [quitter, setQuitter] = useState(false);
  const [choix, setChoix] = useState<ReponseChoix>([]);

  const Exercice = REGISTRE[mission.type].Composant;
  const chapitre = progressionChapitre(MISSIONS, mission.chapitre, progression);
  const total = MISSIONS.filter((m) => m.chapitre === mission.chapitre && estJouable(m)).length;

  const verifier = () => {
    const definition = REGISTRE[mission.type];
    let courant = depot;
    let reaction: string | undefined;
    if (definition.preparerVerification) {
      const preparation = definition.preparerVerification(mission, depot, choix);
      if (!preparation.ok) {
        setBandeau({ type: 'rate', message: preparation.message });
        return;
      }
      courant = preparation.depot;
      reaction = preparation.reaction;
      setDepot(courant);
    }
    const nombre = definition.compteLesValidations ? commandes + 1 : commandes;
    if (definition.compteLesValidations) setCommandes(nombre);
    const resultat = evaluerReussite(courant, mission.reussite);
    if (resultat.ok) {
      setBandeau({
        type: 'reussi',
        message: reaction ?? `Tu as réussi en ${nombre} commande${nombre > 1 ? 's' : ''}.`,
      });
    } else {
      setBandeau({ type: 'rate', message: resultat.messageDuPremierEchec ?? '' });
    }
  };

  const continuer = () => {
    const resultat = terminerMission(mission.id, commandes);
    void navigate(`/mission/${mission.id}/fin`, {
      state: { id: mission.id, commandes, etoiles: resultat?.etoiles ?? 1 },
    });
  };

  return (
    <div className={styles.page}>
      <EnTeteJeu
        chapitre={mission.chapitre}
        numero={mission.ordre}
        total={total}
        faites={chapitre.faites}
        titre={mission.titre}
        objectif={mission.objectif}
        indicesRestants={mission.indices.length - indicesReveles}
        onIndice={() => {
          setIndiceOuvert(true);
        }}
        onQuitter={() => {
          setQuitter(true);
        }}
      />

      <main className={styles.exercice}>
        <Exercice
          mission={mission}
          depot={depot}
          majDepot={(d) => {
            setDepot(d);
            setBandeau((b) => (b.type === 'rate' ? b : { type: 'neutre' }));
          }}
          compterCommande={() => {
            setCommandes((c) => c + 1);
          }}
          signalerErreur={(explication) => {
            setBandeau({ type: 'rate', message: explication });
          }}
          setPret={setPret}
          choix={choix}
          setChoix={setChoix}
        />
      </main>

      {bandeau.type === 'neutre' && (
        <footer className={styles.bandeau}>
          <BandeauRetour
            type="neutre"
            commandes={commandes}
            optimal={mission.optimal}
            onAction={verifier}
            onReinitialiser={() => {
              setDepot(depotInitial(mission));
            }}
          />
          {!pret && <span className={styles.aide}>Tape une commande pour activer VÉRIFIER.</span>}
        </footer>
      )}
      {bandeau.type === 'rate' && (
        <footer className={styles.bandeau}>
          <BandeauRetour
            type="rate"
            message={bandeau.message}
            onAction={() => {
              setBandeau({ type: 'neutre' });
            }}
          />
        </footer>
      )}
      {bandeau.type === 'reussi' && (
        <footer className={styles.bandeau}>
          <BandeauRetour type="reussi" message={bandeau.message} onAction={continuer} />
        </footer>
      )}

      {indiceOuvert && (
        <PanneauIndice
          indices={mission.indices}
          index={indicesReveles}
          onSuivant={() => {
            setIndicesReveles((n) => Math.min(mission.indices.length, n + 1));
          }}
          onFermer={() => {
            setIndiceOuvert(false);
          }}
        />
      )}

      {quitter && (
        <Modale
          titre="Quitter la mission ?"
          libelleConfirmer="Quitter"
          variante="danger"
          onConfirmer={() => {
            void navigate('/carte');
          }}
          onAnnuler={() => {
            setQuitter(false);
          }}
        >
          <p>Ta progression dans cette mission sera perdue. Ta partie, elle, reste sauvegardée.</p>
        </Modale>
      )}
    </div>
  );
}
