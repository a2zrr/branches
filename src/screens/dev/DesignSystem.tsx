import { Bouton, type VarianteBouton } from '../../components/ui/Bouton';
import { CarteChoix } from '../../components/ui/CarteChoix';
import { BulleMascotte } from '../../components/ui/BulleMascotte';
import { BarreProgression } from '../../components/ui/BarreProgression';
import { BandeauRetour } from '../../components/ui/BandeauRetour';
import { EnTeteChapitre } from '../../components/ui/EnTeteChapitre';
import { PastilleMission } from '../../components/ui/PastilleMission';
import { PuceNotion } from '../../components/ui/PuceNotion';
import { useProgression } from '../../game/store';
import type { ReactNode } from 'react';
import styles from './DesignSystem.module.css';

const ETATS_BOUTON = ['normal', 'survol', 'actif', 'désactivé', 'focus'] as const;
const VARIANTES: { nom: VarianteBouton; libelle: string }[] = [
  { nom: 'primaire', libelle: 'Vérifier' },
  { nom: 'secondaire', libelle: 'Passer' },
  { nom: 'danger', libelle: 'Compris' },
  { nom: 'indice', libelle: 'Indice' },
];

/** Section de la page : titre à gauche, signature du composant (props) à droite. */
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

/** Page design system (maquette Composants.png) : chaque composant dans ses états. */
export function DesignSystem() {
  const theme = useProgression((etat) => etat.theme);
  const definirTheme = useProgression((etat) => etat.definirTheme);

  return (
    <main className={styles.page}>
      <div className={styles.conteneur}>
        <header className={styles.entete}>
          <p className={styles.surtitre}>2 · Design system</p>
          <h1 className={styles.titre}>Composants d&apos;interface</h1>
          <p className={styles.intro}>
            Chaque composant porte son nom React et les données qu&apos;il reçoit. Rien n&apos;est dessiné
            pour une mission précise.
          </p>
          <div>
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

        <Section
          id="s-bouton"
          titre="Bouton"
          signature='<Bouton variante="primaire|secondaire|danger|indice" taille="m|l" desactive icone onClick>'
        >
          <div className={styles.grilleBoutons}>
            <div className={styles.ligneBouton}>
              <span />
              {ETATS_BOUTON.map((etat) => (
                <span key={etat} className={styles.legende}>
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
          <div className={styles.essai}>
            <strong>Essaie-les :</strong>
            <Bouton variante="primaire">Vérifier</Bouton>
            <Bouton variante="secondaire">Passer</Bouton>
            <Bouton variante="danger">Compris</Bouton>
            <Bouton variante="indice">Indice</Bouton>
            <Bouton variante="primaire" desactive>
              Vérifier
            </Bouton>
            <span className={styles.note}>Survol : −2 px, bord 6 px · Clic : +4 px, bord 0 · 60 ms</span>
          </div>
        </Section>

        <Section
          id="s-carte"
          titre="Carte de choix"
          signature="<CarteChoix raccourci titre description selectionnee desactivee onSelect>"
        >
          <div className={styles.grilleCartes}>
            {[
              { etat: 'NORMAL', props: {} },
              { etat: 'SURVOL', props: { etatApercu: 'survol' as const } },
              { etat: 'SÉLECTIONNÉE', props: { selectionnee: true } },
              { etat: 'DÉSACTIVÉE', props: { desactivee: true } },
              { etat: 'FOCUS', props: { etatApercu: 'focus' as const } },
            ].map((c) => (
              <div key={c.etat} className={styles.colonneCarte}>
                <CarteChoix
                  raccourci={1}
                  titre="Garder ma version"
                  description="On garde le code de HEAD."
                  selectionnee={c.props.selectionnee === true}
                  desactivee={c.props.desactivee === true}
                  etatApercu={c.props.etatApercu}
                  onSelect={() => undefined}
                />
                <span className={styles.legende}>{c.etat}</span>
              </div>
            ))}
          </div>
        </Section>

        <div className={styles.deux}>
          <Section
            id="s-bulle"
            titre="Bulle de la mascotte"
            signature='<BulleMascotte expression ton="histoire|indice|reaction" titre texte>'
          >
            <div className={styles.pile}>
              <BulleMascotte
                expression="panique"
                ton="histoire"
                titre="Histoire"
                texte="Bon. Quelqu’un a commité notre clé API sur main. La démo est dans deux heures."
              />
              <BulleMascotte
                expression="pensif"
                ton="indice"
                titre="Indice 1 sur 2"
                texte="Pour annuler sans toucher au passé, Git ajoute un commit qui fait l’inverse."
              />
              <BulleMascotte
                expression="fier"
                ton="reaction"
                titre="Réaction"
                texte="Je savais que tu étais la bonne recrue !"
              />
            </div>
          </Section>

          <Section
            id="s-barre"
            titre="Barre de progression"
            signature="<BarreProgression valeur max etiquette>"
          >
            <div className={styles.pile}>
              <BarreProgression valeur={3} max={6} etiquette="Mission 4 sur 6" />
              <BarreProgression valeur={4} max={12} etiquette="Commandes maîtrisées" libelleValeur="4 / 12" />
              <BarreProgression valeur={6} max={6} etiquette="Chapitre terminé" />
            </div>
            <p className={styles.note}>
              La largeur s’anime en 600 ms (--ease-bounce). À 100 % : la barre passe au jaune et pulse une
              fois.
            </p>
            <h3 className={styles.h3}>Puce de commande</h3>
            <div className={styles.puces}>
              <PuceNotion nom="git revert" etat="maitrisee" />
              <PuceNotion nom="git merge" etat="en-cours" />
              <PuceNotion nom="git bisect" etat="a-decouvrir" />
            </div>
          </Section>
        </div>

        <Section
          id="s-bandeau"
          titre="Bandeau de retour"
          signature='<BandeauRetour type="neutre|reussi|rate" titre message commandes optimal action onAction>'
        >
          <div className={styles.pile}>
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
          </div>
          <p className={styles.note}>
            Entrée : translateY 100 % → 0 en 250 ms (--ease-out), puis l’icône rebondit (scale 0,6 → 1,1 → 1).
            Le bandeau raté secoue de ±6 px deux fois.
          </p>
        </Section>

        <div className={styles.deux}>
          <Section
            id="s-chapitre"
            titre="En-tête de chapitre"
            signature='<EnTeteChapitre numero titre etat="ouvert|verrouille|bientot" faites total etoiles couleur>'
          >
            <div className={styles.pile}>
              <EnTeteChapitre
                numero={1}
                titre="La veille de la démo"
                sousTitre="Le projet est cassé, la démo est ce soir."
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
                sousTitre=""
                etat="verrouille"
                faites={0}
                total={5}
                etoiles={0}
              />
              <EnTeteChapitre
                numero={4}
                titre="Bientôt disponible"
                sousTitre=""
                etat="bientot"
                faites={0}
                total={0}
                etoiles={0}
              />
            </div>
          </Section>

          <Section
            id="s-pastille"
            titre="Pastille de mission"
            signature='<PastilleMission etat="verrouillee|disponible|en-cours|terminee" etoiles numero titre onClick>'
          >
            <div className={styles.pastilles}>
              <PastilleMission etat="verrouillee" etoiles={0} numero={5} titre="Verrouillée" />
              <PastilleMission etat="disponible" etoiles={0} numero={6} titre="Disponible" />
              <PastilleMission
                etat="en-cours"
                etoiles={0}
                numero={4}
                titre="En cours"
                onClick={() => undefined}
              />
              <PastilleMission etat="terminee" etoiles={1} numero={1} titre="Terminée ★" />
              <PastilleMission etat="terminee" etoiles={2} numero={2} titre="Terminée ★★" />
              <PastilleMission etat="terminee" etoiles={3} numero={3} titre="Terminée ★★★" />
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
