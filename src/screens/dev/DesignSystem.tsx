import { useState } from 'react';
import { Bouton, type VarianteBouton } from '../../components/ui/Bouton';
import { CarteChoix } from '../../components/ui/CarteChoix';
import { BulleMascotte } from '../../components/ui/BulleMascotte';
import { BarreProgression } from '../../components/ui/BarreProgression';
import { BandeauRetour } from '../../components/ui/BandeauRetour';
import { EnTeteChapitre } from '../../components/ui/EnTeteChapitre';
import { PastilleMission } from '../../components/ui/PastilleMission';
import { Compteur } from '../../components/ui/Compteur';
import { PuceNotion } from '../../components/ui/PuceNotion';
import { TonGit } from '../../components/ui/TonGit';
import { Badge } from '../../components/ui/Badge';
import { Logo } from '../../components/ui/Logo';
import { Mascotte } from '../../components/mascotte/Mascotte';
import type { ExpressionHedi } from '../../components/mascotte/types';
import { useProgression } from '../../game/store';
import type { Badge as DonneesBadge } from '../../game/types';
import badgesJson from '../../data/missions/badges.json';
import styles from './DesignSystem.module.css';

const BADGES = badgesJson as DonneesBadge[];
const ETATS_BOUTON = ['normal', 'survol', 'actif', 'désactivé', 'focus'] as const;
const VARIANTES: { nom: VarianteBouton; libelle: string }[] = [
  { nom: 'primaire', libelle: 'Vérifier' },
  { nom: 'secondaire', libelle: 'Passer' },
  { nom: 'danger', libelle: 'Compris' },
  { nom: 'indice', libelle: 'Indice' },
  { nom: 'succes', libelle: 'Continuer' },
];
const EXPRESSIONS: ExpressionHedi[] = ['accueillant', 'panique', 'pensif', 'fier'];

