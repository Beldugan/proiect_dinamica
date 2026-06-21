/* ===================================================================
   MAIN.JS — navigare panel-uri, randare rezultate per sectiune,
   gauge hero animat, init general.
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  populateSelects();
  loadParamsToForm(BookData.exemplulCartii);
  buildMobileTabs();
  wireNav();
  wireButtons();
  drawGaugeTicks();
});

/* ---------------- navigare intre panele ---------------- */
const PANEL_ORDER = ['panel-intro','panel-params','panel-tractiune','panel-franare','panel-maniabilitate','panel-raport'];

function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === id));
  document.querySelectorAll('.nav-step').forEach(n => n.classList.toggle('active', n.dataset.panel === id));
  document.querySelectorAll('#mobileTabs button').forEach(b => b.classList.toggle('active', b.dataset.panel === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function wireNav() {
  document.querySelectorAll('.nav-step').forEach(step => {
    step.addEventListener('click', () => {
      const target = step.dataset.panel;
      if (needsResultsFirst(target) && !State.results) {
        toast('Calculeaza mai intai proiectul din pasul "Parametri".');
        return;
      }
      showPanel(target);
    });
  });
}

function needsResultsFirst(panelId) {
  return ['panel-tractiune','panel-franare','panel-maniabilitate','panel-raport'].includes(panelId);
}

function buildMobileTabs() {
  const wrap = $('mobileTabs');
  const labels = { 'panel-intro':'00','panel-params':'01','panel-tractiune':'02','panel-franare':'03','panel-maniabilitate':'04','panel-raport':'05' };
  PANEL_ORDER.forEach(id => {
    const b = document.createElement('button');
    b.textContent = labels[id];
    b.dataset.panel = id;
    b.className = id === 'panel-intro' ? 'active' : '';
    b.addEventListener('click', () => {
      if (needsResultsFirst(id) && !State.results) { toast('Calculeaza mai intai proiectul.'); return; }
      showPanel(id);
    });
    wrap.appendChild(b);
  });
}

/* ---------------- butoane principale ---------------- */
function wireButtons() {
  $('btnStart').addEventListener('click', () => showPanel('panel-params'));
  $('btnLoadExample').addEventListener('click', () => {
    loadParamsToForm(BookData.exemplulCartii);
    toast('Exemplul din carte (Anexa A14) a fost incarcat.');
    showPanel('panel-params');
  });

  $('btnReset').addEventListener('click', () => {
    loadParamsToForm(BookData.exemplulCartii);
    toast('Formular resetat la valorile implicite.');
  });

  $('btnCalculeaza').addEventListener('click', onCalculeaza);

  $('btnGenPdf').addEventListener('click', () => {
    if (!State.results) { toast('Calculeaza mai intai proiectul.'); return; }
    Report.generate(State.params, State.results);
  });

  $('btnExportJson').addEventListener('click', () => {
    const p = readFormToParams();
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'parametri-dinamica-auto.json';
    a.click();
  });

  $('importJson').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(reader.result);
        loadParamsToForm(p);
        toast('Parametri incarcati din fisier.');
        showPanel('panel-params');
      } catch (err) {
        toast('Fisier JSON invalid.');
      }
    };
    reader.readAsText(file);
  });
}

function onCalculeaza() {
  const p = readFormToParams();
  const errs = validateParams(p);
  if (errs.length) {
    toast(errs[0]);
    return;
  }
  $('statusDot').style.background = '#FF5A1F';
  $('statusText').textContent = 'Se calculeaza...';

  setTimeout(() => {
    try {
      const results = runFullCalculation(p);
      State.params = p;
      State.results = results;

      renderTractiune(p, results);
      renderFranare(p, results);
      renderManiabilitate(p, results);
      renderRaportSummary(p, results);
      animateGauge(p.nn);

      $('statusDot').style.background = 'var(--ok)';
      $('statusText').textContent = 'Calcul finalizat';
      toast('Proiect calculat cu succes. Navigheaza la rezultate.');
      showPanel('panel-tractiune');
    } catch (err) {
      console.error(err);
      $('statusDot').style.background = 'var(--warn)';
      $('statusText').textContent = 'Eroare de calcul';
      toast('A aparut o eroare la calcul — verifica parametrii introdusi.');
    }
  }, 60);
}

