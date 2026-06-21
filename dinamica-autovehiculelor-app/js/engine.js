/* ===================================================================
   ENGINE.JS — Motorul de calcul "Dinamica Autovehiculelor"
   Implementeaza formulele din indrumarul de proiectare (Univ. Ovidius
   Constanta, Prof. Manea Adriana-Teodora), urmarind secventa din
   exemplul de calcul Anexa A14.
   Toate unitatile SI in interior; conversiile sunt explicite.
   =================================================================== */

const Engine = (() => {

  const g = 9.81; // acceleratia gravitationala [m/s2]

  // ---------- utilitare numerice ----------
  const lerp = (x0, y0, x1, y1, x) => y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  const deg2rad = (d) => d * Math.PI / 180;
  const rad2deg = (r) => r * 180 / Math.PI;
  const round = (v, n = 3) => {
    const f = Math.pow(10, n);
    return Math.round(v * f) / f;
  };
  const linspace = (a, b, n) => {
    const out = [];
    for (let i = 0; i < n; i++) out.push(a + (b - a) * i / (n - 1));
    return out;
  };

  /* =================================================================
     1. CARACTERISTICA EXTERNA A MOTORULUI  (par. 3.4.2.4, rel. 3.41-3.50)
     ================================================================= */
  function caracteristicaExterna(params) {
    const { Pen, nn, nmin, nmax, ke, motorType, a1b1c1, Qinf, eta_l } = params;
    // coeficientii a,b,c pentru curba puterii (Varianta 2, rel 3.43 - cea
    // folosita explicit in exemplul A14)
    const a = (3 - 4 * ke) / (2 * (1 - ke));
    const b = (2 * ke) / (2 * (1 - ke));
    const c = 1 / (2 * (1 - ke));

    const Men = 955.4 * Pen / nmax; // [daNm] rel 3.46 (Pen in kW, nmax in rot/min)

    const { a1, b1, c1 } = a1b1c1;

    const ce = (3600 * Math.pow(10, 3)) / (Qinf * eta_l); // [g/kWh] rel 3.48
    const a2 = 1.55, b2 = 1.55, c2 = 1.0; // valori medii rel 3.47

    const turatii = [];
    let n = Math.max(500, Math.round(nmin / 100) * 100);
    while (n < nmax) { turatii.push(n); n += 100; }
    turatii.push(nmax);

    const rows = turatii.map(ni => {
      const ratio = ni / nn;
      const Pei = Pen * (a * ratio + b * Math.pow(ratio, 2) - c * Math.pow(ratio, 3));
      const Mei = Men * (a1 + b1 * ratio - c1 * Math.pow(ratio, 2));
      const cei = ce * (a2 - b2 * ratio + c2 * Math.pow(ratio, 2));
      const Ci = (1 / 1000) * cei * Pei; // [kg/h] rel 3.50
      return { n: ni, Pe: Math.max(Pei, 0), Me: Math.max(Mei, 0), ce: cei, C: Ci };
    });

    return { rows, a, b, c, Men, ce, ka_check: null, nn, nmax, nmin };
  }

  /* =================================================================
     2. PNEU / RAZA DE RULARE (par. 3.4.1, rel 3.11-3.17)
     ================================================================= */
  function calculPneu(params) {
    const { Dn_in, d_in, lambda } = params; // diametre in inch
    const Dn = (Dn_in) * 25.4; // mm
    const d = d_in * 25.4; // mm
    const r0 = Dn / 2; // raza libera ~ raza nominala [mm]
    const rr = lambda * r0; // raza de rulare [mm]
    const H = (Dn - d) / 2;
    return { Dn, d, r0, rr_mm: rr, rr: rr / 1000, H };
  }

  /* =================================================================
     3. GREUTATI SI POZITIA CENTRULUI DE GREUTATE (par 3.4.1.3, 3.6.1)
     ================================================================= */
  function greutatiSiCG(params) {
    const { G_total_daN, G0_daN, nPersoane, Gpersoana_daN, L,
            bL_incarcat, hgL_incarcat, hgL_descarcat } = params;

    const G = G_total_daN * 10; // [N]  (1 daN = 10 N)
    const G0 = G0_daN * 10;
    const Ginc = G_total_daN - G0_daN - nPersoane * Gpersoana_daN; // daN incarcatura utila (marfa+container)

    const b = bL_incarcat * L; // [m] distanta CG -> puntea spate
    const a = L - b;           // [m] distanta CG -> puntea fata
    const hg_inc = hgL_incarcat * L;
    const hg_desc = hgL_descarcat * L;

    const G1 = G * b / L; // [N] pe puntea fata, autosasiu solo, rel 3.5
    const G2 = G * a / L; // [N] pe puntea spate

    return { G, G0, Ginc_daN: Ginc, a, b, hg_inc, hg_desc, G1, G2 };
  }

  /* =================================================================
     4. COEFICIENT REZISTENTA LA RULARE f (rel 3.55: f0 + 3.6^2*f02*v^2)
     ================================================================= */
  function coefRulare(v_ms, f0, f02) {
    // v in m/s ; formula varianta 2b (rel 3.55) cu v[m/s]
    return f0 + Math.pow(3.6, 2) * f02 * Math.pow(v_ms, 2);
  }

  /* =================================================================
     5. RANDAMENT TRANSMISIE (rel 3.32)
     ================================================================= */
  function randamentTransmisie({ eta_cd, eta_cv, eta_c, eta_0, eta_f }) {
    return eta_cd * eta_cv * eta_c * eta_0 * eta_f;
  }

  /* =================================================================
     6. VITEZA MAXIMA  (rel 3.65-3.67)
     ================================================================= */
  function vitezaMaxima({ Pmax_W, f0, f02, G_N, k_aero, A, eta_tr }) {
    const B = (f0 * G_N) / (Math.pow(3.6, 2) * f02 * G_N + k_aero * A);
    const C = (eta_tr * Pmax_W) / (Math.pow(3.6, 2) * f02 * G_N + k_aero * A);
    const term = Math.sqrt(Math.pow(C / 2, 2) + Math.pow(B / 3, 3));
    const vmax = Math.cbrt(term + C / 2) - Math.cbrt(term - C / 2);
    return { vmax_ms: vmax, vmax_kmh: vmax * 3.6, B, C };
  }

  /* =================================================================
     7. RAPORT TRANSMITERE PRINCIPALA i0  (rel 3.248-3.250)
     ================================================================= */
  function raportI0({ nvmax_factor, nn, rr, vmax_ms }) {
    const nvmax = nvmax_factor * nn; // rel 3.249
    const i0 = (Math.PI * nvmax * rr) / (30 * vmax_ms); // rel 3.248
    return { i0, nvmax };
  }

  /* =================================================================
     8. RAPORT TREAPTA I (icv1) — rel 3.251-3.253 + verificare panta
     ================================================================= */
  function raportTreapta1(p) {
    const { f0, alphaMax_deg, G_N, rr, Mmax_daNm, eta_tr, i0, a, hg, phi, L } = p;
    const alphaMax = deg2rad(alphaMax_deg);
    const psiMax = f0 * Math.cos(alphaMax) + Math.sin(alphaMax); // rel 3.252

    // membrul stang (rel 3.251, icd=1)
    const icvI_min = (G_N * rr * psiMax) / (eta_tr * i0 * (Mmax_daNm * 9.80665) ); // Mmax convertit daNm->Nm prin *9.80665? -> il vom pastra in daN*m
    // Lucram in unitati "tehnice" ca in carte: G[N], r[m], M[daNm] -> trebuie aceeasi
    // baza ca exemplul A14, care foloseste M in daN*m si G in N direct (rezultat adimensional
    // pentru ca daNm = 10 Nm, deci se simplifica un factor 10 intre G si M doar daca ambele
    // sunt in N si Nm). Pastram exact reteta numerica din exemplul A14:
    const icvI_min_book = (G_N * psiMax * rr) / (Mmax_daNm * eta_tr * i0 * 1); // varianta din exemplu (pag 61)

    // greutate aderenta (caz autovehicul solo, rel 3.253)
    const Gad2 = (G_N * a * Math.cos(alphaMax)) / (L - hg * phi);
    const mm = 0.95; // coeficient de incarcare dinamica (valoare uzuala adoptata in exemplu)
    const mmGm = mm * Gad2;

    const icvI_max_book = (mmGm * rr * phi) / (Mmax_daNm * i0 * eta_tr);

    return { psiMax, icvI_min: icvI_min_book, icvI_max: icvI_max_book, Gad2, mmGm, alphaMax };
  }

  /* =================================================================
     9. SERIE GEOMETRICA TREPTE CUTIE DE VITEZE (rel 3.266-3.273)
     ================================================================= */
  function trepteCutie({ icv1, nn, nM, nTrepte }) {
    const qTeoretic = nn / nM; // rel 3.267
    let n = nTrepte;
    if (!n) {
      n = Math.ceil(1 + Math.log(icv1) / Math.log(qTeoretic));
    }
    const q = Math.pow(icv1, 1 / (n - 1)); // rel 3.269 recalculat
    const rapoarte = [];
    for (let i = 0; i < n; i++) {
      rapoarte.push(icv1 / Math.pow(q, i));
    }
    rapoarte[n - 1] = 1; // priza directa exacta
    return { n, q, rapoarte };
  }

  /* =================================================================
     10. VITEZA MAXIMA PE TREAPTA (rel 3.274)
     ================================================================= */
  function vitezaPeTreapta({ rr, nmax, i0, icv }) {
    return (Math.PI * rr * nmax) / (30 * i0 * icv);
  }

  /* =================================================================
     11. COEFICIENT MASE ROTATIVE delta (rel 3.163, varianta 2 folosita
         in exemplul A14: delta = 1 + 0.05*icv^2 -> verificam fata de
         tabelul 3.27, dar respectam reteta numerica din exemplu)
     ================================================================= */
  function deltaTreapta(icv) {
    return 1 + 0.05 * Math.pow(icv, 2);
  }

  /* =================================================================
     12. CARACTERISTICA FORTEI LA ROATA / BILANT TRACTIUNE-PUTERE
         pentru o treapta data, peste un vector de turatii (rel 3.276-3.283)
     ================================================================= */
  function bilantPeTreapta(params) {
    const {
      caracteristica, // rows din caracteristicaExterna (interpolate dupa nevoie)
      i0, icv, eta_tr, rr, G_N, f0, f02, k_aero, A, deltaCoef, alpha_deg = 0
    } = params;

    const alpha = deg2rad(alpha_deg);
    const itr = i0 * icv;

    const rows = caracteristica.rows.map(row => {
      const v = (Math.PI * rr * row.n) / (30 * itr); // [m/s] rel 3.264/3.282
      const FR = (row.Me * itr * eta_tr) / rr; // [N] rel 3.276 (Me in daNm -> *10 pt N*m daca G e in N)
      const FR_N = (row.Me * 9.80665) * itr * eta_tr / rr; // conversie corecta daNm->Nm
      const f = coefRulare(v, f0, f02);
      const Rr = G_N * f * Math.cos(alpha);
      const Rp = G_N * Math.sin(alpha);
      const Ra = k_aero * A * v * v;
      const sumRez = Rr + Rp + Ra;
      const Rd = FR_N - sumRez;
      const Pr = Rr * v;
      const Pp = Rp * v;
      const Pa = Ra * v;
      const PR = FR_N * v;
      const Pd = PR - (Pr + Pp + Pa);
      const D = (FR_N - Ra) / G_N; // factor dinamic rel 3.283
      return {
        n: row.n, v, f, Rr, Rp, Ra, sumRez, FR: FR_N, Rd, Pr, Pp, Pa,
        sumP: Pr + Pp + Pa, PR, Pd, D
      };
    });
    return rows;
  }

  /* =================================================================
     13. ACCELERATIE, TIMP SI SPATIU DE DEMARARE (rel 3.298-3.311)
     ================================================================= */
  function accelDemarare(rowsPeTreapta, deltaCoef, psi = 0) {
    return rowsPeTreapta.map(r => {
      const a = r.D > psi ? (r.D - psi) * g / deltaCoef : 0;
      return { ...r, a };
    });
  }

  function integrareDemarare(treptePopulate, nM) {
    // treptePopulate: array de { icv, rows: [{n,v,a,...}] } in ordine I..n
    // Conform cartii (pag. 31-36), motorul functioneaza pe caracteristica
    // externa doar in intervalul [nM...nmax] (zona de stabilitate). Pentru
    // fiecare treapta se retine doar segmentul de turatii [nM...nmax]:
    // viteza maxima a unei trepte inferioare = viteza minima a treptei
    // urmatoare (rel. 3.263), iar suma timpilor/spatiilor se face peste
    // aceste segmente utile, nu peste tot intervalul [nmin...nmax].
    let tCum = 0, sCum = 0;
    const out = [];
    treptePopulate.forEach((treapta, idx) => {
      const rows = treapta.rows.filter(r => r.n >= nM);
      const withDt = rows.map((r, i) => {
        if (i === 0 || r.a <= 0 || rows[i - 1].a <= 0) {
          return { ...r, dt: 0, ds: 0 };
        }
        const aInv0 = 1 / rows[i - 1].a;
        const aInv1 = 1 / r.a;
        const dv = r.v - rows[i - 1].v;
        const dt = ((aInv0 + aInv1) / 2) * dv;
        const ds = dt * (rows[i - 1].v + r.v) / 2;
        return { ...r, dt, ds };
      });
      withDt.forEach((r, i) => {
        tCum += Math.max(r.dt, 0);
        sCum += Math.max(r.ds, 0);
        out.push({ treapta: idx + 1, n: r.n, v: r.v, a: r.a, t: tCum, s: sCum });
      });
    });
    return out;
  }

  /* =================================================================
     14. FRANARE (rel 3.328-3.355)
     ================================================================= */
  function franare(params) {
    const { phi, f, k_aero, A, G_N, v_list, b, a_cg, L, hg } = params;
    return v_list.map(v => {
      const aFS = g * ((f + phi) + (k_aero * A * v * v) / G_N); // rel 3.329 simplificata (3.330 daca v2=0)
      const aF = g * (phi * (b / L) / (1 - phi * hg / L) + (k_aero * A * v * v) / G_N); // rel 3.333
      const aS = g * (phi * (a_cg / L) / (1 + phi * hg / L) + (k_aero * A * v * v) / G_N); // rel 3.335
      const tfmin = v / (g * phi); // rel 3.341
      const Sfmin = (v * v) / (2 * g * (f + phi)); // rel 3.347 (drum orizontal)
      return { v, aFS, aF, aS, tfmin, Sfmin };
    });
  }

  function spatiuOprire({ v, t0, t1p, t1pp, Sfmin }) {
    const ts = t0 + t1p + t1pp / 2; // rel 3.350 (factor 1/2 pe t1'')
    const Ss = v * ts;
    const Sopr = Sfmin + Ss;
    return { ts, Ss, Sopr };
  }

  function repartitieFranarePunti({ afrel_list, a_cg, b, L, hg }) {
    return afrel_list.map(afrel => ({
      afrel,
      gamma1: afrel * (b / L + afrel * hg / L),
      gamma2: afrel * (a_cg / L - afrel * hg / L)
    }));
  }

  /* =================================================================
     15. MANIABILITATE (rel 3.359-3.379)
     ================================================================= */
  function maniabilitate({ L, E1, E2, Ep, thetaImax_deg, Rv_list }) {
    const thetaImax = deg2rad(thetaImax_deg);
    const thetaE_max = Math.atan(L / (Ep + L / Math.tan(thetaImax)));
    const thetaMed_max = (thetaImax + thetaE_max) / 2;
    const Rvmin = L / Math.tan(thetaMed_max);

    const rows = Rv_list.map(Rv => {
      const thetaE = Math.atan(L / (Rv + 0.5 * Ep));
      const thetaI = Math.atan(L / (Rv - 0.5 * Ep));
      const thetaMed = (thetaE + thetaI) / 2;
      // rel. 3.377: Bg = L*(1/sin(thetaE) - 1/tg(thetaI)) + E2 - Ep
      const Bg = L * (1 / Math.sin(thetaE) - 1 / Math.tan(thetaI)) + E2 - Ep;
      return {
        Rv,
        thetaE_deg: rad2deg(thetaE),
        thetaI_deg: rad2deg(thetaI),
        theta_deg: rad2deg(thetaMed),
        Bg
      };
    });
    return { Rvmin, thetaE_max_deg: rad2deg(thetaE_max), thetaImax_deg, rows };
  }

  /* =================================================================
     16. STABILITATE LONGITUDINALA (rel 3.386-3.399)
     ================================================================= */
  function stabilitateLongitudinala({ b, a_cg, hg, phi, L, k_aero, A, G_N }) {
    const alphaR = Math.atan(b / hg); // rel 3.386
    const alphaP = Math.atan((phi * a_cg) / (L - phi * hg)); // rel 3.391
    const okUrcare = rad2deg(alphaR) > rad2deg(alphaP);

    const alphaCob = Math.atan(a_cg / hg); // rel 3.395
    const okCoborare = phi < (a_cg / hg);

    const vCritic_ms = Math.sqrt((b * G_N) / (k_aero * A * hg));
    return {
      alphaR_deg: rad2deg(alphaR), alphaP_deg: rad2deg(alphaP), okUrcare,
      alphaCob_deg: rad2deg(alphaCob), okCoborare,
      vCritic_kmh: vCritic_ms * 3.6
    };
  }

  /* =================================================================
     17. STABILITATE TRANSVERSALA — DERAPARE SI RASTURNARE (rel 3.416-3.427)
     ================================================================= */
  function stabilitateTransversala({ Rv_list, phi, phi1, hg, E1, E2, betaList_deg }) {
    const Em = (E1 + E2) / 2;
    const betaList = betaList_deg.map(deg2rad);

    const rows = Rv_list.map(Rv => {
      const vr = betaList.map(beta => {
        const tb = Math.tan(beta);
        const num = g * Rv * (Em / (2 * hg) + tb);
        const den = 1 - (0.5 * Em / hg) * tb;
        return den > 0 ? Math.sqrt(Math.max(num / den, 0)) : NaN;
      });
      const vd = betaList.map(beta => {
        const tb = Math.tan(beta);
        const num = g * Rv * (phi1 + tb);
        const den = 1 - phi1 * tb;
        return den > 0 ? Math.sqrt(Math.max(num / den, 0)) : NaN;
      });
      return { Rv, vr, vd };
    });
    const pragRasturnare = Em / (2 * hg);
    return { rows, betaList_deg, pragRasturnare, Em };
  }

  return {
    g, deg2rad, rad2deg, round, linspace, lerp,
    caracteristicaExterna, calculPneu, greutatiSiCG, coefRulare,
    randamentTransmisie, vitezaMaxima, raportI0, raportTreapta1,
    trepteCutie, vitezaPeTreapta, deltaTreapta, bilantPeTreapta,
    accelDemarare, integrareDemarare, franare, spatiuOprire,
    repartitieFranarePunti, maniabilitate, stabilitateLongitudinala,
    stabilitateTransversala
  };
})();
