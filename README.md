# Strumenti HTML del modulo Struttura e Architettura

Pagine statiche, senza dipendenze esterne e senza passaggi di build: funzionano su GitHub Pages e aprendo `index.html` dal disco.

| File | Contenuto |
|---|---|
| `index.html` | indice con le schede di tutte le pagine |
| `lezione1.html` | combinazione delle azioni, momento, W minimo e profilo, freccia verificata con l'inerzia del profilo; livello 1 (h ≈ L/x); domanda, capacità e coefficienti parziali; unità di misura |
| `lezione2.html` | area d'influenza di travi e pilastri, solaio a una via e a due vie |
| `lezione3.html` | acciaio passo per passo: livello 1 (h = L/x, i_min = βH/100), carichi, momento, W minimo, profilo IPE, freccia verificata, pilastro HEA o HEB (A_min e i_z), sezioni in scala |
| `lezione4.html` | calcestruzzo armato passo per passo: livello 1 (h ≈ L/10, ingombro ≈ 5·√(A·n)), trave emergente o a spessore, pilastro, sezioni in scala |
| `telaio.html` | telaio piano in acciaio, legno o c.a.: campate, piani, luci, sbalzi, luce fuori piano, sezioni in scala. **Travi e pilastri si possono togliere** (vuoti e doppie altezze; i pilastri solo dall'alto e con la testa libera; lo sbalzo esiste solo con la trave adiacente), con persone di 1,75 m per le proporzioni; si può anche cliccare sulla trave o sul pilastro nel disegno (se il pilastro non si può togliere, il messaggio spiega perché). Sotto il disegno, **la pianta** di un livello con la luce fuori piano B e l'area d'influenza delle travi. Tabelle separate per livello 1 e livello 2. **Stima della CO₂ e dei costi** (produzione dei materiali, A1–A3; costi in opera), con il confronto dello stesso telaio nei tre materiali e valori unitari modificabili. Preset da URL: `?materiale=acciaio\|legno\|ca&piani=2&campate=2&sbalzo_sx=2&sbalzo_dx=1.5&serie=HEA\|HEB&senza=1:0,2:1&senzaPil=2:3` (chiavi `livello:campata` e `pilastro:interpiano`; `sx`/`dx` per gli sbalzi) |
| `assets/js/calc.js` | formule e tabelle (IPE, HEA, HEB con i_z) usate da tutte le pagine: livello 1 (`RT.HLUCE`, `RT.latoK`, `RT.imin`), livello 2 (`RT.sceltaIPEverificato`, `RT.sceltaHE`) |
| `assets/js/telaio-calc.js` | dimensionamento del telaio con travi e pilastri tolti: `RT.telaio` (geometria, materiali, carichi, travi, pilastri) e `RT.telaioStato` (che cosa si può togliere o rimettere) |
| `assets/js/impatto-calc.js` | stima di CO₂ e costi: `RT.impatto`, valori predefiniti in `RT.IMPATTO_DEF` (fonti nella pagina del telaio) |
| `assets/js/telaio-ui.js` | interfaccia di `telaio.html`: stato, matrici delle travi e dei pilastri, disegno in prospetto, pianta, tabelle, CO₂ e costi, eventi, preset da URL |
| `tests.html`, `tests/` | prove automatiche: confronto dei risultati di `RT.telaio`, `RT.impatto` e delle funzioni delle lezioni con i valori di riferimento `tests/golden.json`. Apri `tests.html` in un server locale: deve dire «Tutte le prove coincidono» |
| `assets/js/sagomario_he.py` | estrae HEA e HEB (h, b, A, G, i_y, i_z) dal sagomario ArcelorMittal e stampa gli array di `RT.HE` |

## Pubblicare su GitHub Pages

1. Crea un repository e copia **il contenuto** di questa cartella nella radice (oppure in `docs/`).
2. In *Settings > Pages* scegli il ramo e la cartella (`/` oppure `/docs`).
3. Il file `.nojekyll` è già presente. Tutti i percorsi sono relativi, quindi funzionano anche in un sotto-percorso (`utente.github.io/repo/`).

## Provare in locale

```bash
python3 -m http.server 8000
```

poi apri `http://localhost:8000`.

## Limiti da dichiarare agli studenti

- Strumenti didattici: carichi ripartiti per area d'influenza, senza continuità delle travi né peso proprio degli elementi (compreso in G₁).
- I valori dei profili IPE e HEB vanno controllati sul sagomario ufficiale.
- I criteri di predimensionamento sono quelli degli appunti del laboratorio (1/11/2026); le verifiche complete restano a Tecnica delle Costruzioni.

## Tre livelli
Le pagine seguono i tre livelli del corso: **1 predimensionamento** (criteri geometrici, ingombri di partenza per eccesso), **2 dimensionamento** (criteri meccanici semplificati; la freccia si *verifica* con l'inerzia del profilo scelto), **3 verifica** (criteri completi, NTC 2018: non negli strumenti). I valori di livello 1 possono differire da quelli di livello 2: è normale. Backup delle versioni precedenti: `../slide/_backup/2026-11-05_prima_dei_tre_livelli/html/`.

## Prove automatiche
Dopo ogni modifica a `calc.js`, `telaio-calc.js` o `impatto-calc.js` apri `tests.html` (con `python3 -m http.server`): se un risultato cambia per scelta, rigenera `tests/golden.json` copiando il testo dal riquadro «Genera nuovi valori di riferimento» in fondo alla pagina.

## Muratura
La pagina sulla muratura portante è stata tolta dal sito per ora; una copia è in `../html_backup/2026-11-05_muratura/`.

## Prove in locale senza cache
Se il browser mostra una versione vecchia (soprattutto dopo aver cambiato `calc.js` o il dizionario inglese), ricarica forzando la cache (Maiusc + Ricarica).
