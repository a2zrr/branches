import { useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Icone, type NomIcone } from '../ui/Icone';
import { Mascotte } from '../mascotte/Mascotte';
import { MISSIONS } from '../../game/missions';
import { useProgression, type Theme } from '../../game/store';
import { useInterface } from '../../game/ui';
import { estJouable, notionsTonGit } from '../../game/regles';
import { pluriel } from '../../game/pluriel';
import { routeur } from '../../routes';
import styles from './FenetreParametres.module.css';

/** Fenêtre Paramètres (correctif 4) : centrée, elle s'ouvre en pop par-dessus la page. */
export function FenetreParametres() {
  const ouvert = useInterface((s) => s.parametresOuverts);
  if (!ouvert) return null;
  return <FenetreOuverte />;
}

const THEMES: { valeur: Theme; libelle: string; icone: NomIcone }[] = [
  { valeur: 'clair', libelle: 'Clair', icone: 'soleil' },
  { valeur: 'sombre', libelle: 'Sombre', icone: 'lune' },
  { valeur: 'auto', libelle: 'Auto', icone: 'ecran' },
];

/** Mini-aperçu de la carte dans chaque thème ; « Auto » = clair coupé en diagonale par sombre. */
function Apercu({ valeur }: { valeur: Theme }) {
  const fond =
    valeur === 'clair'
      ? 'var(--apercu-clair)'
      : valeur === 'sombre'
        ? 'var(--apercu-sombre)'
        : 'linear-gradient(135deg, var(--apercu-clair) 50%, var(--apercu-sombre) 50%)';
  return (
    <span className={styles.apercu} style={{ background: fond }} aria-hidden="true">
      <span className={styles.apercuBarre} />
      <span className={styles.apercuPoint} />
    </span>
  );
}