/* =================================================================
   RANDARE PANEL TRACTIUNE
   ================================================================= */
function renderTractiune(p, r) {
  const out = $('tractiuneOut');
  out.innerHTML = '';

  const kpiRow = el('div', { class: 'kpi-row' }, [
    kpi('Viteza maxima', fmt(r.vmaxRes.vmax_kmh, 1), 'km/h'),
    kpi('Raport i0', fmt(r.i0Res.i0, 3), ''),
    kpi('Raza de rulare', fmt(r.pneu.rr_mm, 1), 'mm'),
    kpi('Randament transmisie', fmt(r.eta_tr * 100, 1), '%'),
    kpi('Numar trepte', r.trepte.n, ''),
    kpi('Ratie geometrica q', fmt(r.trepte.q, 3), '')
  ]);
  out.appendChild(kpiRow);

  out.appendChild(sectionBlock('Greutati si centrul de greutate', 'rel. 3.1 - 3.5', null, [
    el('div', { class: 'kpi-row' }, [
      kpi('Greutate totala G', fmt(r.gcg.G / 10, 0), 'daN'),
      kpi('Greutate pe puntea fata G1', fmt(r.gcg.G1, 0), 'N'),
      kpi('Greutate pe puntea spate G2', fmt(r.gcg.G2, 0), 'N'),
      kpi('a (CG la fata)', fmt(r.gcg.a, 3), 'm'),
      kpi('b (CG la spate)', fmt(r.gcg.b, 3), 'm'),
      kpi('hg incarcat', fmt(r.gcg.hg_inc, 3), 'm')
    ])
  ]));

  const ceCanvas = el('canvas', { id: 'chartCE', height: '260' });
  out.appendChild(sectionBlock('Caracteristica externa a motorului', 'rel. 3.41 - 3.50',
    `Pei = Pen[a(ni/nn) + b(ni/nn)^2 - c(ni/nn)^3]   a=${fmt(r.caracteristica.a,3)}  b=${fmt(r.caracteristica.b,3)}  c=${fmt(r.caracteristica.c,3)}   Men=${fmt(r.caracteristica.Men,2)} daNm`,
    [
      el('div', { class: 'chart-card' }, [el('h4', {}, 'Putere efectiva si moment motor functie de turatie'), ceCanvas]),
      dataTable({
        caption: 'Tabel caracteristica externa',
        cols: [
          { label: 'n [rot/min]', key: 'n' },
          { label: 'Pe [kW]', fmt: row => fmt(row.Pe, 2) },
          { label: 'Me [daNm]', fmt: row => fmt(row.Me, 2) },
          { label: 'ce [g/kWh]', fmt: row => fmt(row.ce, 2) },
          { label: 'C [kg/h]', fmt: row => fmt(row.C, 2) }
        ],
        rows: r.caracteristica.rows
      })
    ]));
  ChartsModule.caracteristicaExternaChart(ceCanvas, r.caracteristica.rows);

  out.appendChild(sectionBlock('Pneu si raza de rulare', 'rel. 3.11 - 3.17', null, [
    el('div', { class: 'kpi-row' }, [
      kpi('Diametru exterior Dn', fmt(r.pneu.Dn, 1), 'mm'),
      kpi('Raza libera r0', fmt(r.pneu.r0, 1), 'mm'),
      kpi('Raza de rulare rr', fmt(r.pneu.rr_mm, 1), 'mm'),
      kpi('Inaltime profil H', fmt(r.pneu.H, 1), 'mm')
    ])
  ]));

  out.appendChild(sectionBlock('Viteza maxima', 'rel. 3.63 - 3.67',
    `etatr*Pmax = G*(f0+3.6^2*f02*v^2)*v + k*A*v^3   ->   v_max ca radacina a ecuatiei de gradul trei`,
    [
      el('div', { class: 'kpi-row' }, [
        kpi('Viteza maxima', fmt(r.vmaxRes.vmax_kmh, 2), 'km/h', 'ok'),
        kpi('Viteza maxima', fmt(r.vmaxRes.vmax_ms, 2), 'm/s')
      ])
    ]));

  const treapteRows = r.trepte.rapoarte.map((icv, i) => ({ nr: i + 1, icv, vmax: r.treptaSpeeds[i] }));
  out.appendChild(sectionBlock('Rapoartele de transmitere ale cutiei de viteze', 'rel. 3.246 - 3.273',
    `i0 = ${fmt(r.i0Res.i0,3)} (transmisie principala)   icv1 = ${fmt(r.icv1,3)} (treapta I)   q = ${fmt(r.trepte.q,3)}`,
    [
      dataTable({
        caption: 'Rapoarte de transmitere si viteza maxima pe fiecare treapta',
        cols: [
          { label: 'Treapta', fmt: row => 'Treapta ' + row.nr },
          { label: 'icv', fmt: row => fmt(row.icv, 3) },
          { label: 'V max [m/s]', fmt: row => fmt(row.vmax, 2) },
          { label: 'V max [km/h]', fmt: row => fmt(row.vmax * 3.6, 1) }
        ],
        rows: treapteRows
      })
    ]));

  const fierastrauCanvas = el('canvas', { id: 'chartFierastrau', height: '300' });
  out.appendChild(sectionBlock('Diagrama fierastrau', 'fig. 3.78', null, [
    el('div', { class: 'chart-card' }, [el('h4', {}, 'Viteza pe fiecare treapta in functie de turatie'), fierastrauCanvas])
  ]));
  ChartsModule.fierastrauChart(fierastrauCanvas, r.treptePopulate);

  const tractCanvas = el('canvas', { id: 'chartTractiune', height: '300' });
  const putCanvas = el('canvas', { id: 'chartPutere', height: '300' });
  out.appendChild(sectionBlock('Caracteristica de tractiune si caracteristica de putere', 'rel. 3.276 - 3.282', null, [
    el('div', { class: 'two-col' }, [
      el('div', { class: 'chart-card' }, [el('h4', {}, 'FR = f(v)'), tractCanvas]),
      el('div', { class: 'chart-card' }, [el('h4', {}, 'PR = f(v)'), putCanvas])
    ])
  ]));
  ChartsModule.tractiuneChart(tractCanvas, r.treptePopulate);
  ChartsModule.putereChart(putCanvas, r.treptePopulate);

  const dinCanvas = el('canvas', { id: 'chartDinamica', height: '300' });
  const accCanvas = el('canvas', { id: 'chartAcceleratie', height: '300' });
  out.appendChild(sectionBlock('Caracteristica dinamica si acceleratia', 'rel. 3.283, 3.299', null, [
    el('div', { class: 'two-col' }, [
      el('div', { class: 'chart-card' }, [el('h4', {}, 'D = f(v)'), dinCanvas]),
      el('div', { class: 'chart-card' }, [el('h4', {}, 'a = f(v)'), accCanvas])
    ])
  ]));
  ChartsModule.dinamicaChart(dinCanvas, r.treptePopulate);
  ChartsModule.acceleratieChart(accCanvas, r.treptePopulate);

  const bilTract = el('canvas', { id: 'chartBilantTract', height: '260' });
  const bilPut = el('canvas', { id: 'chartBilantPutere', height: '260' });
  out.appendChild(sectionBlock('Bilantul de tractiune si de putere - treapta I', 'rel. 3.275 - 3.281', null, [
    el('div', { class: 'two-col' }, [
      el('div', { class: 'chart-card' }, [el('h4', {}, 'Bilant tractiune'), bilTract]),
      el('div', { class: 'chart-card' }, [el('h4', {}, 'Bilant putere'), bilPut])
    ])
  ]));
  ChartsModule.bilantChart(bilTract, bilPut, r.treptePopulate[0].rows);

  const tDem = el('canvas', { id: 'chartTDem', height: '260' });
  const sDem = el('canvas', { id: 'chartSDem', height: '260' });
  const tTotal = r.demaraj.length ? r.demaraj[r.demaraj.length - 1].t : 0;
  const sTotal = r.demaraj.length ? r.demaraj[r.demaraj.length - 1].s : 0;
  out.appendChild(sectionBlock('Timpul si spatiul de demarare', 'rel. 3.304 - 3.311', null, [
    el('div', { class: 'kpi-row' }, [
      kpi('Timp total demarare', fmt(tTotal, 2), 's'),
      kpi('Spatiu total demarare', fmt(sTotal, 1), 'm')
    ]),
    el('div', { class: 'two-col' }, [
      el('div', { class: 'chart-card' }, [el('h4', {}, 't = f(v)'), tDem]),
      el('div', { class: 'chart-card' }, [el('h4', {}, 's = f(v)'), sDem])
    ])
  ]));
  ChartsModule.demarareChart(tDem, sDem, r.demaraj);
}

