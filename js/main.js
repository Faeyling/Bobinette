import { GARMENTS, SECTIONS } from './data/garments.js';
import { computeCircleSkirt } from './calc/circleSkirt.js';
import { mascotSVG, mascotHeadSVG } from './svg/mascot.js';
import { bodySVG } from './svg/body.js';
import { patternMini, patternDiagram, layoutDiagram, fabricSVG } from './svg/pattern.js';
import { optionIcon } from './svg/icons.js';
import { listProjects, saveProject, deleteProject, getProject, summaryText, fichePNG, ficheHTML, shareFiles, copyText, download, slug } from './export.js';

const app = document.getElementById('app');
const STORE_KEY = 'bobinette.reponses.v1';

// ---------- état ----------
let answers = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch {
    return {};
  }
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(answers));
  } catch {
    /* stockage indisponible : on continue sans mémoriser */
  }
}

const num = (x, d = 1) => (Number.isFinite(+x) ? (+x).toLocaleString('fr-FR', { maximumFractionDigits: d }) : '—');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const val = (v, a) => (typeof v === 'function' ? v(a) : v);

const garmentById = (id) => GARMENTS.find((g) => g.id === id && !g.soon);
const activeQuestions = (g) => g.questions.filter((q) => !q.condition || q.condition(answers));

// ---------- routage (#/…) ----------
function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}
window.addEventListener('hashchange', render);

function parseRoute() {
  const [path, query] = location.hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query || '');
  return { parts, params };
}

function render() {
  const { parts, params } = parseRoute();
  const [view, gid, idx] = parts;
  const g = gid && garmentById(gid);
  window.scrollTo({ top: 0 });
  if (view === 'q' && g) return renderQuestion(g, Math.max(0, +idx || 0), params.get('from'));
  if (view === 'recap' && g) return renderRecap(g);
  if (view === 'resultat' && g) return renderResult(g);
  if (view === 'choisir') return renderCatalog();
  if (view === 'projet') return openProject(gid);
  return renderHome();
}

// ---------- accueil ----------
function renderHome() {
  app.innerHTML = `
  <section class="home">
    <div class="home-hero">
      <div class="home-mascot">${mascotSVG({ mood: 'hello', size: 220 })}</div>
      <div>
        <p class="eyebrow">Bonjour, je suis Bobinette !</p>
        <h1>Vos mesures de couture, calculées pour vous.</h1>
        <p class="lead">Choisissez un vêtement, répondez à quelques questions guidées pas à pas — où poser le mètre ruban, comment le tenir — et je calcule le patron, les marges et le plan de coupe sur votre tissu.</p>
        <button class="btn btn-primary" data-go="#/choisir">Commencer</button>
      </div>
    </div>
    <ol class="how">
      <li><span class="how-n">1</span><strong>Je choisis</strong> le vêtement à coudre.</li>
      <li><span class="how-n">2</span><strong>Je mesure</strong> guidée par les illustrations.</li>
      <li><span class="how-n">3</span><strong>Je vérifie</strong> les détails : fermeture, ourlet, coutures…</li>
      <li><span class="how-n">4</span><strong>Je coupe</strong> avec le patron coté et le plan de coupe.</li>
    </ol>
    ${projectsBlock()}
  </section>`;
  app.querySelectorAll('[data-del]').forEach((b) =>
    b.addEventListener('click', () => {
      const p = getProject(b.dataset.del);
      if (p && confirm(`Supprimer « ${p.name} » ?`)) {
        deleteProject(p.id);
        renderHome();
      }
    })
  );
}

function projectsBlock() {
  const list = listProjects().filter((p) => garmentById(p.garmentId));
  if (!list.length) return '';
  return `<h2 class="family">Mes projets enregistrés</h2>
    <ul class="projects">${list.map((p) => `
      <li>
        <a href="#/projet/${p.id}">
          <strong>${esc(p.name)}</strong>
          <small>taille ${num(p.answers.taille)} · longueur ${num(p.answers.longueur)} cm · ${new Date(p.date).toLocaleDateString('fr-FR')}</small>
        </a>
        <button class="icon-btn" data-del="${p.id}" aria-label="Supprimer ${esc(p.name)}">✕</button>
      </li>`).join('')}</ul>`;
}