function FenetreOuverte() {
  const fermer = useInterface((s) => s.fermerParametres);
  const theme = useProgression((s) => s.theme);
  const definirTheme = useProgression((s) => s.definirTheme);
  const progression = useProgression((s) => s.progression);
  const exporter = useProgression((s) => s.exporter);
  const importer = useProgression((s) => s.importer);
  const reinitialiser = useProgression((s) => s.reinitialiser);
  const [sortie, setSortie] = useState(false);
  // « Tout effacer ? » : boîte de dialogue dans la fenêtre ; la fenêtre reste ouverte.
  const [confirmation, setConfirmation] = useState(false);
  const recommencer = useRef<HTMLButtonElement>(null);
  const annuler = useRef<HTMLButtonElement>(null);
  const idAlerte = useId();
  const [message, setMessage] = useState<string | null>(null);
  const panneau = useRef<HTMLDivElement>(null);
  const idTitre = useId();

  const reussies = MISSIONS.filter((m) => estJouable(m) && progression[m.id]?.reussie === true).length;
  const jouables = MISSIONS.filter(estJouable).length;
  const etoiles = Object.values(progression).reduce((s, r) => s + r.etoiles, 0);
  const notions = notionsTonGit(MISSIONS, progression, null);
  const maitrisees = notions.filter((n) => n.etat === 'maitrisee').length;
  const xp = Object.values(progression).reduce((s, r) => s + r.etoiles * 10, 0);

  // Fermeture avec la sortie animée (160 ms), puis démontage.
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

  // Quand la confirmation s'ouvre, le focus va sur ANNULER.
  useEffect(() => {
    if (confirmation) annuler.current?.focus();
  }, [confirmation]);

  const fermerConfirmation = () => {
    setConfirmation(false);
    window.setTimeout(() => {
      recommencer.current?.focus();
    }, 0);
  };

  // OUI : efface la progression, ferme la fenêtre et revient à l'accueil.
  const toutEffacer = () => {
    reinitialiser();
    fermer();
    void routeur.navigate('/');
  };

  // Échap ne ferme que la confirmation si elle est ouverte ; sinon la fenêtre. Tab reste dans la fenêtre.
  useEffect(() => {
    const clavier = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmation) fermerConfirmation();
        else fermerAvecSortie();
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

  // Groupe radio : les flèches changent de thème et déplacent le focus.
  const naviguerThemes = (e: KeyboardEvent<HTMLDivElement>) => {
    const index = THEMES.findIndex((t) => t.valeur === theme);
    const pas = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (pas === 0) return;
    e.preventDefault();
    const suivant = THEMES[(index + pas + THEMES.length) % THEMES.length];
    if (suivant === undefined) return;
    definirTheme(suivant.valeur);
    const boutons = e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]');
    boutons[THEMES.indexOf(suivant)]?.focus();
  };

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
          <div className={styles.hedi}>
            <Mascotte expression="accueillant" taille={78} />
          </div>
          <div className={styles.titres}>
            <h2 id={idTitre} className={styles.titre}>
              Paramètres
            </h2>
            <p className={styles.sousTitre}>Ton thème, ta partie, tes sauvegardes.</p>
          </div>
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

        <div className={styles.zoneCorps}>
        <div className={styles.corps}>
          <section className={styles.bloc} aria-labelledby={`${idTitre}-apparence`}>
            <h3 id={`${idTitre}-apparence`} className={styles.etiquette}>
              Apparence
            </h3>
            <div
              className={styles.cartes}
              role="radiogroup"
              tabIndex={-1}
              aria-labelledby={`${idTitre}-apparence`}
              onKeyDown={naviguerThemes}
            >
              {THEMES.map((t) => {
                const choisi = theme === t.valeur;
                return (
                  <button
                    key={t.valeur}
                    type="button"
                    role="radio"
                    aria-checked={choisi}
                    tabIndex={choisi ? 0 : -1}
                    className={`${styles.carteTheme} ${choisi ? styles.choisie : ''}`}
                    onClick={() => {
                      definirTheme(t.valeur);
                    }}
                  >
                    <Apercu valeur={t.valeur} />
                    <span className={styles.ligneTheme}>
                      <span className={styles.rond} aria-hidden="true">
                        {choisi && <Icone nom="coche" taille={14} trait={3} couleur="var(--color-on-primary)" />}
                      </span>
                      <span className={styles.nomTheme}>{t.libelle}</span>
                      <Icone nom={t.icone} taille={20} trait={2.2} couleur="var(--color-text-muted)" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={styles.bloc} aria-labelledby={`${idTitre}-progression`}>
            <h3 id={`${idTitre}-progression`} className={styles.etiquette}>
              Ta progression
            </h3>
            <div className={styles.tuiles}>
              <div className={styles.tuile}>
                <span className={`${styles.pastilleIcone} ${styles.pInfo}`} aria-hidden="true">
                  <Icone nom="drapeau" taille={20} trait={2.4} couleur="var(--color-info)" />
                </span>
                <span className={styles.valeur}>
                  {reussies} / {jouables}
                </span>
                <span className={styles.libelle}>missions</span>
              </div>
              <div className={styles.tuile}>
                <span className={`${styles.pastilleIcone} ${styles.pOr}`} aria-hidden="true">
                  <Icone nom="etoile" taille={20} trait={1.5} remplie couleur="var(--color-hint)" />
                </span>
                <span className={styles.valeur}>{etoiles}</span>
                <span className={styles.libelle}>{pluriel(etoiles, 'étoile', 'étoiles')}</span>
              </div>
              <div className={styles.tuile}>
                <span className={`${styles.pastilleIcone} ${styles.pVert}`} aria-hidden="true">
                  <Icone nom="cadreTerminal" taille={20} trait={2.4} couleur="var(--color-success-text)" />
                </span>
                <span className={styles.valeur}>
                  {maitrisees} / {notions.length}
                </span>
                <span className={styles.libelle}>notions</span>
              </div>
              <div className={styles.tuile}>
                <span className={`${styles.pastilleIcone} ${styles.pOr}`} aria-hidden="true">
                  <Icone nom="eclair" taille={20} trait={2} remplie couleur="var(--color-hint)" />
                </span>
                <span className={styles.valeur}>{xp}</span>
                <span className={styles.libelle}>XP</span>
              </div>
            </div>
          </section>

          <section className={styles.bloc} aria-labelledby={`${idTitre}-sauvegarde`}>
            <h3 id={`${idTitre}-sauvegarde`} className={styles.etiquette}>
              Sauvegarde
            </h3>
            <div className={styles.carte}>
              <div className={styles.enteteCarte}>
                <span className={`${styles.pastilleIcone} ${styles.pInfo}`} aria-hidden="true">
                  <Icone nom="disquette" taille={20} trait={2.2} couleur="var(--color-info)" />
                </span>
                <p className={styles.texteCarte}>
                  <strong>Ta partie reste dans ce navigateur.</strong> Exporte-la pour la retrouver sur un autre
                  appareil.
                </p>
              </div>
              <div className={styles.duo}>
                <button type="button" className={styles.boutonContour} onClick={telecharger}>
                  <Icone nom="telecharger" taille={20} trait={2.4} couleur="currentColor" />
                  Exporter
                </button>
                <label className={`${styles.boutonContour} ${styles.label}`}>
                  <Icone nom="televerser" taille={20} trait={2.4} couleur="currentColor" />
                  Importer
                  <input
                    type="file"
                    accept="application/json,.json"
                    className={styles.fichier}
                    onChange={lireFichier}
                  />
                </label>
              </div>
            </div>
            {message !== null && (
              <p role="status" className={styles.message}>
                {message}
              </p>
            )}
          </section>

          <section className={styles.bloc} aria-labelledby={`${idTitre}-recommencer`}>
            <div className={`${styles.carte} ${styles.carteDanger}`}>
              <div className={styles.enteteCarte}>
                <span className={`${styles.pastilleIcone} ${styles.pDanger}`} aria-hidden="true">
                  <Icone nom="refaire" taille={20} trait={2.4} couleur="var(--color-danger-text)" />
                </span>
                <div className={styles.texteCarte}>
                  <h3 id={`${idTitre}-recommencer`} className={styles.titreCarte}>
                    Recommencer à zéro
                  </h3>
                  <p className={styles.legende}>Efface ta progression sur cet appareil.</p>
                </div>
                <button
                  ref={recommencer}
                  type="button"
                  className={styles.boutonDanger}
                  onClick={() => {
                    setConfirmation(true);
                  }}
                >
                  Recommencer
                </button>
              </div>
            </div>
          </section>
          </div>

          {confirmation && (
            <div
              className={styles.alerte}
              role="alertdialog"
              aria-labelledby={`${idAlerte}-titre`}
              aria-describedby={`${idAlerte}-texte`}
            >
              <Mascotte expression="panique" taille={112} />
              <h3 id={`${idAlerte}-titre`} className={styles.titreAlerte}>
                Tout effacer ?
              </h3>
              <p id={`${idAlerte}-texte`} className={styles.texteAlerte}>
                Tes {reussies} {pluriel(reussies, 'mission réussie', 'missions réussies')}, tes {etoiles}{' '}
                {pluriel(etoiles, 'étoile', 'étoiles')} et tes {xp} XP seront perdus. Exporte d’abord ta
                progression si tu veux la garder.
              </p>
              <div className={styles.boutonsAlerte}>
                <button
                  ref={annuler}
                  type="button"
                  className={styles.boutonContour}
                  onClick={fermerConfirmation}
                >
                  Annuler
                </button>
                <button type="button" className={styles.boutonPlein} onClick={toutEffacer}>
                  Oui, tout effacer
                </button>
              </div>
              <button type="button" className={styles.lienExport} onClick={telecharger}>
                <Icone nom="telecharger" taille={18} trait={2.4} couleur="currentColor" />
                Exporter d’abord ma progression
              </button>
            </div>
          )}

        </div>

        <footer className={styles.pied}>
          <p className={styles.legende}>
            Branchés t’apprend Git avec de vraies commandes. Pas de compte, rien n’est envoyé sur Internet.
          </p>
          <span className={styles.version}>v1.0</span>
        </footer>
      </div>
    </div>
  );
}