/* =================================================================
   RANDARE PANEL FRANARE
   ================================================================= */
function renderFranare(p, r) {
  const out = $('franareOut');
  out.innerHTML = '';

  const last = r.franareRows[r.franareRows.length - 1];
  out.appendChild(el('div', { class: 'kpi-row' }, [
    kpi('Decelerația max la vmax', fmt(last.aFS, 2), 'm/s2'),
    kpi('Timp minim franare la vmax', fmt(last.tfmin, 2), 's'),
    kpi('Spatiu minim franare la vmax', fmt(last.Sfmin, 1), 'm')
  ]));

  const franCanvas = el('canvas', { id: 'chartFranare', height: '300' });
  out.appendChild(sectionBlock('Decelerația, spatiul minim de franare si spatiul de oprire', 'rel. 3.328 - 3.352',
    `a_f(F+S) = g[(f+phi) + kAv^2/G]   Sf_min = v^2/(2g(f+phi))   S_oprire = Sf_min + v*(t0+t1\'+t1\'\'/2)`,
    [
      el('div', { class: 'chart-card' }, [el('h4', {}, 'Spatiu minim de franare si spatiu de oprire'), franCanvas]),
      dataTable({
        caption: 'Tabel centralizator franare',
        cols: [
          { label: 'v [m/s]', fmt: row => fmt(row.v, 2) },
          { label: 'a(F+S) [m/s2]', fmt: row => fmt(row.aFS, 3) },
          { label: 'a(F) [m/s2]', fmt: row => fmt(row.aF, 3) },
          { label: 'a(S) [m/s2]', fmt: row => fmt(row.aS, 3) },
          { label: 'tf min [s]', fmt: row => fmt(row.tfmin, 3) },
          { label: 'Sf min [m]', fmt: row => fmt(row.Sfmin, 2) },
          { label: 'S oprire [m]', fmt: (row) => fmt(r.opriri[r.franareRows.indexOf(row)].Sopr, 2) }
        ],
        rows: r.franareRows
      })
    ]));
  ChartsModule.franareChart(franCanvas, r.franareRows, r.opriri);

  const repCanvas = el('canvas', { id: 'chartRepartitie', height: '300' });
  out.appendChild(sectionBlock('Repartitia fortei de franare pe punti', 'rel. 3.355',
    `gamma1 = a_frel*(b/L + a_frel*hg/L)    gamma2 = a_frel*(a/L - a_frel*hg/L)`,
    [
      el('div', { class: 'chart-card' }, [el('h4', {}, 'gamma1, gamma2 - incarcat / descarcat'), repCanvas]),
      el('div', { class: 'two-col' }, [
        dataTable({
          caption: 'Incarcat',
          cols: [
            { label: 'a_frel', fmt: row => fmt(row.afrel, 1) },
            { label: 'gamma1', fmt: row => fmt(row.gamma1, 3) },
            { label: 'gamma2', fmt: row => fmt(row.gamma2, 3) }
          ],
          rows: r.repartitieIncarcat
        }),
        dataTable({
          caption: 'Descarcat',
          cols: [
            { label: 'a_frel', fmt: row => fmt(row.afrel, 1) },
            { label: 'gamma1', fmt: row => fmt(row.gamma1, 3) },
            { label: 'gamma2', fmt: row => fmt(row.gamma2, 3) }
          ],
          rows: r.repartitieDescarcat
        })
      ])
    ]));
  ChartsModule.repartitieFranareChart(repCanvas, r.repartitieIncarcat, r.repartitieDescarcat);
}