function openProject(id) {
  const p = getProject(id);
  if (!p || !garmentById(p.garmentId)) return go('#/');
  answers = { ...p.answers };
  save();
  go(`#/resultat/${p.garmentId}`);
}

// ---------- petit message de confirmation ----------
let toastTimer;
function toast(text) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 3200);
}

// ---------- catalogue ----------
function renderCatalog() {
  const families = [...new Set(GARMENTS.map((g) => g.family))];
  app.innerHTML = `
  <section class="catalog">
    <h1>Que voulez-vous coudre ?</h1>
    ${families.map((fam) => `
      <h2 class="family">${fam}</h2>
      <div class="cards">
        ${GARMENTS.filter((g) => g.family === fam).map((g) => `
          <button class="card garment ${g.soon ? 'is-soon' : ''}" ${g.soon ? 'disabled' : `data-go="#/q/${g.id}/0"`}>
            <div class="garment-ill">${g.fraction ? patternMini({ fraction: g.fraction }) : mascotHeadSVG(56)}</div>
            <div class="garment-txt">
              <strong>${g.name}</strong>
              <span>${g.desc}</span>
              ${g.soon ? '<em class="badge">Bientôt</em>' : ''}
            </div>
          </button>`).join('')}
      </div>`).join('')}
  </section>`;
}

// ---------- question ----------
function illustrationFor(q) {
  const ill = val(q.illustration, answers);
  if (!ill) return '';
  const blocks = [];
  if (ill.body) {
    blocks.push(`<figure class="ill-box"><figcaption>Où mesurer</figcaption>${bodySVG({ port: answers.port || 'naturelle', ...ill.body })}</figure>`);
  }
  if (ill.mini) {
    blocks.push(`<figure class="ill-box"><figcaption>Sur le tissu</figcaption>${patternMini(ill.mini)}</figure>`);
  }
  if (ill.fabric) {
    blocks.push(`<figure class="ill-box"><figcaption>La laize</figcaption>${fabricSVG()}</figure>`);
  }
  return blocks.join('');
}

