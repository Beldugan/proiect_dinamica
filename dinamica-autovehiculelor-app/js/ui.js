/* ===================================================================
   UI.JS — populare formular, citire valori, orchestrare calcule,
   randare rezultate (tabele + KPI) in fiecare panel.
   =================================================================== */

const State = {
  params: null,
  results: null
};

function $(id) { return document.getElementById(id); }

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._tm);
  toast._tm = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------------------------------------------------------------
   Populare select-uri din BookData
   --------------------------------------------------------------- */
function populateSelects() {
  const anv = $('anvelopaSelect');
  BookData.anvelope.forEach((a, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${a.simbol} (Dn=${a.Dn}mm, ${a.presiune} bar)`;
    anv.appendChild(opt);
  });
  anv.addEventListener('change', () => {
    const a = BookData.anvelope[anv.value];
    if (!a) return;
    $('Dn_in').value = a.Dn / 25.4;
    $('d_in').value = a.d_in;
  });

  const caro = $('caroserieSelect');
  BookData.tipuriCaroserie.forEach((c, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${c.nume} (Cx=${c.Cx})`;
    caro.appendChild(opt);
  });
  caro.addEventListener('change', () => {
    const c = BookData.tipuriCaroserie[caro.value];
    if (!c) return;
    $('Cx').value = c.Cx;
    $('A').value = c.A;
    recalcAerodinamic();
  });

  const drumF = $('drumFranareSelect');
  BookData.drumuriFranare.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${d.nume} (\u03c6=${d.phi}, f=${d.f})`;
    drumF.appendChild(opt);
  });
  drumF.addEventListener('change', () => {
    const d = BookData.drumuriFranare[drumF.value];
    if (!d) return;
    $('phiFranare').value = d.phi;
    $('fFranare').value = d.f;
  });

  $('tipAutovehicul').addEventListener('change', (e) => {
    const idx = e.target.value;
    if (idx === 'custom') return;
    const c = BookData.coordonateCG[idx];
    $('bL_incarcat').value = c.bL_inc;
    $('hgL_incarcat').value = c.hgL_inc;
  });
}

function recalcAerodinamic() {
  const Cx = parseFloat($('Cx').value);
  if (!isNaN(Cx)) {
    const k = 0.6125 * Cx; // rel 3.61
    $('Cx').setAttribute('title', `k aerodinamic = ${k.toFixed(4)} kg/m3`);
  }
}

/* ---------------------------------------------------------------
   Incarcare valori in formular dintr-un obiect params
   --------------------------------------------------------------- */
const FIELD_IDS = [
  'G_total_daN','G0_daN','nPersoane','Gpersoana_daN','L','bL_incarcat',
  'hgL_incarcat','hgL_descarcat','motorType','Pen','nn','nmin','nmax','ke',
  'Qinf','eta_l','Dn_in','d_in','lambda','f0','f02','Cx','A',
  'eta_cd','eta_cv','eta_c','eta_0','eta_f','nvmax_factor','alphaMax_deg',
  'icvI_book','nTrepte','phi_drum','phiFranare','fFranare','t0','t1p','t1pp',
  'E1','E2','thetaImax_deg'
];

function loadParamsToForm(p) {
  FIELD_IDS.forEach(id => {
    const el = $(id);
    if (el && p[id] !== undefined) el.value = p[id];
  });
  if ($('phiTransversal')) $('phiTransversal').value = p.phiTransversal || (p.phiFranare ? round(p.phiFranare * 0.8, 3) : 0.56);
}

function round(v, n) { return Engine.round(v, n); }

function readFormToParams() {
  const p = {};
  FIELD_IDS.forEach(id => {
    const el = $(id);
    if (!el) return;
    p[id] = (el.tagName === 'SELECT') ? el.value : parseFloat(el.value);
  });
  p.motorType = $('motorType').value;
  p.phiTransversal = parseFloat($('phiTransversal').value);
  return p;
}

function validateParams(p) {
  const errs = [];
  const reqPositive = ['G_total_daN','G0_daN','L','Pen','nn','nmax','Dn_in','d_in','A'];
  reqPositive.forEach(k => {
    if (isNaN(p[k]) || p[k] <= 0) errs.push(`Campul "${k}" trebuie sa fie un numar pozitiv.`);
  });
  if (p.nmax <= p.nmin) errs.push('Turatia maxima trebuie sa fie mai mare decat turatia minima.');
  if (p.G_total_daN <= p.G0_daN) errs.push('Greutatea totala trebuie sa fie mai mare decat greutatea proprie.');
  if (p.ke <= 0 || p.ke >= 1) errs.push('Coeficientul de elasticitate ke trebuie sa fie intre 0 si 1.');
  return errs;
}

/* =================================================================
   ORCHESTRARE CALCUL COMPLET
   ================================================================= */
function runFullCalculation(p) {
  const motorDef = BookData.motorTipuri.find(m => m.id === p.motorType) || BookData.motorTipuri[0];

  // 1. greutati / CG
  const gcg = Engine.greutatiSiCG(p);

  // 2. caracteristica externa
  const caracteristica = Engine.caracteristicaExterna({
    Pen: p.Pen, nn: p.nn, nmin: p.nmin, nmax: p.nmax, ke: p.ke,
    motorType: p.motorType, a1b1c1: motorDef.a1b1c1,
    Qinf: p.Qinf, eta_l: p.eta_l
  });

  // 3. pneu
  const pneu = Engine.calculPneu({ Dn_in: p.Dn_in, d_in: p.d_in, lambda: p.lambda });

  // 4. randament transmisie
  const eta_tr = Engine.randamentTransmisie({
    eta_cd: p.eta_cd, eta_cv: p.eta_cv, eta_c: p.eta_c, eta_0: p.eta_0, eta_f: p.eta_f
  });

  // 5. k aerodinamic + viteza maxima
  const k_aero = 0.6125 * p.Cx; // rel 3.61
  const Pmax_W = Math.max(...caracteristica.rows.map(r => r.Pe)) * 1000;
  const vmaxRes = Engine.vitezaMaxima({
    Pmax_W, f0: p.f0, f02: p.f02, G_N: gcg.G, k_aero, A: p.A, eta_tr
  });

  // 6. raport i0
  const i0Res = Engine.raportI0({ nvmax_factor: p.nvmax_factor, nn: p.nn, rr: pneu.rr, vmax_ms: vmaxRes.vmax_ms });

  // 7. raport treapta 1 (verificare + recomandare carte icvI_book)
  const treapta1Check = Engine.raportTreapta1({
    f0: p.f0, alphaMax_deg: p.alphaMax_deg, G_N: gcg.G, rr: pneu.rr,
    Mmax_daNm: Math.max(...caracteristica.rows.map(r => r.Me)),
    eta_tr, i0: i0Res.i0, a: gcg.a, hg: gcg.hg_inc, phi: p.phi_drum, L: p.L
  });

  const icv1 = p.icvI_book;

  // 8. trepte cutie viteze (serie geometrica)
  const nM = p.nn / (caracteristica.rows.reduce((best, r) => r.Me > best.Me ? r : best, caracteristica.rows[0]).n) * p.nn;
  // turatia de moment maxim reala (cea la care Me e maxim)
  const rowMmax = caracteristica.rows.reduce((best, r) => r.Me > best.Me ? r : best, caracteristica.rows[0]);
  const trepte = Engine.trepteCutie({ icv1, nn: p.nn, nM: rowMmax.n, nTrepte: p.nTrepte });

  // viteza max pe fiecare treapta
  const treptaSpeeds = trepte.rapoarte.map(icv => Engine.vitezaPeTreapta({ rr: pneu.rr, nmax: p.nmax, i0: i0Res.i0, icv }));

  // 9. bilant tractiune/putere pe fiecare treapta (folosit pt caracteristica
  //    de tractiune, putere, dinamica, accelerație și demaraj)
  const treptePopulate = trepte.rapoarte.map((icv, idx) => {
    const delta = Engine.deltaTreapta(icv);
    let rows = Engine.bilantPeTreapta({
      caracteristica, i0: i0Res.i0, icv, eta_tr, rr: pneu.rr,
      G_N: gcg.G, f0: p.f0, f02: p.f02, k_aero, A: p.A, deltaCoef: delta
    });
    rows = Engine.accelDemarare(rows, delta, 0);
    return { index: idx + 1, icv, delta, rows };
  });

  const demaraj = Engine.integrareDemarare(treptePopulate, rowMmax.n);

  // 10. franare
  const vListFranare = [3, 5, 8, 11, 15, 18, 20, 23, vmaxRes.vmax_ms];
  const franareRows = Engine.franare({
    phi: p.phiFranare, f: p.fFranare, k_aero, A: p.A, G_N: gcg.G,
    v_list: vListFranare, b: gcg.b, a_cg: gcg.a, L: p.L, hg: gcg.hg_inc
  });
  const opriri = franareRows.map(r => Engine.spatiuOprire({
    v: r.v, t0: p.t0, t1p: p.t1p, t1pp: p.t1pp, Sfmin: r.Sfmin
  }));

  const afrelList = [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0];
  const repartitieIncarcat = Engine.repartitieFranarePunti({
    afrel_list: afrelList, a_cg: gcg.a, b: gcg.b, L: p.L, hg: gcg.hg_inc
  });
  const repartitieDescarcat = Engine.repartitieFranarePunti({
    afrel_list: afrelList, a_cg: p.L - (gcg.b), b: gcg.b, L: p.L, hg: gcg.hg_desc
  });

  // 11. maniabilitate
  const Ep = 0.8 * p.E1;
  const RvList = [20,40,60,80,100,120,140,160,180,200,220,240,260,280,300];
  const manRes = Engine.maniabilitate({
    L: p.L, E1: p.E1, E2: p.E2, Ep, thetaImax_deg: p.thetaImax_deg, Rv_list: RvList
  });

  // 12. stabilitate longitudinala
  const stabLong = Engine.stabilitateLongitudinala({
    b: gcg.b, a_cg: gcg.a, hg: gcg.hg_inc, phi: p.phi_drum, L: p.L,
    k_aero, A: p.A, G_N: gcg.G
  });

  // 13. stabilitate transversala
  const stabTrans = Engine.stabilitateTransversala({
    Rv_list: [20,40,60,80,100,150,200,250,300], phi: p.phiFranare,
    phi1: p.phiTransversal, hg: gcg.hg_inc, E1: p.E1, E2: p.E2,
    betaList_deg: [0,2,4,6]
  });

  return {
    gcg, caracteristica, pneu, eta_tr, k_aero, vmaxRes, i0Res,
    treapta1Check, icv1, trepte, treptaSpeeds, treptePopulate, demaraj,
    franareRows, opriri, repartitieIncarcat, repartitieDescarcat,
    manRes, stabLong, stabTrans, vListFranare, afrelList
  };
}

/* =================================================================
   RANDARE TABELE / KPI — utilitare DOM
   ================================================================= */
function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c === null || c === undefined) return;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return e;
}

function kpi(label, value, unit = '', cls = '') {
  return el('div', { class: `kpi ${cls}` }, [
    el('div', { class: 'kpi-label' }, label),
    el('div', { class: 'kpi-value' }, [value + '', unit ? el('span', { class: 'small-unit' }, unit) : null])
  ]);
}

function dataTable({ caption, cols, rows, formulaTag }) {
  const wrap = el('div', { class: 'table-wrap' });
  const table = el('table', { class: 'data' });
  if (caption) table.appendChild(el('caption', {}, caption));
  const thead = el('thead');
  const trh = el('tr');
  cols.forEach(c => trh.appendChild(el('th', {}, c.label)));
  thead.appendChild(trh);
  table.appendChild(thead);
  const tbody = el('tbody');
  rows.forEach(r => {
    const tr = el('tr');
    cols.forEach(c => tr.appendChild(el('td', {}, c.fmt ? c.fmt(r) : String(r[c.key] ?? ''))));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

function sectionBlock(title, tag, formulaNote, contentNodes) {
  const block = el('div', { class: 'section-block' });
  block.appendChild(el('h3', {}, [title, tag ? el('span', { class: 'tag' }, tag) : null]));
  if (formulaNote) block.appendChild(el('p', { class: 'formula-note' }, formulaNote));
  (Array.isArray(contentNodes) ? contentNodes : [contentNodes]).forEach(n => n && block.appendChild(n));
  return block;
}

function fmt(n, d = 2) {
  if (n === undefined || n === null || isNaN(n)) return '—';
  return Number(n).toLocaleString('ro-RO', { minimumFractionDigits: d, maximumFractionDigits: d });
}
