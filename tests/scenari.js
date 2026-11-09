/* Scenari di prova per la libreria di calcolo (RT) e il telaio piano.
   Servono come "valori di riferimento": dopo ogni modifica del codice si apre tests.html e si controlla
   che i risultati siano uguali a quelli salvati in tests/golden.json. */
(function (root) {
  'use strict';
  function base(o) {
    var p = { n: 2, spans: [5, 5], H: 3.2, B: 5, bordo: false, g1: 2.5, g2: 2, q: 2, neve: 0.5, qb: 4, sx: 0, dx: 0,
      mat: 'acciaio', acciaio: 'S275', classeLegno: 'GL24h', bLegno: 160, chi: 0.5, fck: 'C25/30', vincolo: 'semi',
      travaTipo: 'emergente', serie: 'HEB', senza: {}, colSenza: {} };
    for (var k in o) p[k] = o[k];
    return p;
  }
  var SCENARI = [
    ['acciaio regolare', base()],
    ['acciaio HEA', base({ serie: 'HEA' })],
    ['acciaio appoggiata, bordo, B=7', base({ vincolo: 'appoggiata', bordo: true, B: 7 })],
    ['acciaio incastro, 3 campate disuguali', base({ vincolo: 'incastro', spans: [4, 6, 5.5], n: 3 })],
    ['acciaio doppia altezza a sinistra', base({ n: 3, spans: [5, 5, 5], senza: { '1:0': true } })],
    ['acciaio doppia altezza al centro', base({ n: 3, spans: [5, 5, 5], senza: { '1:1': true } })],
    ['acciaio arretramento in copertura', base({ n: 3, spans: [5, 5, 5], senza: { '3:2': true }, colSenza: { '3:3': true } })],
    ['acciaio copertura senza travi (testa libera)', base({ senza: { '2:0': true, '2:1': true } })],
    ['acciaio pilastro tolto del tutto', base({ spans: [5, 5], senza: { '1:0': true, '2:0': true }, colSenza: { '0:1': true, '0:2': true } })],
    ['acciaio sbalzi', base({ sx: 1.5, dx: 2 })],
    ['acciaio sbalzo sx tolto al piano 2', base({ sx: 1.5, dx: 2, senza: { '2:sx': true } })],
    ['acciaio sbalzo dx senza trave adiacente', base({ dx: 1.5, senza: { '2:1': true } })],
    ['legno regolare 3 piani', base({ mat: 'legno', n: 3, g1: 1.5, g2: 1.5, chi: 0.3 })],
    ['legno doppia altezza', base({ mat: 'legno', n: 3, spans: [5, 5, 5], g1: 1.5, g2: 1.5, chi: 0.3, senza: { '1:0': true } })],
    ['legno GL32h base 200', base({ mat: 'legno', classeLegno: 'GL32h', bLegno: 200, g1: 1.5, g2: 1.5, chi: 0.3 })],
    ['c.a. emergente', base({ mat: 'ca', g1: 3.5 })],
    ['c.a. a spessore', base({ mat: 'ca', g1: 3.5, travaTipo: 'spessore' })],
    ['c.a. doppia altezza con sbalzo', base({ mat: 'ca', g1: 3.5, n: 3, spans: [5, 5, 5], sx: 1.5, senza: { '1:0': true, '1:sx': true } })],
    ['c.a. C30/37 senza neve', base({ mat: 'ca', g1: 3.5, fck: 'C30/37', neve: 0 })],
    ['acciaio vuoto con sbalzi dalle travi vicine', base({ n: 3, spans: [5, 6, 5, 5], senza: { '2:1': true }, sbalziVuoto: { '2:1': { a: 2, b: 1.5 } } })],
    ['c.a. vuoto con sbalzi oltre il limite (a + b > L)', base({ mat: 'ca', g1: 3.5, n: 3, spans: [5, 5, 5], senza: { '1:1': true }, sbalziVuoto: { '1:1': { a: 4, b: 3 } } })],
    ['acciaio sbalzi con lunghezze individuali', base({ n: 3, sx: 1.5, dx: 2, sbalziLivello: { '2:sx': 0.8, '3:dx': 3 } })],
    ['legno sbalzo nel vuoto senza trave da prolungare', base({ mat: 'legno', g1: 1.5, g2: 1.5, chi: 0.3, n: 2, spans: [5, 5], senza: { '1:0': true }, sbalziVuoto: { '1:0': { a: 1, b: 2 } } })],
    ['acciaio sbalzo dove manca il pilastro (arretramento)', base({ n: 2, spans: [5, 5], senza: { '2:1': true }, colSenza: { '2:2': true }, sbalziVuoto: { '2:1': { a: 2.5, b: 0 } } })],
    ['c.a. sbalzo dove manca il pilastro, oltre la luce', base({ mat: 'ca', g1: 3.5, n: 3, spans: [5, 5, 5], senza: { '3:2': true }, colSenza: { '3:3': true }, sbalziVuoto: { '3:2': { a: 7, b: 2 } } })],
    ['legno sbalzo da destra dove manca il pilastro di sinistra', base({ mat: 'legno', g1: 1.5, g2: 1.5, chi: 0.3, n: 2, spans: [5, 5], senza: { '2:0': true }, colSenza: { '0:2': true }, sbalziVuoto: { '2:0': { a: 1, b: 2 } } })]
  ];

  // riassunto compatto di un risultato di RT.telaio
  function r6(x) { return typeof x === 'number' ? Math.round(x * 1e4) / 1e4 : x; }
  function nomeTrave(t) { return t.assente ? '--' : (t.prof ? t.prof[0] : t.b + 'x' + t.h) + (t.gov ? '/' + t.gov : ''); }
  function riassunto(r) {
    return {
      travi: r.livelli.map(function (l) { return l.k + ': ' + l.travi.map(nomeTrave).join(' | ') + (l.sbalzi.length ? ' + sb ' + l.sbalzi.map(nomeTrave).join(',') : '') + (l.sbalziInt && l.sbalziInt.length ? ' + int ' + l.sbalziInt.map(nomeTrave).join(',') : ''); }),
      pilastri: r.colonne.map(function (segs, j) {
        return 'P' + (j + 1) + ' ' + segs.map(function (s) {
          return '[' + s.s0 + '-' + s.s1 + ' N=' + r6(s.N) + ' dN=' + r6(s.dN) + ' A=' + r6(s.Atot) + ' L0=' + r6(s.L0) + ' imin=' + r6(s.imin) + ' K=' + s.latoK +
            ' ' + (s.prof ? s.prof[0] : s.lato) + ' ' + s.gov + (s.libera ? ' libera' : '') + ']';
        }).join(' ');
      }),
      alto: r.alto.join(','), avvisi: r.avvisi,
      tot: [r6(r.tot.massaAcciaio), r6(r.tot.volumeCls), r6(r6(r.tot.volumeLegno))]
    };
  }

  // prove delle funzioni di livello 1 e 2 usate nelle lezioni (gli esempi svolti delle slide)
  function funzioni(RT) {
    var sc = RT.sceltaIPEverificato(473.08, 2.5, 25, 5.5, 5.5), sc2 = RT.sceltaIPEverificato(250.2, 2.5, 25, 4, 4);
    return {
      esempio_L3_trave55: [sc.prof[0], r6(sc.delta), r6(sc.lim)],
      esempio_L3_trave4: [sc2.prof[0], r6(sc2.delta)],
      esempio_L3_pilastro: (function () { var h = RT.sceltaHE('HEB', 14.9, 38), a = RT.sceltaHE('HEA', 14.9, 38); return [h[0], a[0]]; })(),
      latoK: [1, 2, 3, 4, 5].map(function (n) { return ['ca', 'acciaio', 'legno'].map(function (m) { return RT.latoK(m, 36 * n); }); }),
      imin: [RT.imin(3.8), RT.imin(6.4)],
      hluce: RT.HLUCE,
      neve: [RT.neveSuolo('III', 20), RT.neveSuolo('II', 600), RT.neveSuolo('I-A', 1000), RT.neveSuolo('I-M', 400), RT.neveSuolo('I-M', 150), RT.mu1(0), RT.mu1(30), RT.mu1(45), RT.mu1(60),
             RT.caricoNeve('III', 20, 15, 'normale').qs, RT.caricoNeve('II', 600, 15, 'riparata').qs].map(r6),
      Imin: [RT.Imin(5, 9.75, 6.5, 6.5), RT.Imin(2.5, 35.75, 5.5, 5.5)].map(r6),
      lezione4: [RT.dmin_emergente(159.6, 300, RT.fcd(25)), RT.bmin_spessore(159.6, 160, RT.fcd(25)), RT.su50(RT.dmin_emergente(159.6, 300, RT.fcd(25)) + 40)],
      stato: (function () {
        var st = RT.telaioStato(base({ n: 3, spans: [5, 5, 5], senza: { '3:2': true }, colSenza: { '3:3': true } }));
        return [st.alto.join(','), st.colonne[3][3].presente, st.colonne[3][3].ripristina, st.colonne[3][2].togli, st.colonne[2][3].togli, st.trave(3, 2), st.disponibile(3, 2)];
      })()
    };
  }

  // CO2 e costi: totali, per m2 di solaio, con e senza solaio (valori predefiniti)
  function impatto(RT, p) {
    var r = RT.telaio(p), a = RT.impatto(r, p, null, false), b = RT.impatto(r, p, null, true);
    return { quantita: [r6(r.tot.casseM2), r6(r.tot.areaSolaio), r6(r.tot.volumeSolaio)], senzaSolaio: [r6(a.co2), r6(a.costo), r6(a.stoccata)], conSolaio: [r6(b.co2), r6(b.costo), r6(b.co2m2), r6(b.costom2)] };
  }
  root.SCENARI = SCENARI; root.riassuntoTelaio = riassunto; root.provaFunzioni = funzioni; root.baseTelaio = base; root.provaImpatto = impatto;
})(typeof window !== 'undefined' ? window : this);
