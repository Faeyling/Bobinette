// Enregistrement des projets et export du résultat (partage, image, texte, fiche HTML).

const PROJECTS_KEY = 'bobinette.projets.v1';
const fr = (x, d = 1) => (+x).toLocaleString('fr-FR', { maximumFractionDigits: d });

// ---------- projets enregistrés (sur l'appareil) ----------
export function listProjects() {
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [];
  } catch {
    return [];
  }
}

function writeProjects(list) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function saveProject(garment, answers, name) {
  const list = listProjects();
  const date = new Date();
  const project = {
    id: `${date.getTime().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    garmentId: garment.id,
    name: name || `${garment.name} — ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`,
    date: date.toISOString(),
    answers: { ...answers },
  };
  list.unshift(project);
  return writeProjects(list.slice(0, 50)) ? project : null;
}

export function deleteProject(id) {
  writeProjects(listProjects().filter((p) => p.id !== id));
}

export function getProject(id) {
  return listProjects().find((p) => p.id === id);
}

// ---------- résumé texte (pour une conversation) ----------
export function summaryText(garment, r) {
  const lines = [
    `🧵 ${garment.name} — calculée avec Bobinette`,
    '',
    `Mesures : taille ${fr(r.W)} cm · hanches ${fr(r.H)} cm · longueur ${fr(r.L)} cm`,
    `Coupe : ${r.k} panneau${r.k > 1 ? 'x' : ''} de ${fr(r.angle)}° (${r.seams.text})`,
    '',
    '✂️ Patron (depuis le centre C)',
    `• Rayon de taille : couture ${fr(r.r)} cm → coupe ${fr(r.rInCut)} cm`,
    `• Longueur du panneau : ${fr(r.Lp)} cm${r.bandH ? ` (+ ${fr(r.bandH)} cm de ceinture)` : ''}`,
    `• Rayon d’ourlet : fini ${fr(r.R)} cm → coupe ${fr(r.rOutCut)} cm`,
    `• Marges : coutures ${fr(r.s)} cm · taille ${fr(r.waistSA)} cm · ourlet ${fr(r.hemA)} cm`,
  ];
  if (r.notches.length) {
    lines.push('', '📍 Crans (depuis le bord de taille)');
    r.notches.forEach((n) => lines.push(`• ${n.label} (${n.seam}) : ${fr(n.from)} cm`));
  }
  lines.push('', '📋 Pièces à couper');
  r.cutList.forEach((c) => lines.push(`• ${c.name} ×${c.qty} — ${c.dims} (${c.fabric})`));
  lines.push('', '🛍️ Fournitures');
  r.supplies.forEach((s) => lines.push(`• ${s.label} : ${s.qty}${s.detail ? ` — ${s.detail}` : ''}`));
  if (r.warnings.length) {
    lines.push('', '⚠️ À savoir');
    r.warnings.forEach((w) => lines.push(`• ${w}`));
  }
  return lines.join('\n');
}

// ---------- SVG → image ----------
/** Remplace les var(--x) par leur valeur actuelle, pour un SVG autonome. */
function resolveVars(svgText) {
  const cs = getComputedStyle(document.documentElement);
  return svgText.replace(/var\((--[\w-]+)\)/g, (_, name) => cs.getPropertyValue(name).trim() || '#000');
}

function standaloneSVG(svgEl, width, height) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', width);
  clone.setAttribute('height', height);
  const css = `text{font-family:${getComputedStyle(document.body).fontFamily}}.note{fill:var(--ink-soft)}.lbl{fill:var(--ink);font-weight:600}.dim-t{fill:var(--ink)}`;
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = css;
  clone.insertBefore(style, clone.firstChild);
  return resolveVars(new XMLSerializer().serializeToString(clone));
}

function loadSVGImage(svgEl, width) {
  const vb = svgEl.viewBox.baseVal;
  const height = Math.round((width * vb.height) / vb.width);
  const text = standaloneSVG(svgEl, width, height);
  const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ img, width, height }); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/** Fiche image (PNG) : titre, chiffres clés, panneau coté, plan de coupe, pièces et fournitures. */
export async function fichePNG(garment, r, root) {
  const cs = getComputedStyle(document.documentElement);
  const col = (n) => cs.getPropertyValue(n).trim();
  const W = 1240, M = 56, inner = W - 2 * M;
  const serif = getComputedStyle(document.querySelector('h1') || document.body).fontFamily;
  const sans = getComputedStyle(document.body).fontFamily;

  const mascot = root.querySelector('.result-head .mascot');
  const pattern = root.querySelector('.ill-pattern');
  const layouts = [...root.querySelectorAll('.ill-layout')];
  const [mImg, pImg, ...lImgs] = await Promise.all([
    mascot ? loadSVGImage(mascot, 150) : null,
    loadSVGImage(pattern, Math.min(inner, 820)),
    ...layouts.map((l) => loadSVGImage(l, inner)),
  ]);

  // Mesure du texte pour connaître la hauteur totale.
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = `22px ${sans}`;
  const listLines = [
    ...r.cutList.map((c) => `• ${c.name} ×${c.qty} — ${c.dims}`),
    '',
    ...r.supplies.map((s) => `• ${s.label} : ${s.qty}`),
  ].flatMap((t) => (t ? wrapText(measure, t, inner) : ['']));

  const H = M + 170 + 140 + 40 + pImg.height + 40 + lImgs.reduce((s, l) => s + l.height + 60, 0) + 60 + listLines.length * 32 + M + 40;
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = col('--bg');
  ctx.fillRect(0, 0, W, H);

  let y = M;
  if (mImg) ctx.drawImage(mImg.img, M, y - 10, mImg.width, mImg.height);
  ctx.fillStyle = col('--accent-strong');
  ctx.font = `600 20px ${sans}`;
  ctx.fillText('BOBINETTE · FICHE DE COUPE', M + 180, y + 40);
  ctx.fillStyle = col('--ink');
  ctx.font = `600 46px ${serif}`;
  ctx.fillText(garment.name, M + 180, y + 95);
  ctx.font = `22px ${sans}`;
  ctx.fillText(`Taille ${fr(r.W)} cm · hanches ${fr(r.H)} cm · longueur ${fr(r.L)} cm · ${r.k} panneau${r.k > 1 ? 'x' : ''}`, M + 180, y + 135);
  y += 170;

  const keys = [
    ['Rayon de taille', `${fr(r.r)} cm`, `coupe ${fr(r.rInCut)} cm`],
    ['Longueur panneau', `${fr(r.Lp)} cm`, r.bandH ? `+ ${fr(r.bandH)} cm ceinture` : 'taille → ourlet'],
    ['Rayon d’ourlet', `${fr(r.rOutCut)} cm`, `marge ${fr(r.hemA)} cm`],
    ['Tissu', `${r.buyLength} cm`, `laize ${fr(r.laize, 0)} cm`],
  ];
  const kw = (inner - 3 * 16) / 4;
  keys.forEach(([k, v, s], i) => {
    const x = M + i * (kw + 16);
    ctx.fillStyle = col('--paper');
    ctx.strokeStyle = col('--line');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, kw, 120, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = col('--ink-soft');
    ctx.font = `18px ${sans}`;
    ctx.fillText(k, x + 16, y + 32);
    ctx.fillStyle = col('--ink');
    ctx.font = `600 36px ${serif}`;
    ctx.fillText(v, x + 16, y + 76);
    ctx.fillStyle = col('--ink-soft');
    ctx.font = `17px ${sans}`;
    ctx.fillText(s, x + 16, y + 104);
  });
  y += 140 + 40;

  ctx.drawImage(pImg.img, M + (inner - pImg.width) / 2, y, pImg.width, pImg.height);
  y += pImg.height + 40;
  lImgs.forEach((l, i) => {
    ctx.fillStyle = col('--ink');
    ctx.font = `600 28px ${serif}`;
    ctx.fillText(i === 0 ? 'Plan de coupe' : 'Plan de coupe — doublure', M, y + 10);
    ctx.drawImage(l.img, M, y + 30, l.width, l.height);
    y += l.height + 60;
  });

  ctx.fillStyle = col('--ink');
  ctx.font = `600 28px ${serif}`;
  ctx.fillText('Pièces et fournitures', M, y + 10);
  y += 50;
  ctx.font = `22px ${sans}`;
  for (const line of listLines) {
    ctx.fillText(line, M, y);
    y += 32;
  }
  ctx.fillStyle = col('--ink-soft');
  ctx.font = `17px ${sans}`;
  ctx.fillText('Calculé avec Bobinette · mesures en centimètres', M, H - M / 2);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Fiche HTML autonome (styles intégrés), lisible hors de l'application. */
export async function ficheHTML(garment, root) {
  let css = '';
  try {
    css = await (await fetch('css/style.css')).text();
  } catch {
    css = '';
  }
  const section = root.cloneNode(true);
  section.querySelectorAll('.no-print').forEach((el) => el.remove());
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${garment.name} — Bobinette</title>
<style>${css}</style></head>
<body><main class="wrap">${section.outerHTML}</main>
<footer class="foot">Fiche générée par Bobinette le ${new Date().toLocaleDateString('fr-FR')}</footer></body></html>`;
}

// ---------- envoi ----------
export function slug(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Ouvre le menu de partage du système (Drive, messagerie, e-mail…).
 * @returns {'shared'|'cancelled'|'unsupported'}
 */
export async function shareFiles({ files = [], title, text }) {
  if (!navigator.share) return 'unsupported';
  const data = { title, text };
  if (files.length && navigator.canShare && navigator.canShare({ files })) data.files = files;
  else if (files.length) return 'unsupported';
  try {
    await navigator.share(data);
    return 'shared';
  } catch (e) {
    return e && e.name === 'AbortError' ? 'cancelled' : 'unsupported';
  }
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
