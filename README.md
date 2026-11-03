# Strumenti HTML del modulo Struttura e Architettura

Pagine statiche, senza dipendenze esterne e senza passaggi di build: funzionano su GitHub Pages e aprendo `index.html` dal disco.

| File | Contenuto |
|---|---|
| `index.html` | indice con le schede di tutte le pagine |
| `lezione1.html` | combinazione delle azioni, momento, W minimo e profilo; domanda, capacità e coefficienti parziali; unità di misura |
| `lezione2.html` | area d'influenza di travi e pilastri, solaio a una via e a due vie |
| `lezione3.html` | acciaio passo per passo: carichi, momento, W minimo, profilo IPE e freccia, pilastro HEB, sezioni in scala |
| `lezione4.html` | calcestruzzo armato passo per passo: trave emergente o a spessore, pilastro, sezioni in scala |
| `telaio.html` | telaio piano in acciaio, legno o c.a.: campate, piani, luci, sbalzi, luce fuori piano, sezioni in scala. Preset da URL: `?materiale=acciaio\|legno\|ca&piani=2&campate=2&sbalzo_sx=2&sbalzo_dx=1.5` |
| `muratura.html` | parete in muratura portante: quanto spessa? Tre requisiti (minimo di norma, snellezza, resistenza), sezione in scala. Preset: `?piani=3&tipo=bordo\|spina&materiale=pieno\|forato\|cls\|pietra\|tufo` |
| `assets/js/calc.js` | formule e tabelle (IPE, HEB) usate da tutte le pagine |

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