function renderQuestion(g, idx, from) {
  const qs = activeQuestions(g);
  if (idx >= qs.length) return go(`#/recap/${g.id}`);
  const q = qs[idx];
  if (answers[q.id] === undefined && q.default !== undefined) {
    answers[q.id] = val(q.default, answers);
    save();
  }
  const sectionIdx = Object.keys(SECTIONS).indexOf(q.section);
  const progress = Math.round(((idx + 1) / (qs.length + 1)) * 100);
  const intro = val(q.intro, answers);
  const ill = illustrationFor(q);

  let input = '';
  if (q.type === 'number') {
    const v = answers[q.id] ?? '';
    input = `
      <div class="num">
        <button class="num-btn" data-step="-1" aria-label="Diminuer">−</button>
        <input id="num" type="number" inputmode="decimal" min="${q.min}" max="${q.max}" step="${q.step}" value="${esc(v)}" placeholder="0" aria-label="${esc(q.title)} en ${q.unit}">
        <span class="unit">${q.unit}</span>
        <button class="num-btn" data-step="1" aria-label="Augmenter">+</button>
      </div>
      ${q.quick ? `<div class="chips">${q.quick.map((c) => `<button class="chip" data-quick="${c.value}">${c.label}${c.label.includes('cm') ? '' : ` · ${num(c.value)} cm`}</button>`).join('')}</div>` : ''}
      ${q.quickNote ? `<p class="small">${q.quickNote}</p>` : ''}
      <p class="msg" id="msg" role="status"></p>`;
  } else if (q.type === 'choice') {
    input = `<div class="options" role="radiogroup">
      ${q.options.map((o) => `
        <button class="option ${answers[q.id] === o.value ? 'is-on' : ''}" role="radio" aria-checked="${answers[q.id] === o.value}" data-choice="${o.value}">
          ${optionIcon(q.id, o.value, o.label)}
          <span class="option-txt"><strong>${o.label}</strong><span>${o.desc}</span></span>
        </button>`).join('')}
    </div>`;
  } else if (q.type === 'boolean') {
    input = `<div class="options options-2" role="radiogroup">
      <button class="option ${answers[q.id] === true ? 'is-on' : ''}" role="radio" aria-checked="${answers[q.id] === true}" data-bool="1"><span class="option-txt"><strong>${q.yes}</strong></span></button>
      <button class="option ${answers[q.id] === false ? 'is-on' : ''}" role="radio" aria-checked="${answers[q.id] === false}" data-bool="0"><span class="option-txt"><strong>${q.no}</strong></span></button>
    </div>`;
  }

  app.innerHTML = `
  <section class="question">
    <div class="q-head">
      <a class="crumb" href="#/choisir">${g.name}</a>
      <div class="q-sections">${Object.entries(SECTIONS).map(([k, l], i) => `<span class="${i < sectionIdx ? 'done' : i === sectionIdx ? 'on' : ''}">${l}</span>`).join('')}</div>
      <div class="bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><span style="width:${progress}%"></span></div>
    </div>
    <div class="q-grid ${ill ? '' : 'no-ill'}">
      ${ill ? `<div class="q-ill" id="ill">${ill}</div>` : ''}
      <div class="q-body">
        <p class="eyebrow">Question ${idx + 1} sur ${qs.length}</p>
        <h1>${q.title}</h1>
        ${intro ? `<p class="lead">${intro}</p>` : ''}
        ${q.steps ? `<ol class="steps">${q.steps.map((s) => `<li>${s}</li>`).join('')}</ol>` : ''}
        ${input}
        ${q.onFabric ? `<div class="on-fabric"><strong>Sur le tissu :</strong> ${q.onFabric}</div>` : ''}
        ${q.tip ? `<div class="tip">${mascotHeadSVG(44)}<p>${q.tip}</p></div>` : ''}
      </div>
    </div>
    <nav class="q-nav">
      <button class="btn btn-ghost" id="prev">← ${idx === 0 ? 'Vêtements' : 'Précédent'}</button>
      <button class="btn btn-primary" id="next">${from === 'recap' ? 'Retour au récapitulatif' : idx === qs.length - 1 ? 'Vérifier' : 'Suivant'} →</button>
    </nav>
  </section>`;

  const msg = app.querySelector('#msg');
  const field = app.querySelector('#num');

  const check = () => {
    if (q.type !== 'number') return true;
    const raw = String(field.value).replace(',', '.');
    const v = parseFloat(raw);
    if (raw === '' || !Number.isFinite(v)) {
      msg.textContent = 'Indiquez une mesure en centimètres.';
      msg.className = 'msg is-err';
      return false;
    }
    if (v < q.min || v > q.max) {
      msg.textContent = `La mesure doit être comprise entre ${num(q.min)} et ${num(q.max)} ${q.unit}.`;
      msg.className = 'msg is-err';
      return false;
    }
    const w = q.validate && q.validate(v, answers);
    msg.textContent = w || '';
    msg.className = w ? 'msg is-warn' : 'msg';
    return true;
  };

  const setNum = (v) => {
    const clean = Math.round(v / q.step) * q.step;
    field.value = +clean.toFixed(2);
    answers[q.id] = +field.value;
    save();
    check();
    refreshIll();
  };
  const refreshIll = () => {
    const box = app.querySelector('#ill');
    if (box) box.innerHTML = illustrationFor(q);
  };

  if (field) {
    field.addEventListener('input', () => {
      const v = parseFloat(String(field.value).replace(',', '.'));
      if (Number.isFinite(v)) {
        answers[q.id] = v;
        save();
        refreshIll();
      }
      msg.textContent = '';
    });
    field.addEventListener('change', check);
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') app.querySelector('#next').click();
    });
    app.querySelectorAll('[data-step]').forEach((b) =>
      b.addEventListener('click', () => {
        const cur = parseFloat(field.value) || (q.min + q.max) / 4;
        setNum(Math.min(q.max, Math.max(q.min, cur + +b.dataset.step * (q.step < 1 ? 0.5 : 1))));
      })
    );
    app.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => setNum(+b.dataset.quick)));
    if (!field.value) field.focus();
  }
  app.querySelectorAll('[data-choice]').forEach((b) =>
    b.addEventListener('click', () => {
      answers[q.id] = b.dataset.choice;
      save();
      renderQuestion(g, idx, from);
    })
  );
  app.querySelectorAll('[data-bool]').forEach((b) =>
    b.addEventListener('click', () => {
      answers[q.id] = b.dataset.bool === '1';
      save();
      renderQuestion(g, idx, from);
    })
  );

  app.querySelector('#prev').addEventListener('click', () => go(idx === 0 ? '#/choisir' : `#/q/${g.id}/${idx - 1}`));
  app.querySelector('#next').addEventListener('click', () => {
    if (!check()) {
      field && field.focus();
      return;
    }
    if (q.type !== 'number' && answers[q.id] === undefined) return;
    if (from === 'recap') return go(`#/recap/${g.id}`);
    // Les conditions peuvent avoir changé : on recalcule la liste avant d'avancer.
    const list = activeQuestions(g);
    const pos = list.findIndex((x) => x.id === q.id);
    go(pos + 1 >= list.length ? `#/recap/${g.id}` : `#/q/${g.id}/${pos + 1}`);
  });
}

