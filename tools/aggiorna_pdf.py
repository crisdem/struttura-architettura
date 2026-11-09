#!/usr/bin/env python3
"""Aggiorna nelle pagine HTML il numero di pagine e la dimensione dei PDF scaricabili.

Uso (dalla cartella html):   python3 tools/aggiorna_pdf.py
Legge i file in pdf/ e riscrive il testo di ogni elemento <span class="pdf-info" data-pdf="NOME">...</span>
(e <small ...>, per i pulsanti) con «N pagine, X,Y MB» (data-en: «N pages, X.Y MB»). Non modifica altro.
Serve PyMuPDF (pip install pymupdf) per contare le pagine; senza PyMuPDF le conta con un'espressione regolare."""
import glob, os, re, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def pagine(percorso):
    try:
        import pymupdf
        with pymupdf.open(percorso) as d:
            return len(d)
    except ImportError:
        dati = open(percorso, 'rb').read()
        return len(re.findall(rb'/Type\s*/Page[^s]', dati))


def dimensione(percorso, lingua):
    b = os.path.getsize(percorso)
    if b >= 1024 * 1024:
        v, u = b / (1024 * 1024), 'MB'
    else:
        v, u = b / 1024, 'KB'
    t = f'{v:.1f}' if v < 100 else f'{v:.0f}'
    return (t.replace('.', ',') if lingua == 'it' else t) + ' ' + u


def main():
    info = {}
    for f in sorted(glob.glob(os.path.join(BASE, 'pdf', '*.pdf'))):
        nome = os.path.splitext(os.path.basename(f))[0]
        n = pagine(f)
        info[nome] = (f'{n} pagine, {dimensione(f, "it")}', f'{n} pages, {dimensione(f, "en")}')
        print(f'{nome}: {n} pagine, {dimensione(f, "it")}')
    schema = re.compile(r'<(span|small)([^>]*?class="pdf-info"[^>]*?data-pdf="([a-z0-9_-]+)"[^>]*?)>(.*?)</\1>', re.S)
    for pagina in glob.glob(os.path.join(BASE, '*.html')):
        testo = open(pagina, encoding='utf-8').read()

        def sost(m):
            tag, attr, nome = m.group(1), m.group(2), m.group(3)
            if nome not in info:
                print(f'  attenzione: pdf/{nome}.pdf non trovato ({os.path.basename(pagina)})', file=sys.stderr)
                return m.group(0)
            it, en = info[nome]
            attr = re.sub(r'\s*data-en="[^"]*"', '', attr)
            return f'<{tag}{attr} data-en="{en}">{it}</{tag}>'
        nuovo = schema.sub(sost, testo)
        if nuovo != testo:
            open(pagina, 'w', encoding='utf-8').write(nuovo)
            print('aggiornato', os.path.basename(pagina))


if __name__ == '__main__':
    main()
