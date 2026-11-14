// Calcul complet d'une jupe cercle (1/4, 1/2 ou cercle complet).
import { FABRICS, CLOSURES, SEAMS, HEMS, ZIP_SIZES } from '../data/options.js';
import { sectorPolygon, rectPolygon, packPieces, panelRotations } from './geometry.js';

const PI = Math.PI;
const WAIST_SA = 1;          // marge de couture à la taille
const FACING_WIDTH = 6;      // largeur finie d'une parementure
const LINING_SHORTER = 2;    // la doublure est plus courte que la jupe
const POCKET_TOP = 3;        // haut de l'ouverture de poche sous la couture de taille
const POCKET_OPENING = 15;   // longueur d'ouverture de poche
const SLIT_SA = 2;           // marge le long d'une fente

export const FRACTIONS = {
  quart: { f: 0.25, label: 'Jupe 1/4 de cercle', short: '1/4 cercle' },
  demi: { f: 0.5, label: 'Jupe 1/2 cercle', short: '1/2 cercle' },
  complet: { f: 1, label: 'Jupe cercle complet', short: 'cercle complet' },
};

const round1 = (x) => Math.round(x * 10) / 10;
const fr = (x) => round1(x).toLocaleString('fr-FR');
const ceilTo = (x, step) => Math.ceil(x / step - 1e-9) * step;

/** Nom des coutures selon le nombre de panneaux. */
function seamLayout(k) {
  if (k === 1) return { names: ['milieu dos'], closure: 'milieu dos', slit: 'milieu dos', text: '1 couture au milieu dos' };
  if (k === 2) return { names: ['côté gauche', 'côté droit'], closure: 'côté gauche', slit: 'côté droit', text: '2 coutures sur les côtés' };
  return {
    names: ['milieu devant', 'milieu dos', 'côté gauche', 'côté droit'],
    closure: 'milieu dos',
    slit: 'milieu devant',
    text: '4 coutures : milieu devant, milieu dos et côtés',
  };
}

/**
 * @param {'quart'|'demi'|'complet'} fractionKey
 * @param {object} a réponses du questionnaire
 */
