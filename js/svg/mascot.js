// Bobinette : souris crème, aiguille à la main, fil bleu ciel enfilé dans
// le chas qui s'enroule autour de son cou pour former son écharpe.

const C = {
  fur: '#F5EAD3',
  furShade: '#E8D6B5',
  belly: '#FBF4E6',
  line: '#8A6A55',
  ear: '#F1C3BA',
  nose: '#E59A93',
  eye: '#3E2C25',
  cheek: '#F2B5A8',
  thread: '#8FC9EC',
  threadDark: '#5FA8D6',
  needle: '#B9BDC4',
  needleLight: '#E9ECEF',
};

/**
 * @param {object} [o]
 * @param {'hello'|'think'|'happy'|'oops'} [o.mood]
 * @param {number} [o.size] largeur en px
 * @param {string} [o.title]
 */
export function mascotSVG({ mood = 'hello', size = 160, title = 'Bobinette, la souris couturière' } = {}) {
  const eyes = mood === 'happy'
    ? `<path d="M80 88 q6 -7 12 0" fill="none" stroke="${C.eye}" stroke-width="3.2" stroke-linecap="round"/>
       <path d="M108 88 q6 -7 12 0" fill="none" stroke="${C.eye}" stroke-width="3.2" stroke-linecap="round"/>`
    : `<ellipse cx="86" cy="88" rx="5" ry="6.2" fill="${C.eye}"/>
       <ellipse cx="114" cy="88" rx="5" ry="6.2" fill="${C.eye}"/>
       <circle cx="87.8" cy="85.6" r="1.8" fill="#fff"/>
       <circle cx="115.8" cy="85.6" r="1.8" fill="#fff"/>`;
  const brows = mood === 'think'
    ? `<path d="M79 76 q7 -4 13 -1" fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/>
       <path d="M108 74 q7 -2 13 2" fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/>`
    : mood === 'oops'
      ? `<path d="M80 75 q6 2 12 -1" fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/>
         <path d="M108 74 q6 3 12 1" fill="none" stroke="${C.line}" stroke-width="2" stroke-linecap="round"/>`
      : '';
  const mouth = mood === 'happy'
    ? `<path d="M93 106 q7 9 14 0" fill="#C9776F" stroke="${C.line}" stroke-width="1.6" stroke-linejoin="round"/>`
    : mood === 'oops'
      ? `<ellipse cx="100" cy="108" rx="3.6" ry="3" fill="#C9776F" stroke="${C.line}" stroke-width="1.4"/>`
      : `<path d="M94 105 q3 4 6 0 q3 4 6 0" fill="none" stroke="${C.line}" stroke-width="1.8" stroke-linecap="round"/>`;

  // Bras gauche : salue (hello), au menton (think), levé (happy) ou au repos.
  const leftArm = mood === 'hello' || mood === 'happy'
    ? `<path d="M64 140 q-20 -12 -24 -34" fill="none" stroke="${C.line}" stroke-width="13" stroke-linecap="round"/>
       <path d="M64 140 q-20 -12 -24 -34" fill="none" stroke="${C.fur}" stroke-width="10" stroke-linecap="round"/>
       <circle cx="40" cy="104" r="7" fill="${C.ear}" stroke="${C.line}" stroke-width="1.6"/>`
    : mood === 'think'
      ? `<path d="M66 142 q2 -22 22 -26" fill="none" stroke="${C.line}" stroke-width="13" stroke-linecap="round"/>
         <path d="M66 142 q2 -22 22 -26" fill="none" stroke="${C.fur}" stroke-width="10" stroke-linecap="round"/>
         <circle cx="89" cy="116" r="6.5" fill="${C.ear}" stroke="${C.line}" stroke-width="1.6"/>`
      : `<path d="M64 140 q-12 14 -10 30" fill="none" stroke="${C.line}" stroke-width="13" stroke-linecap="round"/>
         <path d="M64 140 q-12 14 -10 30" fill="none" stroke="${C.fur}" stroke-width="10" stroke-linecap="round"/>
         <circle cx="54" cy="171" r="6.5" fill="${C.ear}" stroke="${C.line}" stroke-width="1.6"/>`;

  return `<svg class="mascot mascot--${mood}" width="${size}" viewBox="0 0 220 230" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
  <title>${title}</title>
  <!-- queue -->
  <path d="M128 196 q40 10 52 -14 q8 -18 -6 -26" fill="none" stroke="${C.line}" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M128 196 q40 10 52 -14 q8 -18 -6 -26" fill="none" stroke="${C.ear}" stroke-width="3" stroke-linecap="round"/>
  <!-- corps -->
  <ellipse cx="100" cy="165" rx="44" ry="46" fill="${C.fur}" stroke="${C.line}" stroke-width="2.4"/>
  <ellipse cx="100" cy="172" rx="27" ry="31" fill="${C.belly}"/>
  <!-- pieds -->
  <ellipse cx="80" cy="210" rx="14" ry="7" fill="${C.ear}" stroke="${C.line}" stroke-width="2"/>
  <ellipse cx="120" cy="210" rx="14" ry="7" fill="${C.ear}" stroke="${C.line}" stroke-width="2"/>
  ${leftArm}
  <!-- oreilles -->
  <circle cx="60" cy="52" r="25" fill="${C.fur}" stroke="${C.line}" stroke-width="2.4"/>
  <circle cx="60" cy="54" r="15" fill="${C.ear}"/>
  <circle cx="140" cy="52" r="25" fill="${C.fur}" stroke="${C.line}" stroke-width="2.4"/>
  <circle cx="140" cy="54" r="15" fill="${C.ear}"/>
  <!-- tête -->
  <ellipse cx="100" cy="92" rx="43" ry="39" fill="${C.fur}" stroke="${C.line}" stroke-width="2.4"/>
  <ellipse cx="100" cy="104" rx="20" ry="13" fill="${C.belly}"/>
  <circle cx="74" cy="102" r="7" fill="${C.cheek}" opacity=".55"/>
  <circle cx="126" cy="102" r="7" fill="${C.cheek}" opacity=".55"/>
  ${brows}
  ${eyes}
  <ellipse cx="100" cy="99" rx="5.5" ry="4.2" fill="${C.nose}" stroke="${C.line}" stroke-width="1.4"/>
  ${mouth}
  <g stroke="${C.line}" stroke-width="1.2" stroke-linecap="round" opacity=".7">
    <path d="M80 100 l-22 -4"/><path d="M80 104 l-22 3"/>
    <path d="M120 100 l22 -4"/><path d="M120 104 l22 3"/>
  </g>
  <!-- écharpe en fil bleu ciel -->
  <path d="M62 126 q38 18 76 0 l2 11 q-40 19 -80 0 z" fill="${C.thread}" stroke="${C.threadDark}" stroke-width="1.8" stroke-linejoin="round"/>
  <g fill="none" stroke="${C.threadDark}" stroke-width="1.3" opacity=".75">
    <path d="M64 130 q36 16 72 0"/>
    <path d="M63 134 q37 17 75 0"/>
  </g>
  <!-- pan de l'écharpe : brins de fil qui tombent -->
  <path d="M80 136 q-6 18 -2 34" fill="none" stroke="${C.threadDark}" stroke-width="9" stroke-linecap="round"/>
  <path d="M80 136 q-6 18 -2 34" fill="none" stroke="${C.thread}" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M77 170 l-4 7 M79 171 l0 8 M81 170 l4 7" stroke="${C.threadDark}" stroke-width="1.6" stroke-linecap="round"/>
  <!-- bras droit tenant l'aiguille -->
  <path d="M137 140 q18 6 26 -6" fill="none" stroke="${C.line}" stroke-width="13" stroke-linecap="round"/>
  <path d="M137 140 q18 6 26 -6" fill="none" stroke="${C.fur}" stroke-width="10" stroke-linecap="round"/>
  <!-- aiguille -->
  <g transform="rotate(18 168 110)">
    <path d="M165 40 q3 -6 6 0 l0 118 l-3 14 l-3 -14 z" fill="${C.needle}" stroke="${C.line}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M167 50 l0 100" stroke="${C.needleLight}" stroke-width="1.2"/>
    <ellipse cx="168" cy="50" rx="1.7" ry="6" fill="#FBF6EE" stroke="${C.line}" stroke-width="1.1"/>
  </g>
  <circle cx="163" cy="134" r="7" fill="${C.ear}" stroke="${C.line}" stroke-width="1.6"/>
  <!-- fil : part de l'écharpe, passe dans le chas et retombe -->
  <path d="M138 128 q24 -14 22 -42 q0 -28 26 -33" fill="none" stroke="${C.threadDark}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M138 128 q24 -14 22 -42 q0 -28 26 -33" fill="none" stroke="${C.thread}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M186 53 q12 -4 12 10 q0 16 -8 28" fill="none" stroke="${C.threadDark}" stroke-width="3.6" stroke-linecap="round"/>
  <path d="M186 53 q12 -4 12 10 q0 16 -8 28" fill="none" stroke="${C.thread}" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;
}

/** Petite tête de Bobinette pour l'icône et l'en-tête. */
export function mascotHeadSVG(size = 40) {
  return `<svg width="${size}" height="${size}" viewBox="20 20 160 130" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
  <circle cx="60" cy="52" r="25" fill="${C.fur}" stroke="${C.line}" stroke-width="3"/>
  <circle cx="60" cy="54" r="15" fill="${C.ear}"/>
  <circle cx="140" cy="52" r="25" fill="${C.fur}" stroke="${C.line}" stroke-width="3"/>
  <circle cx="140" cy="54" r="15" fill="${C.ear}"/>
  <ellipse cx="100" cy="92" rx="43" ry="39" fill="${C.fur}" stroke="${C.line}" stroke-width="3"/>
  <ellipse cx="100" cy="104" rx="20" ry="13" fill="${C.belly}"/>
  <ellipse cx="86" cy="88" rx="5" ry="6.2" fill="${C.eye}"/>
  <ellipse cx="114" cy="88" rx="5" ry="6.2" fill="${C.eye}"/>
  <ellipse cx="100" cy="99" rx="5.5" ry="4.2" fill="${C.nose}"/>
  <path d="M62 126 q38 18 76 0 l2 11 q-40 19 -80 0 z" fill="${C.thread}" stroke="${C.threadDark}" stroke-width="2"/>
</svg>`;
}