/* =================================================================
   RANDARE PANEL MANIABILITATE
   ================================================================= */
function renderManiabilitate(p, r) {
  const out = $('maniabilitateOut');
  out.innerHTML = '';

  out.appendChild(el('div', { class: 'kpi-row' }, [
    kpi('Raza minima de virare', fmt(r.manRes.Rvmin, 2), 'm'),
    kpi('Theta e maxim', fmt(r.manRes.thetaE_max_deg, 1), 'grade'),
    kpi('Theta i maxim (impus)', fmt(r.manRes.thetaImax_deg, 1), 'grade')
  ]));

  const angCanvas = el('canvas', { id: 'chartAngles', height: '280' });
  const bgCanvas = el('canvas', { id: 'chartBg', height: '280' });
  out.appendChild(sectionBlock('Unghiuri de bracare si fasia de gabarit', 'rel. 3.359 - 3.379',
    `tg(theta_e) = L/(Rv+0.5Ep)   tg(theta_i) = L/(Rv-0.5Ep)   Bg = L(1/sin(theta_i) - 1/tg(theta_e)) + E2 - Ep`,
    [
      el('div', { class: 'two-col' }, [
        el('div', { class: 'chart-card' }, [el('h4', {}, 'Unghiuri de bracare functie de raza de virare'), angCanvas]),
        el('div', { class: 'chart-card' }, [el('h4', {}, 'Fasia de gabarit functie de raza de virare'), bgCanvas])
      ]),
      dataTable({
        caption: 'Tabel centralizator maniabilitate',
        cols: [
          { label: 'Rv [m]', fmt: row => fmt(row.Rv, 0) },
          { label: 'theta_e [grade]', fmt: row => fmt(row.thetaE_deg, 2) },
          { label: 'theta_i [grade]', fmt: row => fmt(row.thetaI_deg, 2) },
          { label: 'theta [grade]', fmt: row => fmt(row.theta_deg, 2) },
          { label: 'Bg [m]', fmt: row => fmt(row.Bg, 3) }
        ],
        rows: r.manRes.rows
      })
    ]));
  ChartsModule.maniabilitateChart(angCanvas, bgCanvas, r.manRes.rows);

  const sl = r.stabLong;
  out.appendChild(sectionBlock('Stabilitatea longitudinala', 'rel. 3.386 - 3.399', null, [
    el('div', { class: 'alert ' + (sl.okUrcare ? 'ok' : 'warn') }, [
      el('span', { class: 'ic' }, sl.okUrcare ? 'OK' : '!'),
      `Urcare panta: alpha_r (rasturnare) = ${fmt(sl.alphaR_deg,2)} grade  vs.  alpha_p (patinare) = ${fmt(sl.alphaP_deg,2)} grade  -  ${sl.okUrcare ? 'patinarea apare inaintea rasturnarii (conditie de siguranta indeplinita)' : 'atentie: rasturnarea poate preceda patinarea'}`
    ]),
    el('div', { class: 'alert ' + (sl.okCoborare ? 'ok' : 'warn') }, [
      el('span', { class: 'ic' }, sl.okCoborare ? 'OK' : '!'),
      `Coborare panta: unghi limita rasturnare = ${fmt(sl.alphaCob_deg,2)} grade  -  ${sl.okCoborare ? 'conditia phi < a/hg este indeplinita' : 'verificati coeficientul de aderenta'}`
    ]),
    el('div', { class: 'kpi-row' }, [
      kpi('Viteza critica rasturnare (drum orizontal)', fmt(sl.vCritic_kmh, 1), 'km/h')
    ])
  ]));

  const stCanvasDerapare = el('canvas', { id: 'chartDerapare', height: '280' });
  const stCanvasRasturnare = el('canvas', { id: 'chartRasturnare', height: '280' });
  out.appendChild(sectionBlock('Stabilitatea transversala - derapare si rasturnare', 'rel. 3.413 - 3.428',
    `Prag de rasturnare E/2hg = ${fmt(r.stabTrans.pragRasturnare, 3)} (cu cat mai mare, cu atat vehiculul e mai stabil)`,
    [
      el('div', { class: 'two-col' }, [
        el('div', { class: 'chart-card' }, [el('h4', {}, 'Viteza limita la derapare vd'), stCanvasDerapare]),
        el('div', { class: 'chart-card' }, [el('h4', {}, 'Viteza limita la rasturnare vr'), stCanvasRasturnare])
      ])
    ]));
  ChartsModule.stabilitateChart(stCanvasDerapare, r.stabTrans.rows, r.stabTrans.betaList_deg, 'vd', 'vd [m/s]');
  ChartsModule.stabilitateChart(stCanvasRasturnare, r.stabTrans.rows, r.stabTrans.betaList_deg, 'vr', 'vr [m/s]');
}