export function computeCircleSkirt(fractionKey, a) {
  const { f, label } = FRACTIONS[fractionKey];
  const fabric = FABRICS[a.tissu] ?? FABRICS.stable;
  const closure = CLOSURES[a.fermeture] ?? CLOSURES.invisible;
  const seamType = SEAMS[a.couture] ?? SEAMS.surfilee;
  const hemType = HEMS[a.ourlet] ?? HEMS.double;

  const W = +a.taille;
  const H = +a.hanches;
  const L = +a.longueur;
  const laize = +a.laize;

  const adaptations = [];
  const warnings = [];
  const errors = [];

  // ---------- 1. Tour de taille fini de la jupe ----------
  let Wf;
  if (a.finition === 'elastique') {
    // La jupe doit pouvoir passer les hanches : on la calcule sur le tour de hanches.
    Wf = H + 4;
    adaptations.push({
      title: 'Taille calculée sur les hanches',
      text: `Avec une ceinture élastique, la jupe s’enfile : sa taille est calculée sur le tour de hanches + 4 cm d’aisance (${fr(Wf)} cm). L’élastique la resserre ensuite à votre taille.`,
    });
  } else {
    Wf = W + fabric.ease + fabric.biasStretch;
    if (fabric.ease) {
      adaptations.push({
        title: `Aisance de taille : +${fr(fabric.ease)} cm`,
        text: `On ajoute ${fr(fabric.ease)} cm à votre tour de taille pour pouvoir respirer et s’asseoir confortablement.`,
      });
    } else {
      adaptations.push({
        title: 'Pas d’aisance à la taille',
        text: 'La maille s’étire : on garde votre tour de taille exact pour que la jupe tienne bien.',
      });
    }
    if (fabric.biasStretch) {
      adaptations.push({
        title: `Tissu fluide : ${fr(fabric.biasStretch)} cm à la taille`,
        text: 'La courbe de taille d’une jupe cercle est en partie dans le biais : un tissu fluide s’y détend. On retire 1 cm pour compenser. Pensez à faire une piqûre de soutien (ou un ruban droit-fil) à 0,8 cm du bord dès la coupe.',
      });
    }
  }

  // ---------- 2. Rayon de taille ----------
  const r = Wf / (2 * PI * f);

  // ---------- 3. Hauteur de ceinture et longueur du panneau ----------
  let bandH = 0;
  if (a.finition === 'ceinture') bandH = +a.hauteurCeinture || 4;
  if (a.finition === 'elastique') bandH = (+a.largeurElastique || 3) + 1;
  const Lp = L - bandH;
  if (bandH) {
    adaptations.push({
      title: `Longueur du panneau : −${fr(bandH)} cm`,
      text: `La ceinture mesure ${fr(bandH)} cm de haut et fait partie de la longueur totale de ${fr(L)} cm : le panneau de jupe ne mesure donc que ${fr(Lp)} cm de la couture de taille à l’ourlet.`,
    });
  }
  if (Lp < 10) errors.push('La jupe est trop courte par rapport à la hauteur de ceinture. Vérifiez la longueur.');
  const R = r + Lp;

  // ---------- 4. Marges ----------
  const hemReserve = fabric.hemReserve;
  const hemA = hemType.allowance + hemReserve;
  adaptations.push({
    title: `Marge d’ourlet : ${fr(hemA)} cm`,
    text: `${hemType.label} : ${fr(hemType.allowance)} cm de marge.` +
      (hemReserve ? ` + ${fr(hemReserve)} cm de réserve, car un tissu fluide coupé en cercle « tombe » et s’allonge dans le biais : laissez la jupe suspendue 24 h avant de régulariser l’ourlet.` : ''),
  });
  if (a.ourlet === 'large') warnings.push('Un ourlet large sur une jupe cercle fait des vagues : le bord replié est plus long que l’endroit où il est cousu. Préférez un ourlet étroit ou au biais.');

  let s = seamType.sa;
  const seamReasons = [`${seamType.label} : ${fr(seamType.sa)} cm`];
  if (closure.seam > s) {
    s = closure.seam;
    seamReasons.push(`${closure.label.toLowerCase()} : ${fr(closure.seam)} cm nécessaires`);
  }
  if (a.fente && SLIT_SA > s) {
    s = SLIT_SA;
    seamReasons.push(`fente : ${fr(SLIT_SA)} cm pour replier ses bords`);
  }
  adaptations.push({
    title: `Marge de couture : ${fr(s)} cm`,
    text: `Sur tous les bords droits (coutures). ${seamReasons.join(' ; ')}. Une seule valeur partout simplifie la coupe.` +
      (a.couture === 'anglaise' ? ' Couture anglaise : 1re piqûre envers contre envers à 0,5 cm, recouper à 0,3 cm, retourner, 2e piqûre à 1 cm.' : '') +
      (a.couture === 'rabattue' ? ' Couture rabattue : piquer à 2 cm, recouper une marge à 0,7 cm, replier l’autre par-dessus et surpiquer.' : ''),
  });

  // ---------- 5. Ouverture nécessaire pour passer les hanches ----------
  // À une profondeur y sous la taille, le tour de la jupe vaut 2πf(r + y).
  const depthToHips = Math.max(0, (H + 2) / (2 * PI * f) - r);
  const pullOn = a.fermeture === 'aucune';
  if (pullOn && Wf < H + 2) {
    errors.push(`Sans fermeture, la taille de la jupe (${fr(Wf)} cm) ne passera pas vos hanches (${fr(H)} cm). Ajoutez une fermeture ou choisissez une ceinture élastique.`);
  }

  let zip = null;
  let opening = 0;
  if (!pullOn) {
    opening = Math.max(Math.ceil(depthToHips + 2), a.fermeture === 'boutons' || a.fermeture === 'agrafes' ? 14 : 15);
    if (a.fermeture === 'invisible' || a.fermeture === 'classique') {
      const zipNeeded = opening + (a.finition === 'ceinture' && a.fermeture === 'invisible' ? bandH : 0);
      const buy = ZIP_SIZES.find((z) => z >= zipNeeded) ?? zipNeeded;
      zip = { opening, needed: zipNeeded, buy };
      adaptations.push({
        title: `Ouverture de ${opening} cm`,
        text: `Pour que la jupe passe vos hanches (${fr(H)} cm), elle doit s’ouvrir jusqu’à ${fr(depthToHips)} cm sous la taille, là où son tour atteint ${fr(H + 2)} cm. Avec 2 cm de sécurité : ouverture de ${opening} cm. ` +
          (a.finition === 'ceinture' && a.fermeture === 'invisible' ? `La glissière invisible monte jusqu’en haut de la ceinture (+${fr(bandH)} cm). ` : '') +
          `Achetez une fermeture de ${buy} cm.`,
      });
    } else {
      adaptations.push({
        title: `Patte de ${opening} cm`,
        text: `La jupe doit s’ouvrir sur ${opening} cm sous la taille pour passer vos hanches (${fr(H)} cm).`,
      });
    }
  }

  // ---------- 6. Coutures possibles et choix du nombre de panneaux ----------
  const candidates = f === 1 ? [2, 4] : [1, 2, 4];
  const needSideSeams = !!a.poches;
  const minK = needSideSeams ? 2 : candidates[0];

  const rInCut = r - WAIST_SA;
  const rOutCut = R + hemA;

  const overlap = a.finition === 'ceinture' || a.finition === 'elastique' ? closure.bandOverlap : 0;

  function buildPieces(k, forLining = false) {
    const angle = (360 * f) / k;
    const pieces = [];
    const outR = forLining ? R - LINING_SHORTER + HEMS.double.allowance : rOutCut;
    const poly = sectorPolygon({ rIn: rInCut, rOut: outR, angle, seam: forLining ? Math.max(1.5, s) : s });
    for (let i = 0; i < k; i++) {
      pieces.push({ id: `panel${i}`, kind: 'panel', label: `Panneau ${i + 1}`, poly, rotations: panelRotations(angle) });
    }
    if (forLining) return pieces;
    if (a.finition === 'parementure') {
      const fpoly = sectorPolygon({ rIn: rInCut, rOut: r + FACING_WIDTH, angle, seam: s });
      for (let i = 0; i < k; i++) {
        pieces.push({ id: `facing${i}`, kind: 'facing', label: `Parementure ${i + 1}`, poly: fpoly, rotations: panelRotations(angle) });
      }
    }
    if (a.finition === 'ceinture') {
      const len = Wf + overlap + 2;
      const wid = 2 * bandH + 2;
      pieces.push({ id: 'band', kind: 'band', label: 'Ceinture', poly: rectPolygon(len, wid), rotations: [0, 90], dims: [len, wid] });
    }
    if (a.finition === 'elastique') {
      const len = Wf + 2;
      const wid = 2 * bandH + 2;
      pieces.push({ id: 'band', kind: 'band', label: 'Ceinture coulisse', poly: rectPolygon(len, wid), rotations: [0, 90], dims: [len, wid] });
    }
    if (a.fermeture === 'boutons' || a.fermeture === 'agrafes') {
      const len = opening + 2;
      for (let i = 0; i < 2; i++) {
        pieces.push({ id: `placket${i}`, kind: 'placket', label: i ? 'Sous-patte' : 'Patte', poly: rectPolygon(len, 8), rotations: [0, 90], dims: [len, 8] });
      }
    }
    if (a.poches && !a.doublure) {
      for (let i = 0; i < 4; i++) {
        pieces.push({ id: `pocket${i}`, kind: 'pocket', label: `Poche ${i + 1}`, poly: rectPolygon(30, 20, 7), rotations: [0, 90, 180, 270], dims: [30, 20] });
      }
    }
    return pieces;
  }

  const options = [];
  let tooNarrow = null;
  for (const k of candidates) {
    if (k < minK) continue;
    const pieces = buildPieces(k);
    const layout = packPieces(pieces, laize);
    if (!layout.fits) {
      if (!tooNarrow || layout.tooWide.minWidth < tooNarrow.minWidth) tooNarrow = { k, minWidth: layout.tooWide.minWidth };
      continue;
    }
    options.push({ k, pieces, layout });
  }

  if (!options.length) {
    errors.push(
      `Votre tissu (laize ${laize} cm) est trop étroit, même en coupant la jupe en 4 panneaux` +
      (tooNarrow ? ` : il faudrait au moins ${Math.ceil(tooNarrow.minWidth)} cm de laize.` : '.') +
      ' Raccourcissez la jupe, choisissez une jupe moins ample ou un tissu plus large.'
    );
  }

  // On préfère moins de coutures, sauf si plus de panneaux économise vraiment du tissu.
  let chosen = null;
  for (const o of options) {
    o.score = o.layout.length * (1 + 0.06 * (o.k - minK));
    if (!chosen || o.score < chosen.score) chosen = o;
  }

  if (errors.length || !chosen) {
    return { ok: false, errors, warnings, label, fractionKey };
  }

  const k = chosen.k;
  const seams = seamLayout(k);
  const angle = (360 * f) / k;
  const layout = chosen.layout;
  const fabricLength = layout.length;
  const buyLength = ceilTo(fabricLength + 10, 10);

  if (options.length > 1 || minK > 1 || k > candidates[0]) {
    const alt = options.filter((o) => o.k !== k).map((o) => `${o.k} panneau${o.k > 1 ? 'x' : ''} : ${Math.ceil(o.layout.length)} cm`);
    adaptations.push({
      title: `Coupée en ${k} panneau${k > 1 ? 'x' : ''}`,
      text: `${seams.text}.` +
        (needSideSeams ? ' Les poches demandent des coutures de côté.' : '') +
        (alt.length ? ` C’est la solution qui demande le moins de tissu avec votre laize (autres options — ${alt.join(', ')}).` : ''),
    });
  }

  // ---------- 7. Doublure ----------
  let lining = null;
  if (a.doublure) {
    const lw = +a.laizeDoublure || 140;
    const lp = buildPieces(k, true);
    if (a.poches) {
      for (let i = 0; i < 4; i++) {
        lp.push({ id: `pocket${i}`, kind: 'pocket', label: `Poche ${i + 1}`, poly: rectPolygon(30, 20, 7), rotations: [0, 90, 180, 270], dims: [30, 20] });
      }
    }
    const ll = packPieces(lp, lw);
    lining = {
      width: lw,
      layout: ll,
      fits: ll.fits,
      length: ll.length,
      buy: ll.fits ? ceilTo(ll.length + 10, 10) : null,
    };
    adaptations.push({
      title: `Doublure ${LINING_SHORTER} cm plus courte`,
      text: `La doublure reprend les mêmes panneaux, raccourcis de ${LINING_SHORTER} cm pour ne pas dépasser sous la jupe, avec un ourlet double étroit.` +
        (a.poches ? ' Les sacs de poche sont coupés dans la doublure.' : ''),
    });
    if (!ll.fits) warnings.push(`La doublure ne rentre pas dans une laize de ${lw} cm : coupez-la en plus de panneaux ou choisissez une doublure plus large.`);
  }

  // ---------- 8. Repères (crans) sur les coutures ----------
  const notches = [];
  if (!pullOn) {
    notches.push({ seam: seams.closure, from: WAIST_SA + opening, label: a.fermeture === 'invisible' || a.fermeture === 'classique' ? 'bas de la fermeture' : 'bas de la patte' });
  }
  if (a.poches) {
    notches.push({ seam: 'côtés', from: WAIST_SA + POCKET_TOP, label: 'haut de poche' });
    notches.push({ seam: 'côtés', from: WAIST_SA + POCKET_TOP + POCKET_OPENING, label: 'bas de poche' });
  }
  let slit = null;
  if (a.fente) {
    const hf = +a.hauteurFente || 15;
    const slitSeam = k === 1 ? seams.closure : seams.slit;
    slit = { height: hf, seam: slitSeam, from: WAIST_SA + Lp - hf };
    notches.push({ seam: slitSeam, from: slit.from, label: 'haut de fente' });
    if (k === 1 && !pullOn && WAIST_SA + opening + 5 > slit.from) {
      warnings.push('La fente et l’ouverture de fermeture se rejoignent presque dans la même couture : réduisez la hauteur de fente.');
    }
    warnings.push('Une jupe cercle a déjà beaucoup d’ampleur : une fente n’est utile que sur une jupe 1/4 de cercle longue ou en tissu épais.');
  }

  // ---------- 9. Fournitures ----------
  const supplies = [];
  supplies.push({ label: 'Tissu', qty: `${buyLength} cm`, detail: `en ${laize} cm de laize (placement exact : ${Math.ceil(fabricLength)} cm). Ajoutez ~5 % si le tissu n’est pas prélavé.` });
  if (lining) supplies.push({ label: 'Doublure', qty: lining.buy ? `${lining.buy} cm` : '—', detail: `en ${lining.width} cm de laize` });
  if (zip) supplies.push({ label: a.fermeture === 'invisible' ? 'Fermeture éclair invisible' : 'Fermeture éclair', qty: `${zip.buy} cm`, detail: `ouverture utile ${zip.needed} cm` });
  if (a.finition === 'ceinture') {
    supplies.push({ label: 'Entoilage thermocollant', qty: `${Math.ceil(Wf + overlap + 2)} × ${fr(bandH + 1)} cm`, detail: 'pour la moitié extérieure de la ceinture' });
    if (a.fermeture === 'invisible') supplies.push({ label: 'Agrafe', qty: '1', detail: 'en haut de la ceinture, au-dessus de la glissière' });
    if (a.fermeture === 'classique') supplies.push({ label: 'Bouton ou agrafe de ceinture', qty: '1', detail: `sur la sous-patte de ${fr(overlap)} cm` });
  }
  if (a.fermeture === 'boutons') {
    const n = Math.max(2, Math.ceil(opening / 6));
    supplies.push({ label: 'Boutons', qty: `${n + (a.finition === 'ceinture' ? 1 : 0)}`, detail: `${n} sur la patte (tous les ~6 cm)` + (a.finition === 'ceinture' ? ' + 1 sur la ceinture' : '') });
  }
  if (a.fermeture === 'agrafes') {
    const n = Math.max(3, Math.ceil(opening / 4));
    supplies.push({ label: 'Agrafes ou pressions', qty: `${n + (a.finition === 'ceinture' ? 2 : 0)}`, detail: `${n} sur la patte (tous les ~4 cm)` + (a.finition === 'ceinture' ? ' + 2 sur la ceinture' : '') });
  }
  if (a.finition === 'elastique') {
    const e = +a.largeurElastique || 3;
    const len = Math.round(W * 0.92) + 2;
    supplies.push({ label: `Élastique de ${e} cm`, qty: `${len} cm`, detail: `tour de taille − 8 % + 2 cm de chevauchement` });
  }
  if (a.finition === 'parementure') {
    supplies.push({ label: 'Entoilage thermocollant', qty: `${k} pièce${k > 1 ? 's' : ''}`, detail: 'coupées comme les parementures' });
  }
  const hemCirc = 2 * PI * f * R;
  if (a.finition === 'biais') supplies.push({ label: 'Biais (taille)', qty: `${Math.ceil(Wf + 4)} cm`, detail: 'largeur 2 cm plié' });
  if (a.ourlet === 'biais') supplies.push({ label: 'Biais (ourlet)', qty: `${ceilTo(hemCirc + 10, 10)} cm`, detail: `tour d’ourlet : ${Math.round(hemCirc)} cm` });
  if (a.ourlet === 'crin') supplies.push({ label: 'Crin', qty: `${ceilTo(hemCirc + 5, 10)} cm`, detail: `tour d’ourlet : ${Math.round(hemCirc)} cm` });
  if (fabric.biasStretch || f >= 0.5) {
    supplies.push({ label: 'Ruban droit-fil (facultatif)', qty: `${Math.ceil(Wf + 4)} cm`, detail: 'stabilise la courbe de taille' });
  }
  supplies.push({ label: 'Fil assorti', qty: a.couture === 'surjeteuse' ? '1 bobine + 3 cônes' : '1 à 2 bobines', detail: '' });

  if (a.sens) {
    warnings.push('Tissu à sens ou motif directionnel : sur une jupe cercle, les panneaux rayonnent autour de la taille, le motif sera forcément tourné à certains endroits. Choisissez de préférence un motif sans sens, ou coupez en 4 panneaux pour limiter l’effet.');
  }
  if (a.tissu === 'maille' && (a.fermeture === 'invisible' || a.fermeture === 'classique')) {
    warnings.push('En maille, une fermeture n’est souvent pas nécessaire : si la taille s’étire assez pour passer les hanches, une ceinture en maille ou élastique suffit. Stabilisez la couture de la fermeture avec un entoilage.');
  }
  if (rInCut < 6) warnings.push('Le rayon de taille est très petit : tracez-le avec soin, au mètre ruban pivotant, en marquant des points tous les 2 cm.');

  // ---------- 10. Pièces à couper ----------
  const cutList = [];
  cutList.push({ name: 'Panneau de jupe', qty: k, fabric: 'tissu', dims: `rayon taille ${fr(rInCut)} cm → rayon ourlet ${fr(rOutCut)} cm, angle ${fr(angle)}°` });
  if (a.finition === 'parementure') cutList.push({ name: 'Parementure', qty: k, fabric: 'tissu + entoilage', dims: `rayon ${fr(rInCut)} → ${fr(r + FACING_WIDTH)} cm, angle ${fr(angle)}°` });
  for (const p of chosen.pieces) {
    if (p.kind === 'band') cutList.push({ name: p.label, qty: 1, fabric: a.finition === 'ceinture' ? 'tissu + entoilage' : 'tissu', dims: `${fr(p.dims[0])} × ${fr(p.dims[1])} cm` });
  }
  if (a.fermeture === 'boutons' || a.fermeture === 'agrafes') cutList.push({ name: 'Patte et sous-patte', qty: 2, fabric: 'tissu + entoilage', dims: `${opening + 2} × 8 cm` });
  if (a.poches) cutList.push({ name: 'Sac de poche', qty: 4, fabric: a.doublure ? 'doublure' : 'tissu', dims: '30 × 20 cm, fond arrondi' });
  if (lining) cutList.push({ name: 'Panneau de doublure', qty: k, fabric: 'doublure', dims: `rayon taille ${fr(rInCut)} cm → ${fr(R - LINING_SHORTER + HEMS.double.allowance)} cm` });

  // ---------- 11. Traçage ----------
  const chord = (rad) => 2 * rad * Math.sin(((angle / 2) * PI) / 180);
  const tracing = [];
  tracing.push(`Repassez le tissu et posez-le à plat, sur l’endroit ou l’envers selon la craie utilisée. Repérez le droit-fil : il est parallèle aux lisières.`);
  tracing.push(`Choisissez le point de pivot C (le centre du cercle). Pour chaque panneau, il se trouve à l’emplacement indiqué sur le plan de coupe, parfois juste en dehors du tissu : dans ce cas, prolongez avec une règle.`);
  if (angle === 90) tracing.push(`Tracez deux lignes de couture à angle droit depuis C (une équerre ou le coin d’une feuille de papier suffit).`);
  else if (angle === 180) tracing.push(`Tracez une ligne droite passant par C : c’est la ligne de couture des deux bords du panneau (angle plat, 180°).`);
  else tracing.push(`Tracez deux lignes depuis C formant un angle de ${fr(angle)}°. Sans rapporteur : à ${fr(R)} cm de C, l’écart entre les deux lignes doit être de ${fr(chord(R))} cm.`);
  tracing.push(`Avec un mètre ruban (ou une ficelle et une craie) tenu en C, tracez l’arc de COUPE de taille à ${fr(rInCut)} cm (couture à ${fr(r)} cm + ${fr(WAIST_SA)} cm de marge).`);
  tracing.push(`Tracez l’arc de COUPE d’ourlet à ${fr(rOutCut)} cm (ourlet fini à ${fr(R)} cm + ${fr(hemA)} cm de marge). Mesurez souvent : marquez un point tous les 5 cm puis reliez-les.`);
  tracing.push(`Ajoutez ${fr(s)} cm de marge parallèlement à chaque bord droit, à l’extérieur de l’angle.`);
  if (notches.length) tracing.push(`Reportez les crans sur les bords droits, mesurés depuis la ligne de coupe de taille : ${notches.map((n) => `${n.label} à ${fr(n.from)} cm (${n.seam})`).join(', ')}.`);
  tracing.push(`Coupez dans le trait, puis faites tout de suite une piqûre de soutien à 0,8 cm du bord de taille pour qu’il ne se déforme pas.`);

  // ---------- 12. Montage ----------
  const assembly = [];
  assembly.push('Stabiliser la taille (piqûre de soutien ou ruban droit-fil).');
  if (a.poches) assembly.push('Coudre les sacs de poche sur les côtés, entre les crans.');
  if (zip) assembly.push(`Poser la fermeture dans la couture ${seams.closure}, jusqu’au cran.`);
  if (a.fermeture === 'boutons' || a.fermeture === 'agrafes') assembly.push(`Monter la patte et la sous-patte dans la couture ${seams.closure}.`);
  assembly.push(`Assembler les coutures restantes (${seamType.label.toLowerCase()}).`);
  if (slit) assembly.push(`Arrêter la couture ${slit.seam} au cran de fente, replier et surpiquer les bords de fente.`);
  if (lining) assembly.push('Assembler la doublure de la même façon et la bâtir à la taille, envers contre envers.');
  if (a.finition === 'ceinture') assembly.push('Entoiler la ceinture, la monter sur la taille, la refermer et surpiquer.');
  if (a.finition === 'parementure') assembly.push('Entoiler et assembler les parementures, les coudre à la taille, dégarnir, retourner, sous-piquer.');
  if (a.finition === 'elastique') assembly.push('Fermer la ceinture en anneau, la coudre à la taille en laissant 5 cm ouverts, passer l’élastique, fermer.');
  if (a.finition === 'biais') assembly.push('Coudre le biais sur la taille, le rabattre à l’intérieur et surpiquer.');
  if (zip && a.finition === 'ceinture') assembly.push(a.fermeture === 'invisible' ? 'Coudre l’agrafe en haut de la ceinture.' : 'Faire la boutonnière ou poser l’agrafe sur la ceinture.');
  if (a.fermeture === 'boutons') assembly.push('Faire les boutonnières sur la patte (et la ceinture), puis coudre les boutons.');
  if (a.fermeture === 'agrafes') assembly.push('Coudre les agrafes ou poser les pressions le long de la patte.');
  if (a.finition === 'elastique' && zip) assembly.push('Avec une ceinture élastique, la fermeture est facultative : vous pouvez l’omettre.');
  assembly.push(`Suspendre la jupe 24 h${hemReserve ? ', ' : ' (surtout en tissu fluide), '}régulariser la longueur puis faire l’ourlet (${hemType.label.toLowerCase()}).`);

  return {
    ok: true,
    label,
    fractionKey,
    f,
    k,
    angle,
    seams,
    W, H, L, laize, Wf,
    r, R, rInCut, rOutCut,
    Lp, bandH,
    waistSA: WAIST_SA,
    s, hemA, hemCirc,
    opening, zip, slit,
    notches,
    layout,
    fabricLength,
    buyLength,
    lining,
    supplies,
    cutList,
    adaptations,
    warnings,
    tracing,
    assembly,
    chordAtHem: chord(R),
  };
}