export function DesignSystem() {
  const theme = useProgression((etat) => etat.theme);
  const definirTheme = useProgression((etat) => etat.definirTheme);
  const [selection, setSelection] = useState(1);

  return (
    <main className={styles.page}>
      <header className={styles.entete}>
        <div className={styles.titreBloc}>
          <p className={styles.surtitre}>Design system</p>
          <h1 className={styles.titre}>Composants d&apos;interface</h1>
          <p className={styles.intro}>
            Chaque composant porte son nom React et les données qu&apos;il reçoit. Rien n&apos;est dessiné
            pour une mission précise.
          </p>
        </div>
        <div className={styles.outils}>
          <Logo taille="l" />
          <Bouton
            variante="secondaire"
            onClick={() => {
              definirTheme(theme === 'clair' ? 'sombre' : 'clair');
            }}
          >
            {theme === 'clair' ? 'Mode sombre' : 'Mode clair'}
          </Bouton>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="s-bouton">
        <h2 id="s-bouton" className={styles.h2}>
          Bouton
        </h2>
        <div className={styles.grilleBoutons}>
          <div className={styles.ligneBouton}>
            <span />
            {ETATS_BOUTON.map((etat) => (
              <span key={etat} className={styles.enTete}>
                {etat}
              </span>
            ))}
          </div>
          {VARIANTES.map((v) => (
            <div key={v.nom} className={styles.ligneBouton}>
              <code className={styles.code}>{v.nom}</code>
              {ETATS_BOUTON.map((etat) => (
                <div key={etat} className={styles.cellule}>
                  <Bouton
                    variante={v.nom}
                    desactive={etat === 'désactivé'}
                    etatApercu={
                      etat === 'survol'
                        ? 'survol'
                        : etat === 'actif'
                          ? 'actif'
                          : etat === 'focus'
                            ? 'focus'
                            : undefined
                    }
                  >
                    {v.libelle}
                  </Bouton>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.rangee}>
          <Bouton variante="primaire" taille="l">
            Vérifier (l)
          </Bouton>
          <Bouton variante="secondaire" taille="m">
            Réinitialiser
          </Bouton>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="s-carte">
        <h2 id="s-carte" className={styles.h2}>
          Carte de choix
        </h2>
        <div className={styles.grilleCartes}>
          <CarteChoix
            raccourci={1}
            titre="Garder ma version"
            description="On garde le code de HEAD."
            selectionnee={selection === 1}
            onSelect={() => {
              setSelection(1);
            }}
          />
          <CarteChoix
            raccourci={2}
            titre="Garder l'autre"
            description="On garde le code de la branche."
            selectionnee={selection === 2}
            onSelect={() => {
              setSelection(2);
            }}
          />
          <CarteChoix
            raccourci={3}
            titre="Garder les deux"
            description="À utiliser avec prudence."
            selectionnee={selection === 3}
            onSelect={() => {
              setSelection(3);
            }}
          />
          <CarteChoix
            raccourci={4}
            titre="Désactivée"
            description="Ne peut pas être choisie."
            selectionnee={false}
            desactivee
            onSelect={() => undefined}
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="s-mascotte">
        <h2 id="s-mascotte" className={styles.h2}>
          Mascotte : Hédi
        </h2>
        <div className={styles.grilleMascottes}>
          {EXPRESSIONS.map((expression) => (
            <figure key={expression} className={styles.figure}>
              <Mascotte expression={expression} taille={160} />
              <figcaption className={styles.legende}>{expression}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="s-bulle">
        <h2 id="s-bulle" className={styles.h2}>
          Bulle de la mascotte
        </h2>
        <BulleMascotte
          expression="panique"
          ton="histoire"
          texte="Bon. Quelqu'un a commité notre clé API sur main. La démo est dans deux heures."
        />
        <BulleMascotte
          expression="pensif"
          ton="indice"
          titre="Indice 1 sur 2"
          texte="Pour annuler sans toucher au passé, Git ajoute un commit qui fait l'inverse."
        />
        <BulleMascotte expression="fier" ton="reaction" texte="Je savais que tu étais la bonne recrue !" />
      </section>

      <section className={styles.section} aria-labelledby="s-barre">
        <h2 id="s-barre" className={styles.h2}>
          Barre de progression
        </h2>
        <BarreProgression valeur={4} max={6} etiquette="Mission 4 sur 6" />
        <BarreProgression valeur={4} max={12} etiquette="Commandes maîtrisées" />
        <BarreProgression valeur={6} max={6} etiquette="Chapitre terminé" />
      </section>

      <section className={styles.section} aria-labelledby="s-puce">
        <h2 id="s-puce" className={styles.h2}>
          Compteurs, puces et « Ton Git »
        </h2>
        <div className={styles.rangee}>
          <Compteur type="notions" valeur={3} total={12} />
          <Compteur type="xp" valeur={120} />
          <Compteur type="etoiles" valeur={8} total={18} />
        </div>
        <div className={styles.rangee}>
          <PuceNotion nom="git revert" etat="maitrisee" />
          <PuceNotion nom="git merge" etat="en-cours" />
          <PuceNotion nom="git bisect" etat="a-decouvrir" />
        </div>
        <TonGit
          notions={[
            { nom: 'git commit', etat: 'maitrisee' },
            { nom: 'git log', etat: 'maitrisee' },
            { nom: 'git switch', etat: 'maitrisee' },
            { nom: 'git revert', etat: 'en-cours' },
            { nom: 'git merge', etat: 'a-decouvrir' },
          ]}
        />
      </section>

      <section className={styles.section} aria-labelledby="s-bandeau">
        <h2 id="s-bandeau" className={styles.h2}>
          Bandeau de retour
        </h2>
        <BandeauRetour
          type="neutre"
          commandes={2}
          optimal={3}
          onAction={() => undefined}
          onReinitialiser={() => undefined}
        />
        <BandeauRetour
          type="reussi"
          message="La clé a disparu et l'historique est intact."
          onAction={() => undefined}
        />
        <BandeauRetour
          type="rate"
          message="Git ne connaît pas « rever ». Lis bien ce qu'il te suggère."
          onAction={() => undefined}
        />
      </section>

      <section className={styles.section} aria-labelledby="s-chapitre">
        <h2 id="s-chapitre" className={styles.h2}>
          En-tête de chapitre
        </h2>
        <EnTeteChapitre
          numero={1}
          titre="La veille de la démo"
          etat="ouvert"
          faites={3}
          total={6}
          etoiles={8}
          couleur="var(--color-primary)"
          couleurArete="var(--color-primary-edge)"
        />
        <EnTeteChapitre
          numero={2}
          titre="Le stagiaire a poussé sur main"
          etat="verrouille"
          faites={0}
          total={5}
          etoiles={0}
        />
        <EnTeteChapitre
          numero={4}
          titre="Bientôt disponible"
          etat="bientot"
          faites={0}
          total={0}
          etoiles={0}
        />
      </section>

      <section className={styles.section} aria-labelledby="s-pastille">
        <h2 id="s-pastille" className={styles.h2}>
          Pastille de mission
        </h2>
        <div className={styles.rangeePastilles}>
          <PastilleMission etat="verrouillee" etoiles={0} numero={5} titre="Fusionne avant 20 h" />
          <PastilleMission etat="disponible" etoiles={0} numero={6} titre="Le bug fantôme" />
          <PastilleMission
            etat="en-cours"
            etoiles={0}
            numero={4}
            titre="La clé qui fuit"
            onClick={() => undefined}
          />
          <PastilleMission etat="terminee" etoiles={1} numero={1} titre="Ton premier commit" />
          <PastilleMission etat="terminee" etoiles={2} numero={2} titre="Qui a cassé quoi ?" />
          <PastilleMission etat="terminee" etoiles={3} numero={3} titre="Une branche pour la démo" />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="s-badge">
        <h2 id="s-badge" className={styles.h2}>
          Badges
        </h2>
        <div className={styles.rangee}>
          {BADGES.map((badge, index) => (
            <Badge key={badge.id} badge={badge} debloque={index % 2 === 0} />
          ))}
        </div>
      </section>
    </main>
  );
}
