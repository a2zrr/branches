import { useEffect, useMemo, useState } from 'react';
import { FichierConflit } from '../../components/conflit/FichierConflit';
import { analyserMarqueurs } from '../../components/conflit/analyse';
import { CarteChoix } from '../../components/ui/CarteChoix';
import { BulleMascotte } from '../../components/ui/BulleMascotte';
import { Bouton } from '../../components/ui/Bouton';
import { creerDepot } from '../../engine/depot';
import { executer } from '../../engine/executer';
import { nombreBlocs } from '../../engine/commandes/fusion';
import type { Choix, Segment } from '../../engine/types';
import type { PropsExercice } from '../registre';
import styles from './Conflit.module.css';

const SANS_SEGMENTS: readonly Segment[] = [];
const SANS_CHOIX: readonly Choix[] = [];

/** Sortie de la commande de départ (git merge …), affichée en haut comme dans le terminal. */
function sortieDeDepart(mission: PropsExercice['mission']): string[] {
  if (mission.exercice === undefined) return [];
  return executer(creerDepot(mission.depot), mission.exercice.commandeDeDepart).sortie;
}

/** Aperçu : les blocs choisis sont résolus, les autres gardent leurs marqueurs. */
function apercuFichier(
  segments: readonly Segment[],
  choix: readonly (Choix | null)[],
  nomAutre: string,
): string[] {
  let k = 0;
  return segments.flatMap((s): string[] => {
    if ('ok' in s) return [...s.ok];
    const c = choix[k] ?? null;
    k += 1;
    if (c === null)
      return ['<<<<<<< HEAD', ...s.conflit.ours, '=======', ...s.conflit.theirs, `>>>>>>> ${nomAutre}`];
    if (c === 'mienne') return [...s.conflit.ours];
    if (c === 'autre') return [...s.conflit.theirs];
    return [...s.conflit.ours, ...s.conflit.theirs];
  });
}

/** Exercice « conflit » : fichier avec marqueurs à gauche, choix par bloc à droite, aperçu du résultat. */
export function Conflit({ mission, depot, setPret, choix, setChoix }: PropsExercice) {
  const exercice = mission.exercice;
  const fichier = Object.keys(depot.fusion?.fichiers ?? {})[0] ?? exercice?.fichier ?? '';
  const segments = depot.fusion?.fichiers[fichier] ?? SANS_SEGMENTS;
  const blocs = nombreBlocs(depot, fichier);
  const sortie = useMemo(() => sortieDeDepart(mission), [mission]);
  const lignes = useMemo(() => analyserMarqueurs(depot.travail[fichier] ?? []), [depot.travail, fichier]);
  const [blocActif, setBlocActif] = useState(0);
  const bloc = Math.min(blocActif, Math.max(0, blocs - 1));
  const acceptes = exercice?.choixAcceptes ?? SANS_CHOIX;
  const nomAutre = depot.fusion?.avec ?? 'autre';
  const nomCourant = depot.fusion?.cible ?? 'HEAD';
  const choixBloc = choix[bloc] ?? null;

  useEffect(() => {
    setPret(true);
  }, [setPret]);

  const choisir = (index: number, c: Choix) => {
    const nouveau = Array.from({ length: blocs }, (_, i) => choix[i] ?? null);
    nouveau[index] = c;
    setChoix(nouveau);
  };

  // Touches 1, 2, 3 : choix du bloc actif, sauf dans le terminal.
  useEffect(() => {
    const gestion = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const c: Choix | null =
        e.key === '1' ? 'mienne' : e.key === '2' ? 'autre' : e.key === '3' ? 'deux' : null;
      if (c !== null && acceptes.includes(c)) {
        const nouveau = Array.from({ length: blocs }, (_, i) => choix[i] ?? null);
        nouveau[bloc] = c;
        setChoix(nouveau);
      }
    };
    window.addEventListener('keydown', gestion);
    return () => {
      window.removeEventListener('keydown', gestion);
    };
  }, [acceptes, blocs, bloc, choix, setChoix]);

  const apercu = useMemo(() => apercuFichier(segments, choix, nomAutre), [segments, choix, nomAutre]);

  return (
    <div className={styles.zone}>
      <section className={styles.haut} aria-label="Sortie de la fusion">
        <div className={styles.sortie} role="log">
          <div className={styles.invite}>
            ~/startup-demo ({nomCourant}) $ {exercice?.commandeDeDepart}
          </div>
          {sortie.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <BulleMascotte expression="panique" ton="histoire" texte={mission.histoire} taille={72} />
      </section>

      <div className={styles.corps}>
        <FichierConflit chemin={fichier} lignes={lignes} blocActif={bloc} />

        <aside className={styles.choix} aria-label="Que garde-t-on ?">
          <h2 className={styles.h2}>Que garde-t-on ?</h2>
          {blocs > 1 && (
            <div className={styles.navigation}>
              <Bouton
                variante="secondaire"
                desactive={bloc === 0}
                onClick={() => {
                  setBlocActif((b) => Math.max(0, b - 1));
                }}
              >
                Précédent
              </Bouton>
              <span className={styles.compteur}>
                Conflit {bloc + 1} sur {blocs}
              </span>
              <Bouton
                variante="secondaire"
                desactive={bloc >= blocs - 1}
                onClick={() => {
                  setBlocActif((b) => Math.min(blocs - 1, b + 1));
                }}
              >
                Suivant
              </Bouton>
            </div>
          )}
          <div className={styles.cartes}>
            <CarteChoix
              raccourci={1}
              titre="Garder ma version"
              description={`Le code de ${nomCourant}.`}
              selectionnee={choixBloc === 'mienne'}
              desactivee={!acceptes.includes('mienne')}
              onSelect={() => {
                choisir(bloc, 'mienne');
              }}
            />
            <CarteChoix
              raccourci={2}
              titre="Garder l’autre"
              description={`Le code de ${nomAutre}.`}
              selectionnee={choixBloc === 'autre'}
              desactivee={!acceptes.includes('autre')}
              onSelect={() => {
                choisir(bloc, 'autre');
              }}
            />
            <div className={styles.pleineLargeur}>
              <CarteChoix
                raccourci={3}
                titre="Garder les deux"
                description="Les deux versions, l’une après l’autre."
                selectionnee={choixBloc === 'deux'}
                desactivee={!acceptes.includes('deux')}
                onSelect={() => {
                  choisir(bloc, 'deux');
                }}
              />
            </div>
          </div>
          <section className={styles.apercu} aria-label="Aperçu du fichier résultant">
            <h3 className={styles.h3}>Aperçu du fichier</h3>
            <textarea
              className={styles.code}
              readOnly
              rows={8}
              value={apercu.join('\n')}
              aria-label="Contenu du fichier résultant"
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
