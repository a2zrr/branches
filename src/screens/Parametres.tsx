import { useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { Bouton } from '../components/ui/Bouton';
import { Modale } from '../components/ui/Modale';
import { PiedPage } from '../components/ui/PiedPage';
import { useProgression, type Theme } from '../game/store';
import styles from './Parametres.module.css';

export function Parametres() {
  const theme = useProgression((s) => s.theme);
  const definirTheme = useProgression((s) => s.definirTheme);
  const exporter = useProgression((s) => s.exporter);
  const importer = useProgression((s) => s.importer);
  const reinitialiser = useProgression((s) => s.reinitialiser);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  const choisirTheme = (t: Theme) => {
    definirTheme(t);
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
    <div className={styles.page}>
      <main className={styles.principal}>
        <h1 className={styles.titre}>Paramètres</h1>

        <section className={styles.section} aria-labelledby="s-theme">
          <h2 id="s-theme" className={styles.h2}>
            Thème
          </h2>
          <div className={styles.rangee} role="group" aria-label="Choisir le thème">
            <Bouton
              variante="secondaire"
              onClick={() => {
                choisirTheme('clair');
              }}

              aria-pressed={theme === 'clair'}
            >
              Clair
            </Bouton>
            <Bouton
              variante="secondaire"
              onClick={() => {
                choisirTheme('sombre');
              }}
              aria-pressed={theme === 'sombre'}
            >
              Sombre
            </Bouton>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="s-sauvegarde">
          <h2 id="s-sauvegarde" className={styles.h2}>
            Sauvegarde
          </h2>
          <p className={styles.legende}>
            Ta partie est enregistrée dans ce navigateur. Exporte-la pour la retrouver sur un autre
            navigateur.
          </p>
          <div className={styles.rangee}>
            <Bouton variante="primaire" onClick={telecharger}>
              Exporter
            </Bouton>
            <label className={styles.importer}>
              <span>Importer</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={lireFichier}
                className={styles.fichier}
              />
            </label>
          </div>
          {message !== null && (
            <p role="status" className={styles.message}>
              {message}
            </p>
          )}
        </section>

        <section className={styles.section} aria-labelledby="s-reinitialiser">
          <h2 id="s-reinitialiser" className={styles.h2}>
            Réinitialiser
          </h2>
          <p className={styles.legende}>
            Efface ta progression : missions, étoiles et XP. Le thème est conservé.
          </p>
          <div>
            <Bouton
              variante="danger"
              onClick={() => {
                setConfirmation(true);
              }}
            >
              Réinitialiser
            </Bouton>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="s-apropos">
          <h2 id="s-apropos" className={styles.h2}>
            À propos
          </h2>
          <p className={styles.legende}>
            Branchés est un jeu pour apprendre Git en sauvant la démo de Pivot &amp; Co. Aucun compte, aucun
            serveur : tout reste dans ton navigateur.
          </p>
          <Link to="/carte" className={styles.lien}>
            Retour à la carte
          </Link>
        </section>
      </main>

      {confirmation && (
        <Modale
          titre="Tout effacer ?"
          libelleConfirmer="Réinitialiser"
          variante="danger"
          onConfirmer={() => {
            reinitialiser();
            setConfirmation(false);
            setMessage('Progression réinitialisée.');
          }}
          onAnnuler={() => {
            setConfirmation(false);
          }}
        >
          <p>Ta progression sera perdue. Pense à l’exporter si tu veux la garder.</p>
        </Modale>
      )}

      <PiedPage />
    </div>
  );
}
