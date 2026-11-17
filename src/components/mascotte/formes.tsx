// Formes SVG de Hédi, reprises de design/assets/hedi-*.svg (viewBox 0 0 200 200).
// Exception autorisée au test « aucune couleur en dur » : ce fichier contient les couleurs de la mascotte.
import type { ReactNode } from 'react';
import type { ExpressionHedi } from './types';

const BLEU_FONCE = '#1689C7';
const BLEU_CLAIR = '#22A8F0';
const OMBRE = '#3C3C3C';
const ORANGE = '#FF9600';
const ROUGE = '#C62828';
const ROUGE_CLAIR = '#FF5A5A';
const ROSE = '#FF8FA8';
const BLANC = '#FFFFFF';
const JAUNE = '#FFC21A';
const BLEU_PALE = '#E8F7FF';
const GRIS_BLEU = '#9FB3BD';

/** Socle commun à toutes les expressions : corps, mèche, pieds, casque, micro, cravate. */
export function SocleHedi(): ReactNode {
  return (
    <>
      <ellipse cx="100" cy="190" rx="54" ry="7" fill={OMBRE} opacity="0.12" />
      <ellipse cx="78" cy="180" rx="18" ry="10" fill={ORANGE} />
      <ellipse cx="122" cy="180" rx="18" ry="10" fill={ORANGE} />
      <path d="M96 42C92 24 112 18 116 30C110 26 102 30 104 42Z" fill={BLEU_FONCE} />
      <circle cx="100" cy="114" r="68" fill={BLEU_FONCE} />
      <circle cx="100" cy="108" r="68" fill={BLEU_CLAIR} />
      <ellipse cx="72" cy="64" rx="16" ry="8" fill={BLANC} opacity="0.28" transform="rotate(-32 72 64)" />
      <path d="M36 104C36 8 164 8 164 104" fill="none" stroke={OMBRE} strokeWidth="7" strokeLinecap="round" />
      <rect x="26" y="88" width="20" height="34" rx="9" fill={OMBRE} />
      <rect x="154" y="88" width="20" height="34" rx="9" fill={OMBRE} />
      <path
        d="M36 120C40 146 56 154 72 150"
        fill="none"
        stroke={OMBRE}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="74" cy="149" r="6" fill={OMBRE} />
      <path d="M93 152H107L104 160H96Z" fill={ROUGE} />
      <path d="M96 160H104L109 172L100 180L91 172Z" fill={ROUGE_CLAIR} />
    </>
  );
}