// ---------- récapitulatif / vérifications ----------
function formatAnswer(q) {
  const v = answers[q.id];
  if (v === undefined || v === '') return '<em class="missing">à renseigner</em>';
  if (q.type === 'number') return `${num(v)} ${q.unit}`;
  if (q.type === 'boolean') return v ? q.yes : q.no;
  return q.options.find((o) => o.value === v)?.label ?? v;
}

function missingQuestions(g) {
  return activeQuestions(g).filter((q) => answers[q.id] === undefined || answers[q.id] === '');
}

function renderRecap(g) {
  const qs = activeQuestions(g);
  const missing = missingQuestions(g);
  const res = missing.length ? null : computeCircleSkirt(g.id, answers);
  const checks = res ? [...(res.errors || []).map((t) => ({ t, k: 'err' })), ...res.warnings.map((t) => ({ t, k: 'warn' }))] : [];

  app.innerHTML = `
  <section class="recap">
    <div class="recap-head">
      ${mascotSVG({ mood: checks.some((c) => c.k === 'err') ? 'oops' : 'think', size: 130 })}
      <div>
        <p class="eyebrow">${g.name}</p>
        <h1>Vérifions ensemble</h1>
        <p class="lead">Relisez vos réponses : chaque détail (fermeture, ourlet, coutures, fente…) modifie les marges et les mesures. Touchez une ligne pour la corriger.</p>
      </div>
    </div>
    ${checks.length ? `<ul class="alerts">${checks.map((c) => `<li class="alert alert-${c.k}">${c.t}</li>`).join('')}</ul>` : ''}
    ${Object.entries(SECTIONS).map(([sec, label]) => `
      <h2 class="family">${label}</h2>
      <ul class="recap-list">
        ${qs.filter((q) => q.section === sec).map((q) => {
          const i = qs.indexOf(q);
          return `<li><a href="#/q/${g.id}/${i}?from=recap"><span>${q.title}</span><strong>${formatAnswer(q)}</strong><span class="edit" aria-hidden="true">Modifier</span></a></li>`;
        }).join('')}
      </ul>`).join('')}
    <nav class="q-nav">
      <button class="btn btn-ghost" data-go="#/q/${g.id}/${qs.length - 1}">← Précédent</button>
      <button class="btn btn-primary" id="calc" ${missing.length || (res && !res.ok) ? 'disabled' : ''}>Calculer mes mesures →</button>
    </nav>
  </section>`;
  app.querySelector('#calc').addEventListener('click', () => go(`#/resultat/${g.id}`));
}

