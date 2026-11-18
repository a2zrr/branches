import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Icone } from '../ui/Icone';
import { Mascotte } from '../mascotte/Mascotte';
import { MISSIONS } from '../../game/missions';
import { useProgression, type Theme } from '../../game/store';
import { useInterface } from '../../game/ui';
import { estJouable, notionsTonGit } from '../../game/regles';
import { pluriel } from '../../game/pluriel';
import styles from './FenetreParametres.module.css';

/** Panneau latéral Paramètres : se superpose à la page en cours, sans changer d'adresse. */
export function FenetreParametres() {
  const ouvert = useInterface((s) => s.parametresOuverts);
  if (!ouvert) return null;
  return <PanneauOuvert />;
}

type EtapeEfface = 0 | 1 | 2;

function PanneauOuvert() {
  const fermer = useInterface((s) => s.fermerParametres);
  const theme = useProgression((s) => s.theme);
  const definirTheme = useProgression((s) => s.definirTheme);
  const progression = useProgression((s) => s.progression);
  const exporter = useProgression((s) => s.exporter);
  const importer = useProgression((s) => s.importer);
  const reinitialiser = useProgression((s) => s.reinitialiser);
  const [sortie, setSortie] = useState(false);
  const [etape, setEtape] = useState<EtapeEfface>(0);
  const [message, setMessage] = useState<string | null>(null);
  const panneau = useRef<HTMLDivElement>(null);
  const idTitre = useId();

  const reussies = MISSIONS.filter((m) => estJouable(m) && progression[m.id]?.reussie === true).length;
  const jouables = MISSIONS.filter(estJouable).length;
  const etoiles = Object.values(progression).reduce((s, r) => s + r.etoiles, 0);
  const notions = notionsTonGit(MISSIONS, progression, null);
  const maitrisees = notions.filter((n) => n.etat === 'maitrisee').length;
  const xp = Object.values(progression).reduce((s, r) => s + r.etoiles * 10, 0);

  // Fermeture avec la sortie animée, puis démontage. Le focus revient sur la roue dentée.
  const fermerAvecSortie = () => {
    if (sortie) return;
    setSortie(true);
    window.setTimeout(fermer, 160);
  };

  // À l'ouverture, le focus va sur ✕ ; à la fermeture, il revient sur l'élément qui a ouvert la fenêtre.
  useEffect(() => {
    const declencheur = document.activeElement as HTMLElement | null;
    const premier = panneau.current?.querySelector<HTMLElement>('button');
    premier?.focus();
    const ancienOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = ancienOverflow;
      if (declencheur?.isConnected === true) declencheur.focus();
      else document.getElementById('bouton-parametres')?.focus();
    };
  }, []);

  // Échap ferme ; Tab reste dans le panneau.
  useEffect(() => {
    const clavier = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        fermerAvecSortie();
        return;
      }
      if (e.key !== 'Tab' || panneau.current === null) return;
      const focusables = Array.from(
        panneau.current.querySelectorAll<HTMLElement>('button, input, label[tabindex]'),
      ).filter((el) => !el.hasAttribute('disabled'));
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (premier === undefined || dernier === undefined) return;
      if (
        e.shiftKey &&
        (document.activeElement === premier || !panneau.current.contains(document.activeElement))
      ) {
        e.preventDefault();
        dernier.focus();
      } else if (
        !e.shiftKey &&
        (document.activeElement === dernier || !panneau.current.contains(document.activeElement))
      ) {
        e.preventDefault();
        premier.focus();
      }
    };
    window.addEventListener('keydown', clavier);
    return () => {
      window.removeEventListener('keydown', clavier);
    };
  });

  const telecharger = () => {
    const blob = new Blob([exporter()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = 'branches-progression.json';
    lien.click();
    URL.revokeObjectURL(url);
    setMessage('Progression exportée dans branches-progression.json.');
  };

  const lireFichier = (evenement: ChangeEvent<HTMLInputElement>) => {
    const fichier = evenement.target.files?.[0];
    if (fichier === undefined) return;
    void fichier.text().then((texte) => {
      const r = importer(texte);
      setMessage(r.ok ? 'Progression importée. Ta partie est à jour.' : r.message);
    });
  };

  return (
    <div className={styles.calque}>
      <div
        className={`${styles.voile} ${sortie ? styles.voileSortie : ''}`}
        aria-hidden="true"
        onClick={fermerAvecSortie}
      />
      <div
        ref={panneau}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitre}
        className={`${styles.panneau} ${sortie ? styles.panneauSortie : ''}`}
      >
        <header className={styles.entete}>
          <h2 id={idTitre} className={styles.titre}>
            Paramètres
          </h2>
          <button
            type="button"
            className={styles.fermer}
            aria-label="Fermer les paramètres"
            onClick={fermerAvecSortie}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M5 5l14 14M19 5L5 19"
                fill="none"
                strokeWidth={2.6}
                strokeLinecap="round"
                style={{ stroke: 'var(--color-text)' }}
              />
            </svg>
          </button>
        </header>

        <div className={styles.corps}>
          <section className={styles.bloc} aria-labelledby={`${idTitre}-apparence`}>
            <h3 id={`${idTitre}-apparence`} className={styles.etiquette}>
              Apparence
            </h3>
            <div className={styles.cartes} role="radiogroup" aria-labelledby={`${idTitre}-apparence`}>
              {(['clair', 'sombre'] as const).map((t: Theme) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={theme === t}
                  className={`${styles.carteTheme} ${theme === t ? styles.choisie : ''}`}
                  onClick={() => {
                    definirTheme(t);
                  }}
                >
                  <span className={styles.pastilleIcone}>
                    <Icone
                      nom={t === 'clair' ? 'soleil' : 'lune'}
                      taille={22}
                      trait={2.4}
                      couleur="var(--color-hint-text)"
                    />
                  </span>
                  <span className={styles.nomTheme}>{t === 'clair' ? 'Clair' : 'Sombre'}</span>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.bloc} aria-labelledby={`${idTitre}-progression`}>
            <h3 id={`${idTitre}-progression`} className={styles.etiquette}>
              Ta progression
            </h3>
            <div className={styles.tuiles}>
              <div className={styles.tuile}>
                <strong className={styles.valeurBleue}>
                  {reussies} / {jouables}
                </strong>
                <span className={styles.legende}>missions réussies</span>
              </div>
              <div className={styles.tuile}>
                <strong className={styles.valeurOr}>{etoiles}</strong>
                <span className={styles.legende}>{pluriel(etoiles, 'étoile', 'étoiles')}</span>
              </div>
              <div className={styles.tuile}>
                <strong className={styles.valeurVerte}>
                  {maitrisees} / {notions.length}
                </strong>
                <span className={styles.legende}>
                  {pluriel(maitrisees, 'notion maîtrisée', 'notions maîtrisées')}
                </span>
              </div>
              <div className={styles.tuile}>
                <strong className={styles.valeurTexte}>{xp}</strong>
                <span className={styles.legende}>XP</span>
              </div>
            </div>
            <button type="button" className={styles.boutonContour} onClick={telecharger}>
              <Icone nom="telecharger" taille={20} trait={2.4} couleur="currentColor" />
              Exporter ma progression
            </button>
            <label className={`${styles.boutonContour} ${styles.label}`}>
              <Icone nom="televerser" taille={20} trait={2.4} couleur="currentColor" />
              Importer une progression
              <input
                type="file"
                accept="application/json,.json"
                className={styles.fichier}
                onChange={lireFichier}
              />
            </label>
            <p className={styles.legende}>
              Ta partie reste dans ce navigateur. Exporte-la pour la retrouver sur un autre ordinateur.
            </p>
            {message !== null && (
              <p role="status" className={styles.message}>
                {message}
              </p>
            )}
          </section>

          <section className={styles.bloc} aria-labelledby={`${idTitre}-recommencer`}>
            <h3 id={`${idTitre}-recommencer`} className={styles.etiquette}>
              Recommencer
            </h3>
            {etape === 0 && (
              <button
                type="button"
                className={styles.boutonDanger}
                onClick={() => {
                  setEtape(1);
                }}
              >
                Recommencer à zéro
              </button>
            )}
            {etape > 0 && (
              <div className={styles.confirmation}>
                <Mascotte expression="panique" taille={72} />
                <p className={styles.question}>
                  {etape === 1
                    ? 'Tu es sûr de vouloir tout recommencer ?'
                    : 'Tout effacer ? Cette action est définitive.'}
                </p>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.boutonContour}
                    onClick={() => {
                      setEtape(0);
                    }}
                  >
                    Annuler
                  </button>
                  {etape === 1 ? (
                    <button
                      type="button"
                      className={styles.boutonPlein}
                      onClick={() => {
                        setEtape(2);
                      }}
                    >
                      Oui
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.boutonPlein}
                      onClick={() => {
                        reinitialiser();
                        setEtape(0);
                        setMessage('Progression effacée. Le thème est conservé.');
                      }}
                    >
                      Tout effacer
                    </button>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className={styles.bloc} aria-labelledby={`${idTitre}-apropos`}>
            <h3 id={`${idTitre}-apropos`} className={styles.etiquette}>
              À propos
            </h3>
            <p className={styles.legende}>
              Branchés t’apprend Git avec de vraies commandes. Pas de compte : rien n’est envoyé sur Internet.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