/** Calques propres à chaque expression, rendus dans l'ordre : arrière, avant, accessoires. */
export function CalquesHedi({ expression }: { expression: ExpressionHedi }): ReactNode {
  switch (expression) {
    case 'accueillant':
      return (
        <>
          <g data-calque="bras-arriere">
            <ellipse cx="38" cy="146" rx="11" ry="20" fill={BLEU_FONCE} transform="rotate(30 38 146)" />
            <ellipse cx="176" cy="70" rx="11" ry="22" fill={BLEU_FONCE} transform="rotate(35 176 70)" />
          </g>
          <g data-calque="visage">
            <ellipse cx="60" cy="124" rx="11" ry="7" fill={ROSE} opacity="0.65" />
            <ellipse cx="140" cy="124" rx="11" ry="7" fill={ROSE} opacity="0.65" />
            <path
              d="M62 68Q78 60 92 68M108 68Q122 60 138 68"
              fill="none"
              stroke={OMBRE}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <g data-calque="yeux">
              <ellipse cx="78" cy="96" rx="17" ry="20" fill={BLANC} />
              <ellipse cx="122" cy="96" rx="17" ry="20" fill={BLANC} />
              <circle cx="81" cy="100" r="9.5" fill={OMBRE} />
              <circle cx="125" cy="100" r="9.5" fill={OMBRE} />
              <circle cx="84.5" cy="95.5" r="3.5" fill={BLANC} />
              <circle cx="128.5" cy="95.5" r="3.5" fill={BLANC} />
            </g>
            <path d="M84 124Q100 148 116 124Z" fill={OMBRE} />
            <path d="M93 133Q100 140 107 133Q100 129 93 133Z" fill={ROUGE_CLAIR} />
          </g>
        </>
      );
    case 'panique':
      return (
        <>
          <g data-calque="bras-arriere">
            <ellipse cx="26" cy="70" rx="11" ry="22" fill={BLEU_FONCE} transform="rotate(-30 26 70)" />
            <ellipse cx="174" cy="70" rx="11" ry="22" fill={BLEU_FONCE} transform="rotate(30 174 70)" />
          </g>
          <g data-calque="visage">
            <path
              d="M62 70Q76 70 90 60M110 60Q124 70 138 70"
              fill="none"
              stroke={OMBRE}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <g data-calque="yeux">
              <ellipse cx="78" cy="96" rx="19" ry="23" fill={BLANC} />
              <ellipse cx="122" cy="96" rx="19" ry="23" fill={BLANC} />
              <circle cx="78" cy="98" r="6" fill={OMBRE} />
              <circle cx="122" cy="98" r="6" fill={OMBRE} />
            </g>
            <ellipse cx="100" cy="135" rx="10" ry="13" fill={OMBRE} />
          </g>
          <g data-calque="accessoires">
            <path
              d="M186 16C191 25 193 29 193 33A7 7 0 0 1 179 33C179 29 181 25 186 16Z"
              fill={BLEU_PALE}
              stroke={BLEU_FONCE}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path
              d="M14 26C18 33 19 36 19 38A5 5 0 0 1 9 38C9 36 10 33 14 26Z"
              fill={BLEU_PALE}
              stroke={BLEU_FONCE}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </g>
        </>
      );
    case 'pensif':
      return (
        <>
          <g data-calque="bras-arriere">
            <ellipse cx="38" cy="146" rx="11" ry="20" fill={BLEU_FONCE} transform="rotate(30 38 146)" />
          </g>
          <g data-calque="visage">
            <ellipse cx="60" cy="124" rx="11" ry="7" fill={ROSE} opacity="0.65" />
            <ellipse cx="140" cy="126" rx="11" ry="7" fill={ROSE} opacity="0.65" />
            <path
              d="M62 62Q78 52 92 62M110 72L136 68"
              fill="none"
              stroke={OMBRE}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <g data-calque="yeux">
              <ellipse cx="78" cy="96" rx="17" ry="20" fill={BLANC} />
              <ellipse cx="122" cy="96" rx="17" ry="20" fill={BLANC} />
              <circle cx="84" cy="89" r="9" fill={OMBRE} />
              <circle cx="128" cy="89" r="9" fill={OMBRE} />
              <circle cx="87" cy="85" r="3" fill={BLANC} />
              <circle cx="131" cy="85" r="3" fill={BLANC} />
            </g>
            <path
              d="M86 134Q97 129 110 136"
              fill="none"
              stroke={OMBRE}
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
          <g data-calque="bras-avant">
            <ellipse cx="146" cy="160" rx="10" ry="22" fill={BLEU_FONCE} transform="rotate(-58 146 160)" />
            <circle cx="124" cy="148" r="11" fill={BLEU_FONCE} />
          </g>
          <g data-calque="accessoires">
            <path
              d="M168 2V-4M190 14L195 9M146 14L141 9M196 32H202"
              fill="none"
              stroke={JAUNE}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="168" cy="30" r="15" fill={JAUNE} />
            <path
              d="M163 26Q168 34 173 26"
              fill="none"
              stroke={BLANC}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <rect x="161" y="44" width="14" height="10" rx="3" fill={GRIS_BLEU} />
          </g>
        </>
      );
    case 'fier':
      return (
        <>
          <g data-calque="bras-arriere">
            <ellipse cx="36" cy="150" rx="11" ry="20" fill={BLEU_FONCE} transform="rotate(50 36 150)" />
            <ellipse cx="172" cy="74" rx="11" ry="22" fill={BLEU_FONCE} transform="rotate(20 172 74)" />
            <circle cx="177" cy="52" r="11" fill={BLEU_FONCE} />
          </g>
          <g data-calque="visage">
            <ellipse cx="60" cy="122" rx="12" ry="8" fill={ROSE} opacity="0.8" />
            <ellipse cx="140" cy="122" rx="12" ry="8" fill={ROSE} opacity="0.8" />
            <path
              d="M62 62Q78 54 92 62M108 62Q122 54 138 62"
              fill="none"
              stroke={OMBRE}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <g data-calque="yeux">
              <path
                d="M64 100Q78 84 92 100M108 100Q122 84 136 100"
                fill="none"
                stroke={OMBRE}
                strokeWidth="6"
                strokeLinecap="round"
              />
            </g>
            <path d="M78 120Q100 156 122 120Z" fill={OMBRE} />
            <path d="M91 133Q100 142 109 133Q100 128 91 133Z" fill={ROUGE_CLAIR} />
          </g>
          <g data-calque="accessoires">
            <path
              d="M28 30C29.5 39 30 39.5 39 41C30 42.5 29.5 43 28 52C26.5 43 26 42.5 17 41C26 39.5 26.5 39 28 30Z"
              fill={JAUNE}
            />
            <path
              d="M144 0C145.2 7 145.6 7.4 152 8.5C145.6 9.6 145.2 10 144 17C142.8 10 142.4 9.6 136 8.5C142.4 7.4 142.8 7 144 0Z"
              fill={JAUNE}
            />
            <path
              d="M190 112C191.2 119 191.6 119.4 198 120.5C191.6 121.6 191.2 122 190 129C188.8 122 188.4 121.6 182 120.5C188.4 119.4 188.8 119 190 112Z"
              fill={JAUNE}
            />
          </g>
        </>
      );
  }
}