// ---------- résultat ----------
function renderResult(g) {
  if (missingQuestions(g).length) return go(`#/recap/${g.id}`);
  const r = computeCircleSkirt(g.id, answers);
  if (!r.ok) return go(`#/recap/${g.id}`);

  const key = [
    { k: 'Rayon de taille (couture)', v: `${num(r.r)} cm`, s: `coupe à ${num(r.rInCut)} cm du centre` },
    { k: 'Longueur du panneau', v: `${num(r.Lp)} cm`, s: r.bandH ? `+ ${num(r.bandH)} cm de ceinture` : 'de la taille à l’ourlet fini' },
    { k: 'Rayon d’ourlet (coupe)', v: `${num(r.rOutCut)} cm`, s: `dont ${num(r.hemA)} cm de marge d’ourlet` },
    { k: 'Tissu à acheter', v: `${r.buyLength} cm`, s: `en ${num(r.laize, 0)} cm de laize` },
  ];

  app.innerHTML = `
  <section class="result">
    <div class="result-head">
      ${mascotSVG({ mood: 'happy', size: 140 })}
      <div>
        <p class="eyebrow">C’est prêt !</p>
        <h1>Votre ${g.name.toLowerCase()}</h1>
        <p class="lead">Taille ${num(r.W)} cm · hanches ${num(r.H)} cm · longueur ${num(r.L)} cm — coupée en <strong>${r.k} panneau${r.k > 1 ? 'x' : ''}</strong> (${r.seams.text}).</p>
        <div class="actions no-print">
          <a class="btn btn-ghost" href="#/recap/${g.id}">Modifier mes réponses</a>
        </div>
      </div>
    </div>

    <div class="export no-print" aria-label="Enregistrer et partager">
      <button class="exp" data-act="save"><span class="exp-i" aria-hidden="true">♡</span><span><strong>Enregistrer</strong><small>dans Mes projets</small></span></button>
      <button class="exp" data-act="share"><span class="exp-i" aria-hidden="true">↗</span><span><strong>Partager</strong><small>Drive, message, e-mail…</small></span></button>
      <button class="exp" data-act="copy"><span class="exp-i" aria-hidden="true">❏</span><span><strong>Copier le résumé</strong><small>à coller dans une conversation</small></span></button>
      <button class="exp" data-act="image"><span class="exp-i" aria-hidden="true">▣</span><span><strong>Image de la fiche</strong><small>PNG, patron + plan de coupe</small></span></button>
      <button class="exp" data-act="html"><span class="exp-i" aria-hidden="true">⤓</span><span><strong>Fiche complète</strong><small>fichier HTML à garder</small></span></button>
      <button class="exp" data-act="print"><span class="exp-i" aria-hidden="true">⎙</span><span><strong>Imprimer</strong><small>ou enregistrer en PDF</small></span></button>
    </div>

    <div class="keys">${key.map((x) => `<div class="key"><span>${x.k}</span><strong>${x.v}</strong><small>${x.s}</small></div>`).join('')}</div>

    ${r.warnings.length ? `<ul class="alerts">${r.warnings.map((w) => `<li class="alert alert-warn">${w}</li>`).join('')}</ul>` : ''}

    <div class="panel">
      <h2>Le panneau de jupe</h2>
      <p class="small">Schéma à l’échelle. Le point C est le centre du cercle : toutes les courbes se tracent depuis ce point.</p>
      <div class="diagram">${patternDiagram(r)}</div>
    </div>

    <div class="panel">
      <h2>Tracer sur le tissu</h2>
      <ol class="steps">${r.tracing.map((t) => `<li>${t}</li>`).join('')}</ol>
    </div>

    <div class="panel">
      <h2>Plan de coupe</h2>
      <p class="small">Tissu déplié en une seule épaisseur, endroit vers le haut. Les pièces ne se chevauchent pas ; elles peuvent être retournées si le tissu n’a pas d’endroit.</p>
      <div class="diagram">${layoutDiagram(r.layout)}</div>
      ${r.lining && r.lining.fits ? `<h3>Doublure</h3><div class="diagram">${layoutDiagram(r.lining.layout, { title: 'tissu de doublure' })}</div>` : ''}
    </div>

    <div class="cols">
      <div class="panel">
        <h2>Pièces à couper</h2>
        <table class="table">
          <thead><tr><th>Pièce</th><th>Nb</th><th>Dimensions</th></tr></thead>
          <tbody>${r.cutList.map((c) => `<tr><td>${c.name}<br><small>${c.fabric}</small></td><td>${c.qty}</td><td>${c.dims}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="panel">
        <h2>Fournitures</h2>
        <ul class="supplies">${r.supplies.map((s) => `<li><span>${s.label}${s.detail ? `<small>${s.detail}</small>` : ''}</span><strong>${s.qty}</strong></li>`).join('')}</ul>
      </div>
    </div>

    <div class="panel">
      <h2>Ce que Bobinette a adapté</h2>
      <ul class="adapt">${r.adaptations.map((a) => `<li><strong>${a.title}</strong><p>${a.text}</p></li>`).join('')}</ul>
    </div>

    <div class="panel">
      <h2>Ordre de montage</h2>
      <ol class="steps">${r.assembly.map((t) => `<li>${t}</li>`).join('')}</ol>
    </div>

    <nav class="q-nav no-print">
      <a class="btn btn-ghost" href="#/choisir">Coudre autre chose</a>
      <button class="btn btn-primary" data-act="share">Partager la fiche</button>
    </nav>
  </section>`;

  const root = app.querySelector('.result');
  const base = `bobinette-${slug(g.name)}`;
  const text = () => summaryText(g, r);
  const actions = {
    save: () => {
      const p = saveProject(g, answers);
      toast(p ? `Enregistré dans Mes projets : « ${p.name} »` : 'Impossible d’enregistrer sur cet appareil (stockage plein ou désactivé).');
    },
    copy: async () => toast((await copyText(text())) ? 'Résumé copié : collez-le dans votre conversation.' : 'La copie a échoué.'),
    image: async () => download(await fichePNG(g, r, root), `${base}.png`),
    html: async () => download(new Blob([await ficheHTML(g, root)], { type: 'text/html' }), `${base}.html`),
    print: () => window.print(),
    share: async () => {
      toast('Préparation de la fiche…');
      const png = await fichePNG(g, r, root);
      const file = new File([png], `${base}.png`, { type: 'image/png' });
      const status = await shareFiles({ files: [file], title: `${g.name} — Bobinette`, text: text() });
      if (status === 'shared') toast('Fiche partagée.');
      else if (status === 'unsupported') {
        // Ordinateur sans menu de partage : on télécharge l'image et on copie le texte.
        download(png, `${base}.png`);
        const ok = await copyText(text());
        toast(`Image téléchargée${ok ? ' et résumé copié' : ''} : déposez-la dans votre Drive ou votre conversation.`);
      } else {
        toast('Partage annulé.');
      }
    },
  };
  root.querySelectorAll('[data-act]').forEach((b) =>
    b.addEventListener('click', async () => {
      b.disabled = true;
      try {
        await actions[b.dataset.act]();
      } catch (e) {
        console.error(e);
        toast('Oups, l’export a échoué. Réessayez ou utilisez « Imprimer ».');
      } finally {
        b.disabled = false;
      }
    })
  );
}

// ---------- délégation des liens data-go ----------
app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-go]');
  if (el && !el.disabled) go(el.dataset.go);
});

document.getElementById('logo').innerHTML = mascotHeadSVG(36);
render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
