# Strumenti HTML del modulo Struttura e Architettura

Pagine statiche, senza dipendenze esterne e senza passaggi di build: funzionano su GitHub Pages e aprendo `index.html` dal disco.

| File | Contenuto |
|---|---|
| `index.html` | indice con le schede di tutte le pagine |
| `lezione1.html` | **predimensionamento (livello 1) del telaio centrale** (esempio svolto delle slide: acciaio a un piano e c.a. a due piani; si cambiano materiale e schema, campate (1-4) e interassi B₁ e B₂, numero di piani e altezza di ciascun interpiano; ingombri di travi e pilastri in pianta e in prospetto, tabelle delle travi, dei pilastri per interpiano, altezza netta e confronto di acciaio e c.a.; l'altezza di interpiano non cambia i pilastri); **domanda e capacità** (sezione `#margine`: D_k, γ_F, C_k, γ_M, barre D e C, esito e margine, tre esempi); unità di misura; link al telaio per «Stessa maglia» in acciaio e c.a. |
| `lezione2.html` | area d'influenza di travi e pilastri con **campate diverse** (cursore per campata), carichi da G₁, G₂, Q con la **combinazione delle azioni** a scelta (SLU fondamentale, SLE rara, frequente, quasi permanente) e i coefficienti ψ della Tab. 2.5.I per categoria (anche un secondo carico variabile: si prova ogni variabile come principale), solaio a una via e a due vie con ripartizione a 45° (triangolo L_c²/4, trapezio L_c(2L_l − L_c)/4); sezione **neve** (`#neve`): q_s = μ₁·q_sk·C_E·C_t secondo le NTC 2018 §3.4 con zona, quota, falda ed esposizione |
| `lezione3.html` | acciaio passo per passo: livello 1 (trave h = L/x; pilastro lato ≈ 30·L_max·pos·√n, senza regola di snellezza), carichi, momento, W_min, **I_y,min** e primo IPE con W e I sufficienti (la freccia non si verifica), pilastro HEA o HEB (A_min e **i_min**, che è del livello 2), **telaio di riferimento** in prospetto (travi IPE e pilastri HE dimensionati, trave e pilastro studiati in rosso) e area d'influenza in pianta, come nella Lezione 4 (campate L₁ e L, interasse B, pilastro sinistro, centrale o destro con pos e L_max dedotti); sezioni in scala; esempio svolto delle slide in sei voci |
| `lezione4.html` | calcestruzzo armato passo per passo: carichi del piano tipo e della copertura (neve), trave emergente o a spessore (piano 1 o copertura, prima o seconda campata), pilastro con N di tutti i piani sopra e livello 1 con L_max e pos (sinistro e destro di bordo, centrale interno; trave trasversale più lunga), sezioni in scala; esempio svolto delle slide in sette voci |
| `telaio.html` | telaio piano in acciaio o c.a. (**il legno non è più nelle pagine**: le funzioni restano in `calc.js`, `telaio-calc.js`, `impatto-calc.js`, `telaio-ui.js` e nelle prove; i blocchi html tolti sono commentati in `telaio.html`): campate, piani, luci, sbalzi, luce fuori piano, sezioni in scala. **Travi e pilastri si possono togliere** (vuoti e doppie altezze; i pilastri solo dall'alto e con la testa libera; lo sbalzo esiste solo con la trave adiacente), con persone di 1,75 m per le proporzioni; si può anche cliccare sulla trave o sul pilastro nel disegno (se il pilastro non si può togliere, il messaggio spiega perché). Sotto il disegno, **la pianta** di un livello con la luce fuori piano B e l'area d'influenza delle travi. Tabelle separate per livello 1 e livello 2. **Sbalzi**: in una campata tolta si possono prolungare le travi vicine (sbalzi «nel vuoto», solo se la trave da prolungare esiste, somma ≤ luce della trave tolta) e cliccando uno sbalzo di estremità se ne cambia la lunghezza solo a quel livello; persone anche sugli sbalzi. Le due figure (prospetto e pianta) hanno il pulsante «Schermo intero». **Stima della CO₂ e dei costi** (produzione dei materiali, A1–A3; costi in opera), con il confronto dello stesso telaio in acciaio e c.a. e valori unitari modificabili. **Carichi diversi ai vari piani** (casella sotto i cursori: tabella G₁, G₂, Q, Q sbalzi per livello, in copertura Q = neve; i cursori generali impostano tutti i livelli). Il **numero di ogni pilastro** compare in un cerchietto nel disegno (sotto il terreno) e nella pianta, e coincide con la colonna «Pilastro» delle tabelle. Livello 1 dei pilastri: lato ≈ κ·L_max·pos·√n (L_max = trave più lunga che arriva nel pilastro, anche quella trasversale lunga B; pos = 1 interno, 0,7 di bordo, 0,5 d'angolo; n = piani sopra il tratto); livello 2: A_min e, per l'acciaio, i_min = L₀/100, per il c.a. anche lato ≥ L₀/15 (come nelle slide della Lezione 4, conta con le doppie altezze). Travi: W_min e I_min, primo profilo con W e I sufficienti. Preset da URL: `?materiale=acciaio\|ca&piani=2&campate=2&sbalzo_sx=2&sbalzo_dx=1.5&serie=HEA\|HEB&senza=1:0,2:1&senzaPil=2:3&sbalziVuoto=2:1:1.5:2&sbalziLivello=2:sx:0.8` (chiavi `livello:campata` e `pilastro:interpiano`; `sx`/`dx` per gli sbalzi; `sbalziVuoto` = `livello:campata:da sinistra:da destra` in m; `sbalziLivello` = `livello:sx|dx:m`; `luci=4,5.5` luci delle campate in m, `H=3.5` altezza di interpiano, `B=6` luce fuori piano, `bordo=1` telaio di bordo, `acc=S235`, `fck=C25/30`, `vinc=semi`, `g1=3&g2=3&q=2&qb=4&neve=0.5` carichi in kN/m², `carichiLiv=1:3:4:2:4,2:3:3:0.5` carichi per livello `livello:G1:G2:Q[:Q sbalzi]`) |
| `assets/js/esempio.js` | riquadro «Esempio della lezione»: carica i dati dell'esempio svolto delle slide e confronta voce per voce i risultati della pagina con quelli delle slide (✓ uguale, ≈ entro lo 0,2 % per un arrotondamento delle slide, ≠ diverso) |
| `pdf/` | slide delle quattro lezioni, prontuario e syllabus, scaricabili dalla pagina iniziale e da ogni lezione |
| `tools/aggiorna_pdf.py` | riscrive nelle pagine il numero di pagine e la dimensione dei PDF di `pdf/` |
| `assets/js/calc.js` | formule e tabelle (IPE, HEA, HEB con i_z) usate da tutte le pagine: livello 1 (`RT.HLUCE`, `RT.latoK(mat, L_max, pos, n)` e `RT.latoKgrezzo`, `RT.POS_PILASTRO`), livello 2 (`RT.Imin`, `RT.sceltaIPE(W_min, I_min)`, `RT.imin`, `RT.sceltaHE`) |
| `assets/js/telaio-calc.js` | dimensionamento del telaio con travi e pilastri tolti: `RT.telaio` (geometria, materiali, carichi, travi, pilastri) e `RT.telaioStato` (che cosa si può togliere o rimettere) |
| `assets/js/impatto-calc.js` | stima di CO₂ e costi: `RT.impatto`, valori predefiniti in `RT.IMPATTO_DEF` (fonti nella pagina del telaio) |
| `assets/js/telaio-ui.js` | interfaccia di `telaio.html`: stato, matrici delle travi e dei pilastri, disegno in prospetto, pianta, tabelle, CO₂ e costi, eventi, preset da URL |
| `tests.html`, `tests/` | prove automatiche: confronto dei risultati di `RT.telaio`, `RT.impatto` e delle funzioni delle lezioni con i valori di riferimento `tests/golden.json`. Apri `tests.html` in un server locale: deve dire «Tutte le prove coincidono» |
| `assets/js/sagomario_he.py` | estrae HEA e HEB (h, b, A, G, i_y, i_z) dal sagomario ArcelorMittal e stampa gli array di `RT.HE` |

## Pubblicare su GitHub Pages

1. Crea un repository e copia **il contenuto** di questa cartella nella radice (oppure in `docs/`).
2. In *Settings > Pages* scegli il ramo e la cartella (`/` oppure `/docs`).
3. Il file `.nojekyll` è già presente. Tutti i percorsi sono relativi, quindi funzionano anche in un sotto-percorso (`utente.github.io/repo/`).
4. Gli script e il foglio di stile sono collegati con `?v=AAAAMMGG` (per esempio `calc.js?v=20261114`): quando modifichi un file in `assets/`, cambia quel numero in tutte le pagine, così i browser non usano copie vecchie (GitHub Pages le tiene in cache per circa 10 minuti).

## Provare in locale

```bash
python3 -m http.server 8000
```

poi apri `http://localhost:8000`.

## Limiti da dichiarare agli studenti

- Strumenti didattici: carichi ripartiti per area d'influenza, senza continuità delle travi né peso proprio degli elementi (compreso in G₁).
- I valori dei profili IPE e HEB vanno controllati sul sagomario ufficiale.
- I criteri di predimensionamento sono quelli degli appunti del laboratorio (1/11/2026); le verifiche complete restano a Tecnica delle Costruzioni.

## Esempio della lezione e QR delle slide
Ogni pagina di lezione ha in alto il riquadro **Esempio della lezione** con il pulsante «Carica l'esempio della lezione»: imposta tutti i dati dell'esempio svolto delle slide e mostra, accanto, i risultati delle slide e quelli della pagina. I QR delle slide puntano a:

| URL | Che cosa apre |
|---|---|
| `lezione1.html#predim` | predimensionamento del telaio, livello 1 (sezione A) |
| `lezione1.html#margine` | domanda e capacità: il margine (D ≤ C con i coefficienti parziali) |
| `lezione1.html?esempio=1` · `?esempio=2` | predimensionamento del telaio centrale (L₁ = 4 m, L₂ = 5,5 m, B₁ = 5 m, B₂ = 6 m, H = 3,8 m): in acciaio a 1 piano · in c.a. a 2 piani |
| `lezione2.html?esempio=1` | telaio centrale: L₁ = 4 m, L₂ = 5,5 m, B₁ = 5 m, B₂ = 6 m, q_d = 9,15 kN/m², N = 100,65 · 239,04 · 138,39 kN |
| `lezione2.html?esempio=2` | solaio a due vie, pannello 6 × 5 m, ripartizione a 45° (6,25 e 8,75 m²) |
| `lezione2.html?esempio=3` · `?esempio=4` | neve a Roma (zona III: q_sk = 0,60, μ₁ = 0,8, q_s = 0,48 kN/m²) · zona II a 600 m (q_sk = 2,17) |
| `lezione2.html#neve` | sezione sul carico della neve (NTC 2018 §3.4) |
| `lezione3.html?esempio=N` | N = 1 trave di un solaio, 2 trave del telaio da 5,5 m, 3 trave da 4 m, 4-6 i tre pilastri |
| `lezione4.html?esempio=N` | N = 1-4 le quattro travi (piano 1 e copertura, 5,5 e 4 m), 5-7 i tre pilastri |
| `telaio.html?materiale=acciaio&piani=2&luci=6,6&H=3.5&B=6` | «Stessa maglia» della lezione 1 (livello 1), acciaio |

Il parametro `?esempio=N` vale per tutte le pagine di lezione (N parte da 1); senza parametro la pagina si apre con i suoi valori predefiniti. Il confronto è solo informativo: se cambi un dato, il riquadro avvisa che i risultati non sono più quelli delle slide.

## PDF scaricabili
I file sono in `pdf/` (`lezione1.pdf` … `lezione4.pdf`, `prontuario.pdf`, `syllabus.pdf`). Quando si ricompilano le slide, copia il nuovo PDF in `pdf/` e lancia, dalla cartella `html`:

```bash
python3 tools/aggiorna_pdf.py
```

Lo script riscrive in `index.html` e nelle pagine di lezione il numero di pagine e la dimensione (elementi `<span class="pdf-info" data-pdf="lezione1">`). I link usano l'attributo `download` e percorsi relativi: funzionano anche aprendo i file dal disco.

## Telefono e tablet
Il sito è pensato anche per iPhone: menu in alto a scorrimento orizzontale (la voce attiva resta in vista), campi da 16 px (niente ingrandimento al tocco), cursori e pulsanti da almeno 40-44 px, tabelle larghe con scorrimento nel riquadro, pilastri e travi del telaio con area di tocco di circa 32 px. Il selettore IT / EN ricarica la pagina.

## Tre livelli
Le pagine seguono i tre livelli del corso: **1 predimensionamento** (criteri geometrici, ingombri di partenza per eccesso), **2 dimensionamento** (criteri meccanici semplificati; la freccia si *verifica* con l'inerzia del profilo scelto), **3 verifica** (criteri completi, NTC 2018: non negli strumenti). I valori di livello 1 possono differire da quelli di livello 2: è normale. Backup delle versioni precedenti: `../slide/_backup/2026-11-05_prima_dei_tre_livelli/html/`.

## Prove automatiche
Dopo ogni modifica a `calc.js`, `telaio-calc.js` o `impatto-calc.js` apri `tests.html` (con `python3 -m http.server`): se un risultato cambia per scelta, rigenera `tests/golden.json` copiando il testo dal riquadro «Genera nuovi valori di riferimento» in fondo alla pagina.

## Muratura
La pagina sulla muratura portante è stata tolta dal sito per ora; una copia è in `../html_backup/2026-11-05_muratura/`.

## Prove in locale senza cache
Se il browser mostra una versione vecchia (soprattutto dopo aver cambiato `calc.js` o il dizionario inglese), ricarica forzando la cache (Maiusc + Ricarica).