/* =================================================================
   RANDARE SUMAR RAPORT
   ================================================================= */
function renderRaportSummary(p, r) {
  const out = $('raportSummary');
  out.innerHTML = '';
  const card = el('div', { class: 'summary-card' }, [
    el('div', { style: 'font-family: var(--font-display); font-size:18px; margin-bottom:10px;' }, 'Sumar proiect'),
    rowKV('Greutate totala', fmt(p.G_total_daN, 0) + ' daN'),
    rowKV('Motor', `${p.motorType} - ${fmt(p.Pen,1)} kW @ ${p.nn} rot/min`),
    rowKV('Viteza maxima calculata', fmt(r.vmaxRes.vmax_kmh, 1) + ' km/h'),
    rowKV('Numar trepte cutie viteze', String(r.trepte.n)),
    rowKV('Timp total demarare', fmt(r.demaraj.length ? r.demaraj[r.demaraj.length-1].t : 0, 1) + ' s'),
    rowKV('Spatiu minim franare la vmax', fmt(r.franareRows[r.franareRows.length-1].Sfmin, 1) + ' m'),
    rowKV('Raza minima de virare', fmt(r.manRes.Rvmin, 2) + ' m')
  ]);
  out.appendChild(card);
  out.appendChild(el('div', { class: 'alert info' }, [
    el('span', { class: 'ic' }, 'i'),
    'Apasa "Genereaza raport PDF" pentru documentul complet, cu toate tabelele si graficele din cele 3 capitole de calcul.'
  ]));
}

