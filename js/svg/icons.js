// Petites illustrations des options du questionnaire (vues en coupe ou de face).
const S = 'var(--ink)';
const A = 'var(--accent)';
const T = 'var(--tape-dark)';
const F = 'var(--piece-panel)';
const B = 'var(--piece-band)';

const wrap = (inner, label) =>
  `<svg class="opt-ill" viewBox="0 0 80 56" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

// Haut de jupe vu de face, utilisé pour les finitions de taille et fermetures.
const skirtTop = `<path d="M18 14 H62 L74 54 H6 Z" fill="${F}" stroke="${S}" stroke-width="1.5" stroke-linejoin="round"/>`;

const ICONS = {
  // ---- tissus : textures ----
  'tissu:stable': `<rect x="8" y="8" width="64" height="40" rx="4" fill="${F}" stroke="${S}" stroke-width="1.2"/>
    <g stroke="${S}" stroke-width=".6" opacity=".5">${Array.from({ length: 9 }, (_, i) => `<line x1="${14 + i * 7}" y1="10" x2="${14 + i * 7}" y2="46"/>`).join('')}${Array.from({ length: 5 }, (_, i) => `<line x1="10" y1="${14 + i * 7}" x2="70" y2="${14 + i * 7}"/>`).join('')}</g>`,
  'tissu:fluide': `<path d="M10 8 H70 V30 q-8 18 -15 6 q-8 16 -15 4 q-8 16 -15 4 q-8 14 -15 0 z" fill="${F}" stroke="${S}" stroke-width="1.2"/>
    <g fill="none" stroke="${S}" stroke-width=".7" opacity=".5"><path d="M25 10 q-3 18 0 30"/><path d="M40 10 q-3 20 0 32"/><path d="M55 10 q-3 18 0 30"/></g>`,
  'tissu:epais': `<rect x="8" y="12" width="64" height="32" rx="6" fill="${F}" stroke="${S}" stroke-width="1.2"/>
    <rect x="12" y="16" width="56" height="24" rx="4" fill="none" stroke="${S}" stroke-width=".8" stroke-dasharray="1 2"/>
    <g stroke="${S}" stroke-width="1.6" opacity=".35">${Array.from({ length: 8 }, (_, i) => `<line x1="${16 + i * 7}" y1="22" x2="${19 + i * 7}" y2="34"/>`).join('')}</g>`,
  'tissu:maille': `<rect x="8" y="8" width="64" height="40" rx="4" fill="${F}" stroke="${S}" stroke-width="1.2"/>
    <g fill="none" stroke="${S}" stroke-width=".8" opacity=".6">${[0, 1, 2, 3].map((r) => Array.from({ length: 8 }, (_, i) => `<path d="M${13 + i * 7} ${13 + r * 9} l3 6 l3 -6"/>`).join('')).join('')}</g>
    <path d="M62 28 l8 0 M66 24 l4 4 l-4 4" stroke="${A}" stroke-width="1.6" fill="none"/>`,

  // ---- position de taille ----
  'port:naturelle': `<path d="M24 4 q-8 22 0 26 q-10 10 -14 26 h60 q-4 -16 -14 -26 q8 -4 0 -26" fill="var(--body-fill)" stroke="${S}" stroke-width="1.2"/><line x1="12" y1="30" x2="68" y2="30" stroke="${T}" stroke-width="3"/>`,
  'port:haute': `<path d="M24 4 q-8 22 0 26 q-10 10 -14 26 h60 q-4 -16 -14 -26 q8 -4 0 -26" fill="var(--body-fill)" stroke="${S}" stroke-width="1.2"/><line x1="12" y1="22" x2="68" y2="22" stroke="${T}" stroke-width="3"/>`,
  'port:basse': `<path d="M24 4 q-8 22 0 26 q-10 10 -14 26 h60 q-4 -16 -14 -26 q8 -4 0 -26" fill="var(--body-fill)" stroke="${S}" stroke-width="1.2"/><line x1="10" y1="42" x2="70" y2="42" stroke="${T}" stroke-width="3"/>`,

  // ---- finitions de taille ----
  'finition:ceinture': `${skirtTop}<rect x="16" y="6" width="48" height="10" rx="1.5" fill="${B}" stroke="${S}" stroke-width="1.5"/><line x1="18" y1="11" x2="62" y2="11" stroke="${S}" stroke-width=".6" stroke-dasharray="2 2"/>`,
  'finition:parementure': `${skirtTop}<path d="M19.5 19 H60.5" stroke="${S}" stroke-width=".8" stroke-dasharray="2 2"/><path d="M18 14 H62 L64 24 H16 Z" fill="${B}" opacity=".6"/><text x="40" y="22" font-size="6" text-anchor="middle" fill="${S}">envers</text>`,
  'finition:elastique': `<path d="M22 14 H58 L74 54 H6 Z" fill="${F}" stroke="${S}" stroke-width="1.5" stroke-linejoin="round"/><rect x="20" y="5" width="40" height="11" rx="2" fill="${B}" stroke="${S}" stroke-width="1.5"/><g stroke="${S}" stroke-width=".8">${Array.from({ length: 9 }, (_, i) => `<path d="M${23 + i * 4} 6 v9"/>`).join('')}</g>`,
  'finition:biais': `${skirtTop}<path d="M18 14 H62" stroke="${A}" stroke-width="4" stroke-linecap="round"/>`,

  // ---- fermetures ----
  'fermeture:invisible': `${skirtTop}<line x1="40" y1="14" x2="40" y2="42" stroke="${S}" stroke-width="1"/><circle cx="40" cy="42" r="1.8" fill="${A}"/><path d="M40 43 v5" stroke="${A}" stroke-width="1.4"/>`,
  'fermeture:classique': `${skirtTop}<path d="M37 14 V40 H43 V14" fill="var(--paper)" stroke="${S}" stroke-width="1"/><g stroke="${S}" stroke-width=".8">${Array.from({ length: 12 }, (_, i) => `<path d="M38 ${16 + i * 2} h4"/>`).join('')}</g><rect x="38" y="20" width="4" height="5" fill="${A}"/>`,
  'fermeture:boutons': `${skirtTop}<rect x="36" y="14" width="8" height="30" fill="${B}" stroke="${S}" stroke-width="1"/>${[20, 28, 36].map((y) => `<circle cx="40" cy="${y}" r="2.4" fill="${A}" stroke="${S}" stroke-width=".7"/>`).join('')}`,
  'fermeture:agrafes': `${skirtTop}<rect x="36" y="14" width="8" height="30" fill="${B}" stroke="${S}" stroke-width="1"/>${[19, 25, 31, 37].map((y) => `<path d="M37 ${y} h4 q2 0 2 1.5 q0 1.5 -2 1.5" fill="none" stroke="${S}" stroke-width="1"/>`).join('')}`,
  'fermeture:aucune': `${skirtTop}<path d="M40 2 V24" stroke="${A}" stroke-width="2"/><path d="M35 19 L40 25 L45 19" fill="none" stroke="${A}" stroke-width="2"/>`,

  // ---- coutures, vues en coupe ----
  'couture:surfilee': `<path d="M6 30 H38 V46 M74 30 H42 V46" fill="none" stroke="${S}" stroke-width="2"/><path d="M40 22 V30" stroke="${A}" stroke-width="2" stroke-dasharray="2 1.5"/><path d="M34 46 l2 -3 l2 3 M42 46 l2 -3 l2 3" fill="none" stroke="${A}" stroke-width="1"/><text x="40" y="16" text-anchor="middle" font-size="7" fill="${S}">1,5</text>`,
  'couture:surjeteuse': `<path d="M6 30 H40 V42 M74 32 H42 V42" fill="none" stroke="${S}" stroke-width="2"/><path d="M38 34 q3 -2 6 0 q-3 2 -6 4 q3 2 6 4" fill="none" stroke="${A}" stroke-width="1.2"/><text x="40" y="20" text-anchor="middle" font-size="7" fill="${S}">1</text>`,
  'couture:anglaise': `<path d="M6 28 H40 V44 Q40 48 36 46 V32 M74 30 H44 V48 Q40 50 38 46" fill="none" stroke="${S}" stroke-width="2"/><path d="M42 24 V32" stroke="${A}" stroke-width="2" stroke-dasharray="2 1.5"/><text x="40" y="16" text-anchor="middle" font-size="7" fill="${S}">0,5 + 1</text>`,
  'couture:rabattue': `<path d="M6 30 H74 M40 30 V34 H58 M40 32 H52 Q56 32 56 36 H42" fill="none" stroke="${S}" stroke-width="2"/><path d="M40 22 V30 M58 22 V30" stroke="${A}" stroke-width="2" stroke-dasharray="2 1.5"/><text x="40" y="16" text-anchor="middle" font-size="7" fill="${S}">2</text>`,

  // ---- ourlets, vus en coupe (bas du tissu en bas) ----
  'ourlet:double': `<path d="M30 6 V44 Q30 48 34 48 H38 V38 Q38 36 36 36 H34" fill="none" stroke="${S}" stroke-width="2"/><path d="M42 40 H52" stroke="${A}" stroke-width="2" stroke-dasharray="2 1.5"/><text x="56" y="43" font-size="7" fill="${S}">0,5+1</text>`,
  'ourlet:roulotte': `<path d="M34 6 V44 q0 4 3 4 q3 0 3 -3 q0 -3 -3 -3" fill="none" stroke="${S}" stroke-width="2"/><text x="46" y="46" font-size="7" fill="${S}">roulé</text>`,
  'ourlet:biais': `<path d="M32 6 V48" stroke="${S}" stroke-width="2"/><path d="M32 48 H38 V36" fill="none" stroke="${A}" stroke-width="3"/><text x="44" y="44" font-size="7" fill="${S}">biais</text>`,
  'ourlet:crin': `<path d="M30 6 V48 H36 V30" fill="none" stroke="${S}" stroke-width="2"/><rect x="31.5" y="30" width="3" height="17" fill="${B}" stroke="${S}" stroke-width=".6"/><text x="42" y="40" font-size="7" fill="${S}">crin</text>`,
  'ourlet:surfile': `<path d="M32 6 V48 H38 V36" fill="none" stroke="${S}" stroke-width="2"/><path d="M36 36 l2 -2 l2 2 l2 -2" fill="none" stroke="${A}" stroke-width="1"/>`,
  'ourlet:large': `<path d="M32 6 V48 H38 V20" fill="none" stroke="${S}" stroke-width="2"/><path d="M44 22 l4 4 m0 -4 l-4 4" stroke="${A}" stroke-width="1.6"/><text x="52" y="30" font-size="7" fill="${S}">plis</text>`,
};

export function optionIcon(questionId, value, label = '') {
  const inner = ICONS[`${questionId}:${value}`];
  return inner ? wrap(inner, label) : '';
}
