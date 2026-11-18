import { NoeudCommit } from '../../components/graphe/NoeudCommit';
import { LienCommit } from '../../components/graphe/LienCommit';
import { GrapheCommits } from '../../components/graphe/GrapheCommits';
import { EtiquetteBranche, EtiquetteHead, EtiquetteTag, Puce } from '../../components/graphe/Etiquettes';
import { cheminLien, type DonneesGraphe, type LienG, type NoeudG } from '../../components/graphe/layout';
import styles from './GrapheSysteme.module.css';
import type { ReactNode } from 'react';

/** Un nœud isolé de la galerie, avec son étiquette d'état dessous. */
function Cellule({
  noeud,
  legende,
  texte,
  anneauHead = false,
}: {
  noeud: NoeudG;
  legende: string;
  texte: string;
  anneauHead?: boolean;
}) {
  return (
    <div className={styles.carte}>
      <svg width="120" height="110" viewBox="0 0 120 110" aria-hidden="true" focusable="false">
        <line
          x1={60}
          y1={10}
          x2={60}
          y2={100}
          strokeWidth={4}
          strokeLinecap="round"
          style={{ stroke: 'var(--branch-1)' }}
        />
        {anneauHead && (
          <circle
            cx={60}
            cy={50}
            r={17.5}
            fill="none"
            strokeWidth={3}
            style={{ stroke: 'var(--color-text)' }}
          />
        )}
        <NoeudCommit noeud={{ ...noeud, x: 60, y: 50 }} nouveau={false} />
      </svg>
      <strong className={styles.titreCarte}>{legende}</strong>
      <span className={styles.texteCarte}>{texte}</span>
    </div>
  );
}

const base = {
  id: 'n',
  x: 60,
  y: 50,
  forme: 'cercle' as const,
  couleur: 1,
  evide: false,
  tirets: 'none',
  type: 'normal' as const,
  R: 11,
  annule: false,
  etat: 'normal' as const,
};

function Section({
  id,
  titre,
  signature,
  children,
}: {
  id: string;
  titre: string;
  signature: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <header className={styles.sEntete}>
        <h2 id={id} className={styles.h2}>
          {titre}
        </h2>
        <code className={styles.signature}>{signature}</code>
      </header>
      {children}
    </section>
  );
}

/** Données du graphe « en action » : 4 branches, une fusion, un tag et une session bisect en cours. */
const EN_ACTION: DonneesGraphe = {
  branches: [
    { nom: 'main', pointe: 'f00ba12' },
    { nom: 'feature/paiement', pointe: 'b2c3d4e' },
    { nom: 'fix/cle-api', pointe: 'c0ffee1' },
    { nom: 'hotfix/demo', pointe: 'e1e2e3e' },
  ],
  commits: [
    { id: '1a2b3c4', message: 'init: premier commit', branche: 'main', parents: [] },
    { id: '5d6e7f8', message: "ajoute la page d'accueil", branche: 'main', parents: ['1a2b3c4'] },
    {
      id: '7c1d2e3',
      message: 'paiement: formulaire carte',
      branche: 'feature/paiement',
      parents: ['5d6e7f8'],
    },
    { id: '9b8c7d6', message: 'fix final v3 (le vrai)', branche: 'main', parents: ['5d6e7f8'] },
    {
      id: 'c0ffee1',
      message: 'fix: retire la clé API du code',
      branche: 'fix/cle-api',
      parents: ['9b8c7d6'],
    },
    {
      id: 'e1e2e3e',
      message: 'hotfix: le bouton ne clignote plus',
      branche: 'hotfix/demo',
      parents: ['9b8c7d6'],
    },
    {
      id: 'd4e5f6a',
      message: "Merge branch 'fix/cle-api'",
      branche: 'main',
      parents: ['9b8c7d6', 'c0ffee1'],
    },
    {
      id: 'b2c3d4e',
      message: 'paiement: ça marche chez moi',
      branche: 'feature/paiement',
      parents: ['7c1d2e3'],
    },
    { id: 'f00ba12', message: 'style: bouton de démo plus gros', branche: 'main', parents: ['d4e5f6a'] },
  ],
  head: { branche: 'main' },
  tags: [{ nom: 'v0.1', commit: '5d6e7f8' }],
  vue: { bisect: { bons: ['5d6e7f8'], mauvais: ['f00ba12'], test: 'd4e5f6a' } },
};

