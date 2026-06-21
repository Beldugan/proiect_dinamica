/* ===================================================================
   DATA.JS — Tabele de referinta extrase din indrumar, folosite pentru
   valori implicite / selecturi in formular.
   =================================================================== */

const BookData = {

  // Tabelul 3.16 — valori medii coeficient rezistenta la rulare f
  drumuri: [
    { id: "asfalt_bun",      nume: "Sosea asfaltata/betonata — buna",        f: 0.0165, phi_inalta: 0.75, phi_joasa: 0.875 },
    { id: "asfalt_satisf",   nume: "Sosea asfaltata/betonata — satisfacatoare", f: 0.019, phi_inalta: 0.60, phi_joasa: 0.50 },
    { id: "pietruit_bun",    nume: "Drum pietruit — bun",                    f: 0.0225, phi_inalta: 0.55, phi_joasa: 0.65 },
    { id: "pavat_bun",       nume: "Drum pavat — bun",                       f: 0.0275, phi_inalta: 0.55, phi_joasa: 0.65 },
    { id: "pamant_uscat",    nume: "Drum de pamant — uscat-batatorit",       f: 0.030, phi_inalta: 0.55, phi_joasa: 0.45 },
    { id: "zapada_bat",      nume: "Drum cu zapada batatorita",              f: 0.040, phi_inalta: 0.225, phi_joasa: 0.175 }
  ],

  // Tabelul 3.36 — phi si f functie de tipul drumului (pentru franare)
  drumuriFranare: [
    { id: "asfalt_uscat", nume: "Asfalt uscat", phi: 0.70, f: 0.0175 },
    { id: "asfalt_umed",  nume: "Asfalt umed",  phi: 0.45, f: 0.015 },
    { id: "pamant_bat",   nume: "Pamant batatorit", phi: 0.50, f: 0.030 },
    { id: "zapada_bat",   nume: "Zapada batatorita", phi: 0.20, f: 0.040 }
  ],

  // Tabelul 3.17 / 3.18 — Cx si A orientative
  tipuriCaroserie: [
    { id: "autoutilitara", nume: "Autoutilitara", Cx: 0.41, A: 2.75 },
    { id: "camion_usor",   nume: "Autocamion usor", Cx: 0.46, A: 2.75 },
    { id: "camion_mijlociu", nume: "Autocamion mijlociu", Cx: 0.59, A: 3.5 },
    { id: "camion_greu",   nume: "Autocamion greu (neprofilat)", Cx: 0.898, A: 6.92 },
    { id: "autobuz_urban", nume: "Autobuz urban", Cx: 0.36, A: 5.5 },
    { id: "autocar",       nume: "Autocar", Cx: 0.315, A: 4.5 }
  ],

  // Tabelul 3.31 — coeficient de turatie kn
  kn: [
    { id: "autoturisme", nume: "Autoturisme", min: 30, max: 50 },
    { id: "mas", nume: "Autovehicul transport, motor MAS", min: 40, max: 55 },
    { id: "mac", nume: "Autovehicul transport, motor MAC", min: 30, max: 40 }
  ],

  // Tabelul 3.27 — coeficient elasticitate / adaptabilitate orientative MAC/MAS
  motorTipuri: [
    { id: "MAC", nume: "MAC (Diesel)", ke: [0.55, 0.75], ka: [1.05, 1.20], a1b1c1: { a1: 0.53, b1: 1.56, c1: 1.09, label: "MAC 4 timpi, injectie directa" } },
    { id: "MAS", nume: "MAS (benzina)", ke: [0.45, 0.65], ka: [1.15, 1.40], a1b1c1: { a1: 1, b1: 1, c1: 1, label: "MAS" } }
  ],

  // Tabelul 3.28 — randamente organe transmisie
  randamente: {
    cutieVitezePrizaDirecta: [0.97, 0.98],
    cutieVitezeAlteTrepte: [0.89, 0.94],
    transmisieLongitudinala: [0.990, 0.995],
    transmisiePrincipalaSimpla: [0.92, 0.94],
    transmisiePrincipalaDubla: [0.90, 0.92],
    cutieDistributie: [0.92, 0.94]
  },

  // A1 — caracteristici anvelope conventionale (subset reprezentativ)
  anvelope: [
    { simbol: "9,00-20", B_in: 9.00, d_in: 20, Dn: 1020, presiune: 6.0, sarcina: 2000 },
    { simbol: "10,00-20", B_in: 10.00, d_in: 20, Dn: 1050, presiune: 6.0, sarcina: 2245 },
    { simbol: "11,00-20", B_in: 11.00, d_in: 20, Dn: 1080, presiune: 6.0, sarcina: 2535 },
    { simbol: "12,00-20", B_in: 12.00, d_in: 20, Dn: 1118, presiune: 6.75, sarcina: 3375 },
    { simbol: "14,00-20", B_in: 14.00, d_in: 20, Dn: 1240, presiune: 6.0, sarcina: 3450 },
    { simbol: "11,00-24", B_in: 11.00, d_in: 24, Dn: 1181, presiune: 6.0, sarcina: 2900 },
    { simbol: "12,00-24", B_in: 12.00, d_in: 24, Dn: 1220, presiune: 6.0, sarcina: 3150 }
  ],

  // Containere ISO seria 1 — Tabelul 1.2 (subset uzual)
  containere: [
    { tip: "1D", lungime_mm: 2991, latime_mm: 2438, inaltime_mm: 2438, masaBruta_kg: 10160, tara_kg: 1400 },
    { tip: "1C", lungime_mm: 6058, latime_mm: 2438, inaltime_mm: 2438, masaBruta_kg: 20320, tara_kg: 2200 },
    { tip: "1B", lungime_mm: 9125, latime_mm: 2438, inaltime_mm: 2438, masaBruta_kg: 25400, tara_kg: 3100 },
    { tip: "1A", lungime_mm: 12192, latime_mm: 2438, inaltime_mm: 2438, masaBruta_kg: 30480, tara_kg: 4000 }
  ],

  // Tabelul 3.2 — coordonate centru de greutate (a/L, b/L, hg/L)
  coordonateCG: [
    { tip: "Autoturisme", aL_inc: 0.52, bL_inc: 0.48, hgL_inc: 0.20 },
    { tip: "Autocamioane", aL_inc: 0.68, bL_inc: 0.32, hgL_inc: 0.27 },
    { tip: "Autobuze", aL_inc: 0.59, bL_inc: 0.41, hgL_inc: 0.25 }
  ],

  // exemplu de configurare implicita (preluat din Anexa A14, pag 57-62)
  exemplulCartii: {
    G_total_daN: 18000,
    G0_daN: 8240,
    nPersoane: 2,
    Gpersoana_daN: 75,
    L: 4.5,
    bL_incarcat: 0.25,
    hgL_incarcat: 0.2444,
    hgL_descarcat: 0.2667,
    Pen: 172.84,
    nn: 2100,
    nmin: 500,
    nmax: 2100,
    ke: 0.69,
    motorType: "MAC",
    Qinf: 42000,
    eta_l: 0.35,
    Dn_in: 44.02,
    d_in: 20,
    lambda: 0.95,
    f0: 0.013295,
    f02: 1.8036e-7,
    Cx: 0.898,
    A: 6.92,
    eta_cd: 0.93,
    eta_cv: 0.99,
    eta_c: 0.98,
    eta_0: 0.91,
    eta_f: 1.0,
    nvmax_factor: 1.0,
    alphaMax_deg: 19,
    icvI_book: 8,
    phi_drum: 0.45,
    nTrepte: 8,
    E1: 1.995,
    E2: 1.835,
    thetaImax_deg: 50,
    phiFranare: 0.7,
    fFranare: 0.015,
    t0: 0.5, t1p: 0.03, t1pp: 0.5
  }
};