function rowKV(k, vHtml) {
  return el('div', { class: 'row' }, [el('span', {}, k), el('span', { class: 'v', html: vHtml })]);
}

/* =================================================================
   GAUGE ANIMAT (hero)
   ================================================================= */
function drawGaugeTicks() {
  const g = $('gaugeTicks');
  if (!g) return;
  const cx = 160, cy = 160, rOuter = 138, rInner = 122;
  for (let i = 0; i <= 12; i++) {
    const angle = -150 + i * 300 / 12;
    const rad = angle * Math.PI / 180;
    const x1 = cx + rOuter * Math.cos(rad), y1 = cy + rOuter * Math.sin(rad);
    const x2 = cx + rInner * Math.cos(rad), y2 = cy + rInner * Math.sin(rad);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', i % 3 === 0 ? '#FF5A1F' : '#3A4252');
    line.setAttribute('stroke-width', i % 3 === 0 ? '2.5' : '1.5');
    g.appendChild(line);
  }
}

function animateGauge(nn) {
  const needle = $('needle');
  const numEl = $('gaugeNumber');
  if (!needle || !numEl) return;
  const maxScale = Math.ceil(nn / 500) * 500 * 1.15;
  const frac = Math.min(nn / maxScale, 1);
  const angleDeg = -150 + frac * 300;
  needle.style.transform = `rotate(${angleDeg}deg)`;

  let start = null;
  const duration = 1000;
  function step(ts) {
    if (!start) start = ts;
    const t = Math.min((ts - start) / duration, 1);
    numEl.textContent = Math.round(nn * t);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
