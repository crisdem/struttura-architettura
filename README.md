# Strumenti HTML del modulo Struttura e Architettura

Pagine statiche, senza dipendenze esterne e senza passaggi di build: funzionano su GitHub Pages e aprendo `index.html` dal disco.

| File | Contenuto |
|---|---|
| `index.html` | indice, con i preset per le lezioni 3 e 4 |
| `lezione1.html` | combinazione delle azioni, momento, W minimo e profilo; domanda, capacità e coefficienti parziali; unità di misura |
| `lezione2.html` | area d'influenza di travi e pilastri, solaio a una via e a due vie |
| `telaio.html` | telaio piano in acciaio, legno o c.a.: campate, piani, luci, sbalzi, luce fuori piano, sezioni in scala. Preset da URL: `?materiale=acciaio\|legno\|ca&piani=2&campate=2&sbalzo_sx=2&sbalzo_dx=1.5` |
| `muratura.html` | parete in muratura portante: piani, interpiano, luce del solaio, aperture, tipo di muratura, snellezza; sezione in scala. Preset: `?piani=3&tipo=bordo\|spina&materiale=pieno\|forato\|cls\|pietra\|tufo\|storica` |
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
