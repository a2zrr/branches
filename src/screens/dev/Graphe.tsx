import { useMemo, useState } from 'react';
import { GrapheCommits } from '../../components/graphe/GrapheCommits';
import { Bouton } from '../../components/ui/Bouton';
import { useProgression } from '../../game/store';
import { jeuxGraphe, type JeuGraphe } from './jeuxGraphe';
import { SectionsSysteme } from './GrapheSysteme';
import styles from './Graphe.module.css';

const DELAI_ETAPE_MS = 900;

/** Page de développement : jeux de données du graphe, avec un bouton qui rejoue les animations. */
export function Graphe() {
  const theme = useProgression((etat) => etat.theme);
  const definirTheme = useProgression((etat) => etat.definirTheme);
  const jeux = useMemo(() => jeuxGraphe(), []);
  const [etape, setEtape] = useState<Record<string, number>>({});
  const [selection, setSelection] = useState<Record<string, string>>({});

  const rejouer = (jeu: JeuGraphe) => {
    setEtape((e) => ({ ...e, [jeu.id]: 0 }));
    jeu.etapes.forEach((_, i) => {
      if (i === 0) return;
      window.setTimeout(() => {
        setEtape((e) => ({ ...e, [jeu.id]: i }));
      }, DELAI_ETAPE_MS * i);
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.entete}>
        <h1 className={styles.titre}>Graphe des commits</h1>
        <p className={styles.intro}>
          Jeux de données pour vérifier le placement, les états et les animations.
        </p>
        <Bouton
          variante="secondaire"
          onClick={() => {
            definirTheme(theme === 'clair' ? 'sombre' : 'clair');
          }}
        >
          {theme === 'clair' ? 'Mode sombre' : 'Mode clair'}
        </Bouton>
      </header>

      <SectionsSysteme />

      {jeux.map((jeu) => {
        const courante = etape[jeu.id] ?? jeu.etapes.length - 1;
        const base = jeu.etapes[courante] ?? jeu.etapes[0];
        const donnees =
          base === undefined ? undefined : { ...base, vue: { ...base.vue, selection: selection[jeu.id] } };
        return (
          <section key={jeu.id} className={styles.section} aria-labelledby={`titre-${jeu.id}`}>
            <div className={styles.entete2}>
              <div>
                <h2 id={`titre-${jeu.id}`} className={styles.h2}>
                  {jeu.titre}
                </h2>
                <p className={styles.description}>{jeu.description}</p>
              </div>
              <Bouton
                variante="primaire"
                onClick={() => {
                  rejouer(jeu);
                }}
              >
                Rejouer l’animation
              </Bouton>
            </div>
            {donnees !== undefined && (
              <GrapheCommits
                donnees={donnees}
                theme={theme}
                hauteur={jeu.id === 'genere-30' ? 560 : 420}
                onSelect={(id) => {
                  setSelection((sel) => ({ ...sel, [jeu.id]: id }));
                }}
              />
            )}
          </section>
        );
      })}
    </main>
  );
}
