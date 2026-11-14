// Tables de référence : marges, finitions, fermetures.
// Les valeurs sont des valeurs d'atelier courantes, en cm.

export const FABRICS = {
  stable: {
    label: 'Tissu stable',
    desc: 'Coton, popeline, lin, chambray, jean léger… Il garde sa forme et se coud facilement.',
    ease: 1,
    biasStretch: 0,
    hemReserve: 0,
  },
  fluide: {
    label: 'Tissu fluide',
    desc: 'Viscose, crêpe, satin, mousseline, voile… Tombe joliment mais s’allonge dans le biais.',
    ease: 1,
    biasStretch: -1,
    hemReserve: 2,
  },
  epais: {
    label: 'Tissu épais',
    desc: 'Lainage, velours, gabardine, drap de laine… Prend de la place dans les coutures.',
    ease: 1.5,
    biasStretch: 0,
    hemReserve: 0,
  },
  maille: {
    label: 'Maille',
    desc: 'Jersey, scuba, sweat, milano… Extensible, ne s’effiloche pas.',
    ease: 0,
    biasStretch: 0,
    hemReserve: 0,
  },
};

export const WAIST_FINISHES = {
  ceinture: {
    label: 'Ceinture droite',
    desc: 'Une bande de tissu rapportée, pliée en deux et entoilée. Classique et nette.',
  },
  parementure: {
    label: 'Parementure',
    desc: 'Une bande intérieure qui suit la courbe de taille. Rien ne dépasse au-dessus de la taille.',
  },
  elastique: {
    label: 'Ceinture élastique',
    desc: 'Une coulisse avec un élastique. Pas besoin de fermeture, la jupe s’enfile.',
  },
  biais: {
    label: 'Biais',
    desc: 'La taille est simplement bordée ou parementée d’un biais. Léger et rapide.',
  },
};

export const CLOSURES = {
  invisible: {
    label: 'Fermeture éclair invisible',
    desc: 'Elle disparaît dans la couture. Se pose avec un pied spécial.',
    seam: 1.5,
    bandOverlap: 0,
  },
  classique: {
    label: 'Fermeture éclair classique',
    desc: 'Posée sous patte (une lèvre la recouvre). Plus facile sans pied spécial.',
    seam: 2,
    bandOverlap: 3,
  },
  boutons: {
    label: 'Boutons',
    desc: 'Une patte de boutonnage dans la couture, et un bouton sur la ceinture.',
    seam: 1.5,
    bandOverlap: 3,
  },
  agrafes: {
    label: 'Agrafes / pressions',
    desc: 'Une patte fermée par des agrafes ou des pressions, discrètes.',
    seam: 1.5,
    bandOverlap: 3,
  },
  aucune: {
    label: 'Aucune fermeture',
    desc: 'La jupe s’enfile par le haut. Possible seulement si la taille passe les hanches.',
    seam: 0,
    bandOverlap: 0,
  },
};

export const SEAMS = {
  surfilee: {
    label: 'Couture simple surfilée',
    desc: 'Piqûre droite puis bords surfilés au zigzag. La plus courante.',
    sa: 1.5,
  },
  surjeteuse: {
    label: 'Surjeteuse',
    desc: 'Assemblage et finition en une seule passe à la surjeteuse.',
    sa: 1,
  },
  anglaise: {
    label: 'Couture anglaise',
    desc: 'Deux piqûres (0,5 cm puis 1 cm) : bords enfermés, très propre sur les tissus fins.',
    sa: 1.5,
  },
  rabattue: {
    label: 'Couture rabattue',
    desc: 'Une marge recoupée et l’autre repliée par-dessus : solide, façon jean.',
    sa: 2,
  },
};

export const HEMS = {
  double: {
    label: 'Ourlet double étroit',
    desc: 'Replié deux fois (0,5 cm puis 1 cm). Idéal sur une courbe.',
    allowance: 1.5,
  },
  roulotte: {
    label: 'Ourlet roulotté',
    desc: 'Très fin, au pied ourleur ou à la surjeteuse. Parfait pour les tissus fluides.',
    allowance: 1,
  },
  biais: {
    label: 'Ourlet au biais',
    desc: 'Un biais cousu endroit contre endroit puis rabattu à l’intérieur.',
    allowance: 1,
  },
  crin: {
    label: 'Ourlet au crin',
    desc: 'Un ruban de crin donne du volume et du maintien au bas de jupe.',
    allowance: 1.5,
  },
  surfile: {
    label: 'Ourlet simple surfilé',
    desc: 'Bord surfilé replié une fois. Rapide, très bien pour la maille.',
    allowance: 1.5,
  },
  large: {
    label: 'Ourlet large (3 cm)',
    desc: 'Déconseillé sur une jupe cercle : la courbe fait des plis. À réserver aux tissus très souples.',
    allowance: 4,
  },
};

export const WAIST_POSITIONS = {
  naturelle: {
    label: 'Taille naturelle',
    desc: 'Au creux de la taille, l’endroit le plus fin du buste.',
  },
  haute: {
    label: 'Taille haute',
    desc: 'Quelques centimètres au-dessus du creux de la taille.',
  },
  basse: {
    label: 'Taille basse',
    desc: 'Posée sur le haut des hanches, sous le nombril.',
  },
};

/** Longueurs de fermeture éclair que l'on trouve en mercerie (cm). */
export const ZIP_SIZES = [15, 18, 20, 22, 25, 30, 35, 40, 50, 60];