/** Sections de la maquette GrapheSysteme.png, en tête de la page de développement. */
export function SectionsSysteme() {
  const etats: { legende: string; texte: string; noeud: Partial<NoeudG>; anneau?: boolean }[] = [
    { legende: 'Normal', texte: 'Forme et couleur de la branche, bord foncé 3 px', noeud: {} },
    { legende: 'Sélectionné', texte: 'Anneau bleu focus, rangée bleu pâle', noeud: { etat: 'selection' } },
    { legende: 'HEAD', texte: 'Anneau couleur du texte, 3 px', noeud: {}, anneau: true },
    { legende: 'Nouveau', texte: "Halo vert qui s'éteint en 900 ms", noeud: { etat: 'nouveau' } },
    { legende: 'Fusion', texte: 'Plus grand (r 13,5) + icône de fusion', noeud: { type: 'fusion', R: 13.5 } },
    { legende: 'Revert', texte: 'Plus grand + flèche de retour', noeud: { type: 'revert', R: 13.5 } },
    {
      legende: 'Annulé',
      texte: 'Évidé, contour en pointillés',
      noeud: { annule: true, evide: true, tirets: '4 4' },
    },
    {
      legende: 'Bisect bon / mauvais',
      texte: 'Badge vert ✓ ou rouge ✕ en haut à droite',
      noeud: { bisect: 'mauvais' },
    },
    { legende: 'Bisect à tester', texte: 'Badge jaune ? + pulsation', noeud: { bisect: 'test' } },
  ];

  return (
    <>
      <Section
        id="sys-noeud"
        titre="Nœud de commit"
        signature='<NoeudCommit forme couleur etat="normal|selection|head|nouveau" type="normal|fusion|revert" annule bisect="bon|mauvais|test">'
      >
        <div className={styles.grilleEtats}>
          {etats.map((e) => (
            <Cellule
              key={e.legende}
              noeud={{ ...base, ...e.noeud }}
              legende={e.legende}
              texte={e.texte}
              anneauHead={e.anneau === true}
            />
          ))}
        </div>
      </Section>

      <div className={styles.deux}>
        <Section
          id="sys-etiquettes"
          titre="Étiquettes"
          signature="<EtiquetteBranche nom index> · <EtiquetteHead detache> · <EtiquetteTag nom> · <Puce libelle ton>"
        >
          <div className={styles.etiquettes}>
            <EtiquetteHead nom="HEAD →" />
            <EtiquetteBranche nom="main" index={0} />
            <EtiquetteBranche nom="feature/paiement" index={1} />
            <EtiquetteBranche nom="fix/cle-api" index={2} />
            <EtiquetteBranche nom="hotfix/demo" index={3} />
            <EtiquetteTag nom="v1.0" />
            <Puce libelle="nouveau" ton="ok" />
            <Puce libelle="annulé par f0e1d2c" ton="ko" />
            <Puce libelle="bon" ton="ok" />
            <Puce libelle="mauvais" ton="ko" />
            <Puce libelle="à tester" ton="indice" />
          </div>
          <p className={styles.note}>
            Branche : pastille pleine, forme de la branche + nom. HEAD : pastille foncée « HEAD → » collée à
            sa branche, « HEAD » seul si détaché. Tag : contour jaune et icône étiquette.
          </p>
        </Section>

        <Section
          id="sys-liens"
          titre="Liens entre commits"
          signature="<LienCommit de vers type couleur motif>"
        >
          <div className={styles.liens}>
            {(
              [
                ['Même branche', 'droit', 1, 'none'],
                ['Départ', 'depart', 2, 'none'],
                ['Fusion', 'fusion', 3, 'none'],
                ['7e à 12e', 'droit', 4, '7 6'],
                ['13e à 18e', 'droit', 5, '2 7'],
              ] as const
            ).map(([legende, type, couleur, tirets]) => {
              const lien: LienG = {
                de: 'a',
                vers: 'b',
                type: type === 'droit' ? 'droit' : type,
                chemin: cheminLien(
                  type === 'droit' ? 'droit' : type,
                  20,
                  10,
                  type === 'droit' ? 20 : 80,
                  110,
                ),
                couleur,
                tirets,
              };
              return (
                <div key={legende} className={styles.lien}>
                  <svg width="100" height="120" viewBox="0 0 100 120" aria-hidden="true" focusable="false">
                    <LienCommit lien={lien} trace={false} />
                  </svg>
                  <span className={styles.legende}>{legende}</span>
                </div>
              );
            })}
          </div>
          <p className={styles.note}>
            Trait 4 px, bouts ronds. La couleur est celle de la colonne parcourue.
          </p>
        </Section>
      </div>

      <>
        <Section
          id="sys-action"
          titre="<GrapheCommits> en action"
          signature="4 branches, une fusion, un tag, une session bisect en cours."
        >
          <div className={styles.action}>
            <GrapheCommits donnees={EN_ACTION} hauteur={600} />
          </div>
        </Section>
        <Section id="sys-donnees" titre="Données reçues" signature="donnees, theme, hauteur, onSelect">
          <pre
            className={styles.code}
          >{`<GrapheCommits donnees={donnees} theme="clair|sombre" hauteur={520} />

donnees = {
  branches: [{ nom, pointe }],     // ordre = colonnes
  commits: [{ id, message, branche, parents, type?, annule? }],
  head: { branche } | { commit },
  tags?: [{ nom, commit }],
  vue?: { nouveau?, selection?, bisect?: { bons, mauvais, test } }
}`}</pre>
          <p className={styles.note}>
            Placement : colonne = index de la branche. x = 26 + colonne × 34 ; y = rang × 50 + 25.
          </p>
        </Section>
      </>
    </>
  );
}
