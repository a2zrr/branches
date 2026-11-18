import { useEffect } from 'react';
import { Navigate } from 'react-router';
import { useInterface } from '../game/ui';

/** Ancienne adresse /parametres : ouvre le panneau latéral sur l'accueil, sans rester sur cette adresse. */
export function OuvrirParametres() {
  const ouvrir = useInterface((s) => s.ouvrirParametres);
  useEffect(() => {
    ouvrir();
  }, [ouvrir]);
  return <Navigate to="/" replace />;
}
