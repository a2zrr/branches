import { CHEMINS, type NomIcone } from './chemins';

export type { NomIcone };
interface IconeProps {
  nom: NomIcone;
  taille?: number;
  trait?: number;
  remplie?: boolean;
  couleur?: string;
}

export function Icone({
  nom,
  taille = 24,
  trait = 2.8,
  remplie = false,
  couleur = 'currentColor',
}: IconeProps) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill={remplie ? couleur : 'none'}
      stroke={couleur}
      strokeWidth={trait}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={CHEMINS[nom]} />
    </svg>
  );
}
