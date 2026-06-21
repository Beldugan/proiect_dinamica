# Dinamica Autovehiculelor — Calculator de proiectare

Aplicație web (100% client-side, fără backend) care automatizează calculul din îndrumarul **"Dinamica Autovehiculelor"** (Universitatea "Ovidius" Constanța, Prof.univ.dr.ing. Manea Adriana-Teodora): calculul de tracțiune, calculul la frânare și maniabilitatea/stabilitatea unui autovehicul, urmărind metodologia exemplului de calcul din **Anexa A14**.

Introduci parametrii constructivi ai autovehiculului (motor, transmisie, pneuri, greutăți, drum), aplicația rulează toate formulele din capitolele 3.4–3.8, afișează rezultatele cu tabele și grafice interactive, apoi generezi un **raport PDF complet** cu tot calculul, gata de predat sau arhivat.

Totul rulează în browser — niciun parametru introdus nu părăsește dispozitivul tău.

## Funcționalități

- **Calcul de tracțiune** — caracteristica externă a motorului, raza de rulare, viteza maximă, rapoartele cutiei de viteze (diagrama fierăstrău), bilanțul de tracțiune și de putere, caracteristica dinamică, accelerația, timpul și spațiul de demarare.
- **Calcul la frânare** — decelerația maximă, timpul și spațiul minim de frânare, spațiul de oprire total, repartiția forței de frânare pe punți (încărcat/descărcat).
- **Maniabilitate și stabilitate** — unghiurile de bracare, raza minimă de virare, fâșia de gabarit, stabilitatea longitudinală la urcare/coborâre, stabilitatea transversală la derapare și răsturnare.
- **Raport PDF** — document complet, cu copertă, toate tabelele de calcul, formulele folosite și graficele aferente fiecărei secțiuni.
- Valori implicite preluate din exemplul de calcul al cărții (Anexa A14), plus tabele de referință (pneuri, drumuri, caroserii) pentru completare rapidă.
- Export/import parametri în format JSON, pentru a relua sau partaja un proiect.

## Structura proiectului

```
.
├── index.html              # pagina aplicatiei (formular + panele de rezultate)
├── css/
│   └── style.css           # stilul vizual (planseta de inginerie)
├── js/
│   ├── engine.js           # toate formulele de calcul (motorul aplicatiei)
│   ├── data.js              # tabele de referinta din carte (pneuri, drumuri, etc.)
│   ├── ui.js                 # citire formular, orchestrare calcul, randare tabele
│   ├── charts.js            # definitiile graficelor (Chart.js)
│   ├── main.js               # navigare intre panele, randare rezultate, gauge animat
│   └── report.js            # generator raport PDF (jsPDF)
└── assets/
    └── favicon.svg
```

## Rulare locală

Aplicația nu are dependențe de build — sunt doar fișiere statice. Pentru a o rula local, ai nevoie doar de un server static simplu (browserele blochează modulele JS încărcate direct din `file://`):

```bash
# Python
python3 -m http.server 8000

# sau Node.js
npx serve .
```

Apoi deschide `http://localhost:8000` în browser.

## Deploy pe GitHub Pages

1. Creează un repository nou pe GitHub și încarcă tot conținutul acestui folder (păstrând structura de directoare).
2. În repository, mergi la **Settings → Pages**.
3. La **Source**, alege **Deploy from a branch**, branch **main**, folder **/ (root)**.
4. Salvează. După 1-2 minute, aplicația va fi disponibilă la `https://<utilizator>.github.io/<nume-repo>/`.

Alternativ, dacă preferi deploy automat prin GitHub Actions, folosește workflow-ul inclus în `.github/workflows/deploy.yml` — activează-l din **Settings → Pages → Source → GitHub Actions**.

## Librării folosite (încărcate din CDN)

- [Chart.js](https://www.chartjs.org/) — graficele interactive
- [jsPDF](https://github.com/parallax/jsPDF) — generarea raportului PDF
- [html2canvas](https://html2canvas.hertzen.com/) — utilitar auxiliar pentru capturi (rezervă)
- Fonturi: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), [IBM Plex Sans / Mono](https://fonts.google.com/specimen/IBM+Plex+Sans) (Google Fonts)

Nu este nevoie de `npm install` sau build step — totul e încărcat direct în `index.html`.

## Note despre metodologia de calcul

- Formulele urmează numerotarea din îndrumar (ex. "rel. 3.41" = relația 3.41 din curs) — fiecare secțiune a raportului indică formulele folosite.
- Pentru caracteristica externă a motorului se folosește Varianta 2 a parabolei de gradul trei (relația 3.43), aceeași variantă folosită explicit în exemplul A14.
- Coeficientul de rezistență la rulare `f` se calculează cu relația 3.55 (`f = f0 + 3.6²·f02·v²`).
- Viteza maximă se obține ca rădăcină a ecuației de gradul trei (relația 3.67).
- Integrarea timpului/spațiului de demaraj respectă observația din carte (pag. 31-36) conform căreia motorul funcționează pe caracteristica externă doar în zona de stabilitate `[nM...nmax]`.
- Valorile implicite ale formularului reproduc exemplul A14 din carte; rezultatele calculate (viteză maximă ≈ 95 km/h, raport i₀ ≈ 4.41, rază de rulare ≈ 531mm) sunt apropiate de cele din exemplul original (92 km/h, i₀=4.59, rr=531mm) — diferențele mici provin din variantele alternative de formule disponibile în carte pentru anumiți pași (ex. coeficientul de încărcare dinamică, alegerea exactă a turației de schimbare pe trepte).

Aplicația este un instrument de **asistare a calculului**, nu un substitut pentru verificarea inginerească — recomandăm compararea rezultatelor cu valorile orientative din tabelele cărții (de ex. Tabelul 3.34 — calități dinamice, Tabelul 3.41 — decelerație și spațiu de frânare) înainte de a preda proiectul.

## Licență

Acest cod este oferit ca instrument educațional auxiliar. 
