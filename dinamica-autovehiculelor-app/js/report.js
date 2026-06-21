/* ===================================================================
   REPORT.JS — generare raport PDF complet (jsPDF), cu toate tabelele
   de calcul si graficele (capturate din canvas-urile Chart.js deja
   randate in pagina, plus tabele redesenate direct in PDF).
   =================================================================== */

const Report = (() => {

  const MARGIN = 14;
  const PAGE_W = 210;
  const PAGE_H = 297;
  const CONTENT_W = PAGE_W - 2 * MARGIN;

  let doc, y, pageNum;

  function init() {
    doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    y = MARGIN;
    pageNum = 1;
  }

  function setProgress(msg) {
    const el = document.getElementById('pdfProgress');
    if (el) el.innerHTML = `<span class="spinner"></span> ${msg}`;
  }
  function clearProgress() {
    const el = document.getElementById('pdfProgress');
    if (el) el.innerHTML = '';
  }

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > PAGE_H - MARGIN) {
      addFooter();
      doc.addPage();
      pageNum++;
      y = MARGIN;
      addHeader();
    }
  }

  function addHeader() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Dinamica Autovehiculelor — Raport de calcul', MARGIN, 8);
    doc.setDrawColor(220);
    doc.line(MARGIN, 10, PAGE_W - MARGIN, 10);
    doc.setTextColor(0);
  }

  function addFooter() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Pagina ${pageNum}`, PAGE_W - MARGIN, PAGE_H - 6, { align: 'right' });
    doc.text(new Date().toLocaleDateString('ro-RO'), MARGIN, PAGE_H - 6);
    doc.setTextColor(0);
  }

  function h1(text) {
    checkPageBreak(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 90, 31);
    doc.text(text, MARGIN, y);
    doc.setTextColor(0);
    y += 3;
    doc.setDrawColor(14, 17, 22);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 8;
  }

  function h2(text) {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(20);
    doc.text(text, MARGIN, y);
    doc.setTextColor(0);
    y += 6;
  }

  function pFormula(text) {
    checkPageBreak(8);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 52, 22);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    doc.text(lines, MARGIN, y);
    y += lines.length * 3.6 + 3;
    doc.setTextColor(0);
  }

  function pText(text) {
    checkPageBreak(8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(text, CONTENT_W);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4.2 + 2;
    doc.setTextColor(0);
  }

  function kpiStrip(items) {
    const cols = items.length;
    const colW = CONTENT_W / cols;
    const boxH = 16;
    checkPageBreak(boxH + 4);
    items.forEach((it, i) => {
      const x = MARGIN + i * colW;
      doc.setDrawColor(216, 211, 196);
      doc.setLineWidth(0.3);
      doc.rect(x, y, colW - 2, boxH);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(110);
      doc.text(it.label, x + 2, y + 5, { maxWidth: colW - 4 });
      doc.setFont('courier', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(20);
      doc.text(String(it.value), x + 2, y + 12);
    });
    doc.setTextColor(0);
    y += boxH + 6;
  }

  function table(caption, cols, rows, opts = {}) {
    checkPageBreak(16);
    if (caption) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20);
      doc.text(caption, MARGIN, y);
      y += 5;
    }
    const colWidths = opts.colWidths || cols.map(() => CONTENT_W / cols.length);
    const rowH = 5.2;
    const headerH = 6;

    function drawHeader() {
      doc.setFillColor(14, 17, 22);
      doc.rect(MARGIN, y, CONTENT_W, headerH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(245, 243, 237);
      let x = MARGIN;
      cols.forEach((c, i) => {
        doc.text(c.label, x + 1.5, y + 4.2);
        x += colWidths[i];
      });
      y += headerH;
      doc.setTextColor(0);
    }

    drawHeader();

    rows.forEach((row, ri) => {
      if (y + rowH > PAGE_H - MARGIN) {
        addFooter();
        doc.addPage();
        pageNum++;
        y = MARGIN;
        addHeader();
        drawHeader();
      }
      if (ri % 2 === 0) {
        doc.setFillColor(251, 250, 246);
        doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
      }
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.3);
      doc.setTextColor(30);
      let x = MARGIN;
      cols.forEach((c, i) => {
        const val = c.fmt ? c.fmt(row) : String(row[c.key] ?? '');
        doc.text(val, x + 1.5, y + 3.6, { maxWidth: colWidths[i] - 2 });
        x += colWidths[i];
      });
      y += rowH;
    });
    doc.setDrawColor(216, 211, 196);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y - rows.length * rowH - headerH, CONTENT_W, rows.length * rowH + headerH);
    y += 6;
  }

  function alertBox(text, type = 'info') {
    checkPageBreak(14);
    const colors = {
      ok: [43, 110, 94], warn: [194, 59, 59], info: [255, 90, 31]
    };
    const c = colors[type] || colors.info;
    const lines = doc.splitTextToSize(text, CONTENT_W - 6);
    const h = lines.length * 4 + 5;
    doc.setFillColor(250, 250, 248);
    doc.setDrawColor(c[0], c[1], c[2]);
    doc.setLineWidth(0.8);
    doc.rect(MARGIN, y, CONTENT_W, h, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40);
    doc.text(lines, MARGIN + 3, y + 5);
    doc.setTextColor(0);
    y += h + 5;
  }

  async function addChartImage(canvasId, title, widthMm = CONTENT_W, heightMm = 70) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    checkPageBreak(heightMm + 12);
    if (title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(title, MARGIN, y);
      y += 5;
    }
    try {
      const imgData = canvas.toDataURL('image/png', 1.0);
      doc.addImage(imgData, 'PNG', MARGIN, y, widthMm, heightMm, undefined, 'FAST');
      y += heightMm + 6;
    } catch (e) {
      console.warn('Nu s-a putut capta graficul', canvasId, e);
    }
  }

  async function addChartPair(canvasId1, canvasId2, title1, title2) {
    const w = (CONTENT_W - 6) / 2;
    const h = 65;
    checkPageBreak(h + 14);
    const c1 = document.getElementById(canvasId1);
    const c2 = document.getElementById(canvasId2);
    if (c1) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(title1, MARGIN, y);
    }
    if (c2) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(title2, MARGIN + w + 6, y);
    }
    y += 5;
    if (c1) doc.addImage(c1.toDataURL('image/png', 1.0), 'PNG', MARGIN, y, w, h, undefined, 'FAST');
    if (c2) doc.addImage(c2.toDataURL('image/png', 1.0), 'PNG', MARGIN + w + 6, y, w, h, undefined, 'FAST');
    y += h + 6;
  }

  function coverPage(params, results) {
    doc.setFillColor(14, 17, 22);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(139, 147, 163);
    doc.text('INDRUMAR DE PROIECTARE — UNIVERSITATEA "OVIDIUS" CONSTANTA', MARGIN, 30);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(34);
    doc.setTextColor(245, 243, 237);
    doc.text('DINAMICA', MARGIN, 70);
    doc.setTextColor(255, 90, 31);
    doc.text('AUTOVEHICULELOR', MARGIN, 84);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(183, 190, 204);
    doc.text('Raport de calcul generat automat', MARGIN, 100);

    doc.setDrawColor(42, 49, 64);
    doc.setLineWidth(0.6);
    doc.circle(160, 200, 32);
    doc.setDrawColor(255, 90, 31);
    doc.setLineWidth(1.2);
    doc.circle(160, 200, 32, 'S');

    doc.setFont('courier', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(245, 243, 237);
    doc.text(`${Math.round(results.vmaxRes.vmax_kmh)}`, 160, 198, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 90, 31);
    doc.text('km/h MAX', 160, 206, { align: 'center' });

    let yy = 140;
    const sumRows = [
      ['Greutate totala', `${fmt(params.G_total_daN,0)} daN`],
      ['Motor', `${params.motorType} - ${fmt(params.Pen,1)} kW @ ${params.nn} rot/min`],
      ['Numar trepte cutie', `${results.trepte.n}`],
      ['Raport transmisie principala i0', `${fmt(results.i0Res.i0,3)}`],
      ['Timp total demarare', `${fmt(results.demaraj.length?results.demaraj[results.demaraj.length-1].t:0,1)} s`],
      ['Raza minima de virare', `${fmt(results.manRes.Rvmin,2)} m`]
    ];
    doc.setFontSize(10);
    sumRows.forEach(([k, v]) => {
      doc.setFont('helvetica', 'normal'); doc.setTextColor(139,147,163);
      doc.text(k, MARGIN, yy);
      doc.setFont('courier', 'bold'); doc.setTextColor(245,243,237);
      doc.text(v, PAGE_W - MARGIN, yy, { align: 'right' });
      doc.setDrawColor(42,49,64);
      doc.line(MARGIN, yy + 2, PAGE_W - MARGIN, yy + 2);
      yy += 9;
    });

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 98, 112);
    doc.text(`Generat: ${new Date().toLocaleString('ro-RO')}`, MARGIN, PAGE_H - 14);

    doc.addPage();
    pageNum++;
    y = MARGIN;
    addHeader();
  }

  function fmt(n, d) { return window.fmt ? window.fmt(n, d) : Number(n).toFixed(d); }

  /* ================================================================
     SECTIUNI RAPORT
     ================================================================ */
  function sectionParametri(p) {
    h1('0. Date de intrare - fisa tehnica');
    table('Parametri de proiectare introdusi', [
      { label: 'Parametru', key: 'k' }, { label: 'Valoare', key: 'v' }, { label: 'U.M.', key: 'u' }
    ], [
      { k: 'Greutate totala G', v: fmt(p.G_total_daN,0), u: 'daN' },
      { k: 'Greutate proprie G0', v: fmt(p.G0_daN,0), u: 'daN' },
      { k: 'Ampatament L', v: fmt(p.L,3), u: 'm' },
      { k: 'Motor', v: p.motorType, u: '-' },
      { k: 'Putere nominala Pen', v: fmt(p.Pen,2), u: 'kW' },
      { k: 'Turatie nominala nn', v: p.nn, u: 'rot/min' },
      { k: 'Turatie minima nmin', v: p.nmin, u: 'rot/min' },
      { k: 'Turatie maxima nmax', v: p.nmax, u: 'rot/min' },
      { k: 'Coef. elasticitate ke', v: fmt(p.ke,3), u: '-' },
      { k: 'Diametru pneu Dn', v: fmt(p.Dn_in,2), u: 'inch' },
      { k: 'Diametru janta d', v: fmt(p.d_in,2), u: 'inch' },
      { k: 'Coeficient rezistenta aer Cx', v: fmt(p.Cx,3), u: '-' },
      { k: 'Sectiune transversala A', v: fmt(p.A,2), u: 'm2' },
      { k: 'Panta maxima', v: fmt(p.alphaMax_deg,1), u: 'grade' },
      { k: 'Raport treapta I (icv1)', v: fmt(p.icvI_book,2), u: '-' },
      { k: 'Numar trepte cutie', v: p.nTrepte, u: '-' },
      { k: 'Coef. aderenta franare', v: fmt(p.phiFranare,2), u: '-' },
      { k: 'Ecartament fata E1', v: fmt(p.E1,3), u: 'm' },
      { k: 'Ecartament spate E2', v: fmt(p.E2,3), u: 'm' }
    ], { colWidths: [CONTENT_W*0.5, CONTENT_W*0.3, CONTENT_W*0.2] });
  }

  async function sectionTractiune(p, r) {
    h1('1. Calculul de tractiune');

    h2('1.1 Greutati si pozitia centrului de greutate');
    pFormula('G1 = G*b/L [N]    G2 = G*a/L [N]    a+b = L   (rel. 3.5)');
    kpiStrip([
      { label: 'G total', value: fmt(r.gcg.G/10,0) + ' daN' },
      { label: 'G1 (fata)', value: fmt(r.gcg.G1,0) + ' N' },
      { label: 'G2 (spate)', value: fmt(r.gcg.G2,0) + ' N' },
      { label: 'a (CG-fata)', value: fmt(r.gcg.a,3) + ' m' },
      { label: 'b (CG-spate)', value: fmt(r.gcg.b,3) + ' m' },
      { label: 'hg incarcat', value: fmt(r.gcg.hg_inc,3) + ' m' }
    ]);

    h2('1.2 Caracteristica externa a motorului');
    pFormula(`Pei = Pen*[a*(ni/nn) + b*(ni/nn)^2 - c*(ni/nn)^3]    a=${fmt(r.caracteristica.a,4)} b=${fmt(r.caracteristica.b,4)} c=${fmt(r.caracteristica.c,4)}  (rel. 3.41, 3.43)`);
    await addChartImage('chartCE', 'Putere efectiva si moment motor functie de turatie', CONTENT_W, 68);
    table('Tabel caracteristica externa', [
      { label: 'n [rot/min]', fmt: row => String(row.n) },
      { label: 'Pe [kW]', fmt: row => fmt(row.Pe,2) },
      { label: 'Me [daNm]', fmt: row => fmt(row.Me,2) },
      { label: 'ce [g/kWh]', fmt: row => fmt(row.ce,2) },
      { label: 'C [kg/h]', fmt: row => fmt(row.C,2) }
    ], r.caracteristica.rows);

    h2('1.3 Pneu si raza de rulare');
    pFormula('r0 = Dn/2;   rr = lambda * r0   (rel. 3.14, 3.17)');
    kpiStrip([
      { label: 'Dn', value: fmt(r.pneu.Dn,1) + ' mm' },
      { label: 'r0', value: fmt(r.pneu.r0,1) + ' mm' },
      { label: 'rr (raza rulare)', value: fmt(r.pneu.rr_mm,1) + ' mm' },
      { label: 'H profil', value: fmt(r.pneu.H,1) + ' mm' }
    ]);

    h2('1.4 Viteza maxima');
    pFormula('etatr*Pmax = G*(f0+3.6^2*f02*v^2)*v + k*A*v^3  ->  v_max radacina ecuatie gr.3  (rel. 3.63-3.67)');
    kpiStrip([
      { label: 'Randament transmisie', value: fmt(r.eta_tr*100,1) + ' %' },
      { label: 'k aerodinamic', value: fmt(r.k_aero,4) + ' kg/m3' },
      { label: 'Viteza maxima', value: fmt(r.vmaxRes.vmax_kmh,2) + ' km/h' },
      { label: 'Viteza maxima', value: fmt(r.vmaxRes.vmax_ms,2) + ' m/s' }
    ]);

    h2('1.5 Rapoartele de transmitere ale cutiei de viteze');
    pFormula(`i0 = pi*nvmax*rr/(30*vmax)  (rel. 3.248)    icv1 = ${fmt(r.icv1,3)} (adoptat)    q = (icv1)^(1/(n-1))  (rel. 3.269)`);
    kpiStrip([
      { label: 'i0', value: fmt(r.i0Res.i0,3) },
      { label: 'Numar trepte n', value: String(r.trepte.n) },
      { label: 'Ratie geometrica q', value: fmt(r.trepte.q,3) }
    ]);
    table('Rapoarte de transmitere si viteza maxima pe fiecare treapta', [
      { label: 'Treapta', fmt: row => 'Treapta ' + row.nr },
      { label: 'icv', fmt: row => fmt(row.icv,3) },
      { label: 'Vmax [m/s]', fmt: row => fmt(row.vmax,2) },
      { label: 'Vmax [km/h]', fmt: row => fmt(row.vmax*3.6,1) }
    ], r.trepte.rapoarte.map((icv,i)=>({nr:i+1, icv, vmax:r.treptaSpeeds[i]})));

    await addChartImage('chartFierastrau', 'Diagrama fierastrau (fig. 3.78)', CONTENT_W, 75);

    h2('1.6 Caracteristica de tractiune si caracteristica de putere');
    pFormula('FR = Me*i0*icv*etatr/rr  [N]   (rel. 3.276)     PR = FR*v  [W]   (rel. 3.279)');
    await addChartPair('chartTractiune', 'chartPutere', 'FR = f(v)', 'PR = f(v)');

    h2('1.7 Caracteristica dinamica si acceleratia');
    pFormula('D = (FR - Ra)/G   (rel. 3.283)        a = (D - psi)*g/delta   (rel. 3.299)');
    await addChartPair('chartDinamica', 'chartAcceleratie', 'D = f(v)', 'a = f(v)');

    h2('1.8 Bilantul de tractiune si de putere - treapta I');
    pFormula('FR = Rr + Rp + Ra + Rd   (rel. 3.275, 3.277)');
    await addChartPair('chartBilantTract', 'chartBilantPutere', 'Bilant tractiune', 'Bilant putere');

    h2('1.9 Timpul si spatiul de demarare');
    pFormula('dt_i = ((1/a)_(i-1)+(1/a)_i)/2 * dv   (rel. 3.307)     ds_i = dt_i*(v_(i-1)+v_i)/2   (rel. 3.310)');
    const tTotal = r.demaraj.length ? r.demaraj[r.demaraj.length-1].t : 0;
    const sTotal = r.demaraj.length ? r.demaraj[r.demaraj.length-1].s : 0;
    kpiStrip([
      { label: 'Timp total demarare', value: fmt(tTotal,2) + ' s' },
      { label: 'Spatiu total demarare', value: fmt(sTotal,1) + ' m' }
    ]);
    await addChartPair('chartTDem', 'chartSDem', 't = f(v)', 's = f(v)');
  }

  async function sectionFranare(p, r) {
    h1('2. Calculul la franare');

    h2('2.1 Decelerația maxima, timpul si spatiul minim de franare');
    pFormula('a_f(F+S) = g*[(f+phi) + kAv^2/G]   (rel. 3.329)     tf_min = v/(g*phi)   (rel. 3.341)     Sf_min = v^2/(2g(f+phi))   (rel. 3.347)');
    await addChartImage('chartFranare', 'Spatiu minim de franare si spatiu de oprire', CONTENT_W, 72);
    table('Tabel centralizator franare', [
      { label: 'v [m/s]', fmt: row => fmt(row.v,2) },
      { label: 'a(F+S)', fmt: row => fmt(row.aFS,3) },
      { label: 'a(F)', fmt: row => fmt(row.aF,3) },
      { label: 'a(S)', fmt: row => fmt(row.aS,3) },
      { label: 'tf min [s]', fmt: row => fmt(row.tfmin,3) },
      { label: 'Sf min [m]', fmt: row => fmt(row.Sfmin,2) },
      { label: 'S oprire [m]', fmt: row => fmt(r.opriri[r.franareRows.indexOf(row)].Sopr,2) }
    ], r.franareRows);

    h2('2.2 Repartitia fortei de franare pe punti');
    pFormula('gamma1 = a_frel*(b/L + a_frel*hg/L)     gamma2 = a_frel*(a/L - a_frel*hg/L)   (rel. 3.355)');
    await addChartImage('chartRepartitie', 'gamma1, gamma2 functie de a_frel (incarcat/descarcat)', CONTENT_W, 70);
    const w2 = (CONTENT_W - 6) / 2;
    checkPageBreak(60);
    doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text('Incarcat', MARGIN, y);
    doc.text('Descarcat', MARGIN + w2 + 6, y);
    y += 5;
    const yAfterTitle = y;
    drawMiniTable(MARGIN, y, w2, r.repartitieIncarcat);
    drawMiniTable(MARGIN + w2 + 6, yAfterTitle, w2, r.repartitieDescarcat);
    y = yAfterTitle + Math.min(r.repartitieIncarcat.length, 10) * 4.4 + 4.6 + 8;
  }

  function drawMiniTable(x, yTop, w, rows) {
    let yy = yTop;
    doc.setFillColor(14,17,22); doc.rect(x, yy, w, 4.6, 'F');
    doc.setFont('courier', 'bold'); doc.setFontSize(7);
    doc.setTextColor(245,243,237);
    doc.text('a_frel', x+1.5, yy+3.3);
    doc.text('g1', x+w*0.4, yy+3.3);
    doc.text('g2', x+w*0.7, yy+3.3);
    yy += 4.6;
    doc.setTextColor(30);
    rows.slice(0,10).forEach((row,i)=>{
      if (i%2===0){ doc.setFillColor(251,250,246); doc.rect(x,yy,w,4.4,'F'); }
      doc.setFont('courier','normal'); doc.setFontSize(7);
      doc.text(fmt(row.afrel,1), x+1.5, yy+3.2);
      doc.text(fmt(row.gamma1,3), x+w*0.4, yy+3.2);
      doc.text(fmt(row.gamma2,3), x+w*0.7, yy+3.2);
      yy += 4.4;
    });
    doc.setDrawColor(216,211,196); doc.rect(x, yTop, w, yy-yTop);
  }

  async function sectionManiabilitate(p, r) {
    h1('3. Maniabilitate si stabilitate');

    h2('3.1 Unghiuri de bracare si raza minima de virare');
    pFormula('ctg(theta_e) - ctg(theta_i) = Ep/L   (conditia Ackermann, rel. 3.362)     Rv_min = L/tg(theta_mediu)   (rel. 3.365)');
    kpiStrip([
      { label: 'Raza minima virare', value: fmt(r.manRes.Rvmin,2) + ' m' },
      { label: 'theta_e max', value: fmt(r.manRes.thetaE_max_deg,1) + ' grade' },
      { label: 'theta_i max (impus)', value: fmt(r.manRes.thetaImax_deg,1) + ' grade' }
    ]);
    await addChartPair('chartAngles', 'chartBg', 'Unghiuri bracare = f(Rv)', 'Fasie gabarit = f(Rv)');
    table('Tabel centralizator maniabilitate', [
      { label: 'Rv [m]', fmt: row => fmt(row.Rv,0) },
      { label: 'theta_e [grade]', fmt: row => fmt(row.thetaE_deg,2) },
      { label: 'theta_i [grade]', fmt: row => fmt(row.thetaI_deg,2) },
      { label: 'theta [grade]', fmt: row => fmt(row.theta_deg,2) },
      { label: 'Bg [m]', fmt: row => fmt(row.Bg,3) }
    ], r.manRes.rows);

    h2('3.2 Stabilitatea longitudinala');
    pFormula('tg(alpha_r) <= b/hg  (rasturnare, rel. 3.387)     tg(alpha_p) > phi*a/(L-phi*hg)  (patinare, rel. 3.391)');
    const sl = r.stabLong;
    alertBox(`Urcare panta: alpha_r (rasturnare) = ${fmt(sl.alphaR_deg,2)} grade vs alpha_p (patinare) = ${fmt(sl.alphaP_deg,2)} grade. ${sl.okUrcare ? 'Conditie indeplinita: patinarea precede rasturnarea.' : 'Atentie: verificati aderenta.'}`, sl.okUrcare ? 'ok' : 'warn');
    alertBox(`Coborare panta: unghi limita rasturnare = ${fmt(sl.alphaCob_deg,2)} grade. ${sl.okCoborare ? 'Conditia phi < a/hg este indeplinita.' : 'Atentie: verificati coeficientul de aderenta.'}`, sl.okCoborare ? 'ok' : 'warn');
    kpiStrip([
      { label: 'Viteza critica rasturnare', value: fmt(sl.vCritic_kmh,1) + ' km/h' }
    ]);

    h2('3.3 Stabilitatea transversala - derapare si rasturnare');
    pFormula('vd = sqrt(g*Rv*(phi1+tgB)/(1-phi1*tgB))   (rel. 3.426)     vr = sqrt(g*Rv*(E/2hg+tgB)/(1-0.5*E/hg*tgB))   (rel. 3.416)');
    kpiStrip([
      { label: 'Prag rasturnare E/2hg', value: fmt(r.stabTrans.pragRasturnare,3) }
    ]);
    await addChartPair('chartDerapare', 'chartRasturnare', 'Viteza limita derapare vd', 'Viteza limita rasturnare vr');
  }

  function sectionConcluzii(p, r) {
    h1('4. Concluzii');
    pText(`Proiectul a fost calculat pentru un autovehicul cu greutatea totala de ${fmt(p.G_total_daN,0)} daN, echipat cu motor ${p.motorType} de ${fmt(p.Pen,1)} kW la turatia nominala de ${p.nn} rot/min. Viteza maxima calculata este de ${fmt(r.vmaxRes.vmax_kmh,1)} km/h, obtinuta cu o cutie de viteze in ${r.trepte.n} trepte (raport treapta I = ${fmt(r.icv1,2)}, ratie geometrica q = ${fmt(r.trepte.q,3)}).`);
    pText(`La franare, spatiul minim de oprire la viteza maxima este de aproximativ ${fmt(r.franareRows[r.franareRows.length-1].Sfmin,1)} m, cu o decelerație maxima de ${fmt(r.franareRows[r.franareRows.length-1].aFS,2)} m/s2.`);
    pText(`Din punct de vedere al maniabilitatii, raza minima de virare este de ${fmt(r.manRes.Rvmin,2)} m. Stabilitatea longitudinala la urcarea pantei maxime este ${r.stabLong.okUrcare ? 'asigurata, patinarea rotilor motoare aparand inaintea pericolului de rasturnare' : 'limitata — se recomanda verificarea suplimentara a coeficientului de aderenta si a pozitiei centrului de greutate'}.`);
    pText('Toate calculele au fost efectuate conform metodologiei din indrumarul "Dinamica Autovehiculelor" (Prof.univ.dr.ing. Manea Adriana-Teodora, Universitatea "Ovidius" Constanta), urmarind secventa exemplului de calcul din Anexa A14.');
  }

  /* ================================================================
     ENTRY POINT
     ================================================================ */
  async function generate(params, results) {
    setProgress('Se pregateste documentul...');
    init();

    coverPage(params, results);

    setProgress('Se scriu parametrii de intrare...');
    sectionParametri(params);

    setProgress('Se construieste capitolul de tractiune...');
    await sectionTractiune(params, results);

    setProgress('Se construieste capitolul de franare...');
    doc.addPage(); pageNum++; y = MARGIN; addHeader();
    await sectionFranare(params, results);

    setProgress('Se construieste capitolul de maniabilitate...');
    doc.addPage(); pageNum++; y = MARGIN; addHeader();
    await sectionManiabilitate(params, results);

    sectionConcluzii(params, results);

    addFooter();

    setProgress('Se salveaza fisierul PDF...');
    doc.save('Raport-Dinamica-Autovehiculelor.pdf');

    setTimeout(() => { clearProgress(); toast('Raport PDF generat cu succes.'); }, 400);
  }

  return { generate };
})();
