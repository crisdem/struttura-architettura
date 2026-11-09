/* Modulo Struttura e Architettura - interfaccia della pagina telaio.html.
   Richiede calc.js e telaio-calc.js (libreria RT). Strumento DIDATTICO: non sostituisce la progettazione e le verifiche delle NTC 2018.
   Sezioni: stato e parametri, controlli, travi e pilastri presenti, disegno in prospetto, pianta, tabelle, eventi e preset da URL. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var F = RT.fmt;

  // ---------------------------------------------------------------- stato
  var materiale = 'acciaio';
  var luci = [5, 5, 5, 5, 5];
  var senza = {};                                  // travi tolte: chiavi 'k:i' oppure 'k:sx', 'k:dx'
  var colSenza = {};                               // tratti di pilastro tolti: chiavi 'j:s' (solo dall'alto)
  var vuoti = {};                                  // sbalzi dentro i vuoti: chiavi 'k:i' -> {a, b} [m]
  var lung = {};                                   // lunghezze individuali degli sbalzi di estremita': chiavi 'k:sx' e 'k:dx' -> m
  var sel = null;                                  // elemento scelto per il pannello: 'k:i' (vuoto) oppure 'k:sx' / 'k:dx' (sbalzo di estremita')
  var carPiani = {};                               // carichi dei singoli piani (k < n), con «carichi diversi ai piani»: chiave k -> {g1, g2, q, qb}
  var carTetto = null;                             // carichi della copertura, con «carichi diversi ai piani»: {g1, g2, q (neve)}
  var CHI = { acciaio: 0.5, legno: 0.3, ca: 0.5 };
  var DEF = { acciaio: { g1: 2.5, g2: 2.0, q: 2.0, neve: 0.5 }, legno: { g1: 1.5, g2: 1.5, q: 2.0, neve: 0.5 }, ca: { g1: 3.5, g2: 2.0, q: 2.0, neve: 0.5 } };
  var ROSSO = '#d1382b', BLU = '#1f5c8b', NERO = '#121212', GRIGIO = '#6e6e6e';
  var PAROLA = 'albanesi';                          // la parola segreta nel riquadro "Password": le persone diventano diavoletti

  function leggi(id) { return parseFloat($(id).value); }
  function intero(id) { return parseInt($(id).value, 10); }
  function nomeLivello(k, n) { return k === n ? 'Copertura' : 'Piano ' + k; }

  function parametri() {
    var nc = intero('nc');
    return {
      n: intero('n'), spans: luci.slice(0, nc), H: leggi('H'), B: leggi('B'), bordo: $('bordo').checked,
      g1: leggi('g1'), g2: leggi('g2'), q: leggi('q'), neve: $('usaNeve').checked ? leggi('neve') : 0, qb: leggi('qb'), sx: leggi('sx'), dx: leggi('dx'),
      mat: materiale, acciaio: $('acc').value, serie: $('serie').value, classeLegno: $('cleg').value, bLegno: parseInt($('bleg').value, 10),
      chi: leggi('chi'), fck: $('fck').value, vincolo: $('vinc').value, travaTipo: $('tipoTrave').value, senza: senza, colSenza: colSenza, sbalziVuoto: vuoti, sbalziLivello: lung,
      carichiLiv: carichiLivelli(intero('n'))
    };
  }

  // ---------------------------------------------------------------- carichi diversi ai vari piani
  // Con la casella «Carichi diversi ai piani» ogni livello ha i suoi G1, G2, Q (e Q sugli sbalzi); in copertura Q e' la neve.
  // I cursori generali, quando la casella e' attiva, impostano il valore di tutti i livelli; poi si corregge il singolo piano nella tabella.
  function perLivello() { return !!$('carLiv') && $('carLiv').checked; }
  function valoriGenerali(k, n) {                  // valori correnti dei cursori generali per il livello k
    return k === n ? { g1: leggi('g1'), g2: leggi('g2'), q: leggi('neve'), qb: leggi('neve') }
                   : { g1: leggi('g1'), g2: leggi('g2'), q: leggi('q'), qb: leggi('qb') };
  }
  function completaCarichi(n) {                    // i livelli che non hanno ancora i loro valori partono da quelli generali
    for (var k = 1; k < n; k++) { if (!carPiani[k]) carPiani[k] = valoriGenerali(k, n); }
    if (!carTetto) carTetto = valoriGenerali(n, n);
  }
  function carichiLivelli(n) {                     // oggetto {k: {g1, g2, q, qb}} per RT.telaio, oppure null (carichi uguali)
    if (!perLivello()) return null;
    completaCarichi(n);
    var o = {}, neveOn = $('usaNeve').checked;
    for (var k = 1; k <= n; k++) {
      if (k === n) { var q = neveOn ? carTetto.q : 0; o[k] = { g1: carTetto.g1, g2: carTetto.g2, q: q, qb: q }; }
      else o[k] = { g1: carPiani[k].g1, g2: carPiani[k].g2, q: carPiani[k].q, qb: carPiani[k].qb };
    }
    return o;
  }
  function applicaGenerale(id) {                   // un cursore generale cambia il valore corrispondente di tutti i livelli
    var n = intero('n'), x = leggi(id), k;
    completaCarichi(n);
    if (id === 'neve') { carTetto.q = x; return; }
    if (id === 'g1' || id === 'g2') carTetto[id] = x;
    for (k = 1; k < n; k++) carPiani[k][id] = x;
  }
  function costruisciMatriceCarichi() {
    var box = $('matriceCarichi'), n = intero('n');
    box.hidden = !perLivello();
    if (!perLivello()) { box.innerHTML = ''; return; }
    completaCarichi(n);
    var neveOn = $('usaNeve').checked;
    function cella(k, c, valore, nome, spento) {
      return '<td><input type="number" class="num" step="0.1" min="0" max="10" inputmode="decimal" value="' + valore + '" data-k="' + k + '" data-c="' + c + '"' + (spento ? ' disabled' : '') + ' aria-label="' + nome + '"></td>';
    }
    var h = '<table class="mx mxc"><thead><tr><th></th><th>G₁</th><th>G₂</th><th>Q</th><th title="Q sugli sbalzi (balconi)">Q<sub>sb</sub></th></tr></thead><tbody>';
    for (var k = n; k >= 1; k--) {
      var roof = (k === n), v = roof ? carTetto : carPiani[k], nome = nomeLivello(k, n);
      h += '<tr><th scope="row">' + nome + (roof ? '<br><span class="unita">Q = neve</span>' : '') + '</th>' +
        cella(k, 'g1', v.g1, nome + ', G1', false) + cella(k, 'g2', v.g2, nome + ', G2', false) + cella(k, 'q', v.q, nome + (roof ? ', neve' : ', Q'), roof && !neveOn) +
        (roof ? '<td class="unita">=&nbsp;Q</td>' : cella(k, 'qb', v.qb, nome + ', Q sugli sbalzi', false)) + '</tr>';
    }
    box.innerHTML = h + '</tbody></table>';
  }
  function modificaCarico(ev) {                    // l'utente cambia un valore nella tabella dei carichi per livello
    var el = ev.target, k = parseInt(el.getAttribute('data-k'), 10), c = el.getAttribute('data-c'), x = parseFloat(el.value), n = intero('n');
    if (!c || !(x >= 0)) return;
    completaCarichi(n);
    (k === n ? carTetto : carPiani[k])[c] = x;
    calcola();
  }

  // ---------------------------------------------------------------- controlli
  function impostaMateriale(m, ripristina) {
    materiale = m;
    $('mAcc').setAttribute('aria-pressed', m === 'acciaio');
    $('mLeg').setAttribute('aria-pressed', m === 'legno');
    $('mCa').setAttribute('aria-pressed', m === 'ca');
    $('optAcc').hidden = m !== 'acciaio';
    $('optLeg').hidden = m !== 'legno';
    $('optCa').hidden = m !== 'ca';
    if (ripristina) {
      ['g1', 'g2', 'q', 'neve'].forEach(function (k) { $(k).value = DEF[m][k]; }); $('chi').value = CHI[m];
      if (perLivello()) { ['g1', 'g2', 'q', 'neve'].forEach(applicaGenerale); costruisciMatriceCarichi(); }   // i carichi per livello ripartono dai valori del materiale
    }
    $('chiLab').innerHTML = m === 'ca' ? 'Pilastri: coefficiente ν' : 'Pilastri: coefficiente χ₀';
    $('chiNota').innerHTML = 'A<sub>min</sub> = N<sub>Ed</sub> / (' + (m === 'ca' ? 'ν·f<sub>cd</sub>' : (m === 'legno' ? 'χ₀·f<sub>c,0,d</sub>' : 'χ₀·f<sub>yd</sub>')) + '). Valore degli appunti: ' + F(CHI[m], 2) + '. Più è basso, più il pilastro è abbondante (snellezza, instabilità).';
    calcola();
  }

  function costruisciCampate() {
    var nc = intero('nc'), h = '';
    for (var i = 0; i < nc; i++) {
      h += '<div class="campo"><label for="L' + i + '">Campata ' + (i + 1) + ' <span class="unita">L [m]</span></label><output id="L' + i + 'v">' + F(luci[i], 1) + '</output>' +
        '<input type="range" id="L' + i + '" data-i="' + i + '" min="2" max="10" step="0.1" value="' + luci[i] + '"></div>';
    }
    $('campate').innerHTML = h;
    Array.prototype.forEach.call($('campate').querySelectorAll('input'), function (el) {
      el.addEventListener('input', function () {
        var i = parseInt(el.dataset.i, 10), v = parseFloat(el.value);
        if ($('uguali').checked) { for (var j = 0; j < 5; j++) luci[j] = v; costruisciCampate(); }
        else { luci[i] = v; $('L' + i + 'v').textContent = F(v, 1); }
        calcola();
      });
    });
  }

  // elenco dei livelli per la pianta (si conserva la scelta, se ancora valida)
  function costruisciLivelliPianta(n) {
    var sel = $('livPianta'), corrente = parseInt(sel.value, 10) || 1;
    if (sel.options.length !== n) {
      var h = '';
      for (var k = n; k >= 1; k--) h += '<option value="' + k + '">' + nomeLivello(k, n) + '</option>';
      sel.innerHTML = h;
    }
    sel.value = String(Math.min(Math.max(corrente, 1), n));
  }

  // ---------------------------------------------------------------- travi e pilastri presenti
  // messaggio per chi clicca: nella colonna dei comandi e sotto il disegno
  function msg(t) {
    $('msgMatrice').innerHTML = t || '';
    $('msgFig').innerHTML = t || '';
    $('msgFig').hidden = !t;
  }

  function ripulisciChiavi(n, nc, hasSx, hasDx) {             // toglie le chiavi che non esistono piu'
    Object.keys(senza).forEach(function (key) {
      var pr = key.split(':'), kk = parseInt(pr[0], 10), ii = pr[1];
      var ok = kk >= 1 && kk <= n && ((ii === 'sx' && hasSx) || (ii === 'dx' && hasDx) || (/^\d+$/.test(ii) && parseInt(ii, 10) < nc));
      if (!ok) delete senza[key];
    });
    Object.keys(colSenza).forEach(function (key) {
      var pr = key.split(':'), jj = parseInt(pr[0], 10), ss = parseInt(pr[1], 10);
      if (!(jj >= 0 && jj <= nc && ss >= 1 && ss <= n)) delete colSenza[key];
    });
    Object.keys(lung).forEach(function (key) {
      var pr = key.split(':');
      if (parseInt(pr[0], 10) > n || (pr[1] === 'sx' && !hasSx) || (pr[1] === 'dx' && !hasDx)) delete lung[key];
    });
  }

  function htmlMatriceTravi(st, n, nc, hasSx, hasDx) {
    var h = '<table class="mx"><thead><tr><th></th>', i, k;
    for (i = 0; i < nc; i++) h += '<th>Campata ' + (i + 1) + '</th>';
    if (hasSx) h += '<th>Sbalzo sx</th>';
    if (hasDx) h += '<th>Sbalzo dx</th>';
    h += '</tr></thead><tbody>';
    function cella(k2, i2, lab) {
      var key = k2 + ':' + i2, dis = !st.disponibile(k2, i2), on = st.trave(k2, i2);
      var why = dis ? ((i2 === 'sx' || i2 === 'dx') ? 'senza la trave adiacente (o senza il pilastro) non c\'è lo sbalzo' : 'manca un pilastro a questo livello') : '';
      return '<td><input type="checkbox" data-key="' + key + '" aria-label="' + lab + '"' + (on ? ' checked' : '') + (dis ? ' disabled title="' + why + '"' : '') + '></td>';
    }
    for (k = n; k >= 1; k--) {
      var nome = nomeLivello(k, n);
      h += '<tr><th scope="row">' + nome + '</th>';
      for (i = 0; i < nc; i++) h += cella(k, i, nome + ', campata ' + (i + 1));
      if (hasSx) h += cella(k, 'sx', nome + ', sbalzo sinistro');
      if (hasDx) h += cella(k, 'dx', nome + ', sbalzo destro');
      h += '</tr>';
    }
    return h + '</tbody></table>';
  }

  function htmlMatricePilastri(st, n, nc) {
    var h = '<table class="mx"><thead><tr><th></th>', j, s;
    for (j = 0; j <= nc; j++) h += '<th>Pilastro ' + (j + 1) + '</th>';
    h += '</tr></thead><tbody>';
    for (s = n; s >= 1; s--) {
      h += '<tr><th scope="row">Interpiano ' + s + (s === 1 ? ' (terra)' : '') + '</th>';
      for (j = 0; j <= nc; j++) {
        var e = st.colonne[j][s], dis = !(e.togli || e.ripristina);
        h += '<td><input type="checkbox" data-col="' + j + ':' + s + '" aria-label="Pilastro ' + (j + 1) + ', interpiano ' + s + '"' + (e.presente ? ' checked' : '') + (dis ? ' disabled title="' + e.motivo + '"' : '') + '></td>';
      }
      h += '</tr>';
    }
    return h + '</tbody></table>';
  }

  function collega(contenitore, attributo, azione) {
    Array.prototype.forEach.call($(contenitore).querySelectorAll('input'), function (el) {
      el.addEventListener('change', function () { azione(el.getAttribute(attributo)); });
    });
  }

  function costruisciMatrice() {
    var n = intero('n'), nc = intero('nc'), hasSx = leggi('sx') > 0, hasDx = leggi('dx') > 0;
    ripulisciChiavi(n, nc, hasSx, hasDx);
    var st = RT.telaioStato(parametri());
    $('matrice').innerHTML = htmlMatriceTravi(st, n, nc, hasSx, hasDx);
    collega('matrice', 'data-key', alterna);
    $('matricePil').innerHTML = htmlMatricePilastri(st, n, nc);
    collega('matricePil', 'data-col', alternaCol);
  }

  function alterna(key) {
    var pr = key.split(':'), st = RT.telaioStato(parametri());
    if (!st.disponibile(parseInt(pr[0], 10), /^\d+$/.test(pr[1]) ? parseInt(pr[1], 10) : pr[1])) {
      var aiuto = (/^\d+$/.test(pr[1]) && st.vuoto(parseInt(pr[0], 10), parseInt(pr[1], 10)).vuoto) ? ' La trave vicina può però continuare con uno sbalzo: clicca sulla campata vuota nel disegno.' : '';
      msg('Questa trave non può esserci: manca un pilastro a quel livello, o (per lo sbalzo) manca la trave adiacente.' + aiuto); costruisciMatrice(); return;
    }
    if (senza[key]) delete senza[key]; else senza[key] = true;
    if (!senza[key]) delete vuoti[key];                      // trave rimessa: niente sbalzi nel vuoto
    msg(''); costruisciMatrice(); calcola();
  }

  function alternaCol(key) {
    var pr = key.split(':'), j = parseInt(pr[0], 10), s2 = parseInt(pr[1], 10), st = RT.telaioStato(parametri()), e = st.colonne[j][s2];
    if (e.presente && e.togli) { colSenza[key] = true; msg(''); }
    else if (!e.presente && e.ripristina) { delete colSenza[key]; msg(''); }
    else { msg('Il pilastro ' + (j + 1) + ', interpiano ' + s2 + ', non si può ' + (e.presente ? 'togliere' : 'rimettere') + ': ' + e.motivo + '. Un pilastro si toglie solo dall\'alto e solo con la testa libera (nessuna trave collegata in cima).'); costruisciMatrice(); return; }
    costruisciMatrice(); calcola();
  }

  // ---------------------------------------------------------------- disegno in prospetto
  function etichettaTrave(t) {
    if (materiale === 'acciaio') return t.prof ? t.prof[0] : '> IPE 600';
    return t.b + '×' + t.h;
  }
  function etichettaPil(e) {
    if (materiale === 'acciaio') return e.prof ? e.prof[0] : '> ' + $('serie').value + ' 600';
    return e.lato + '×' + e.lato;
  }

  // misure del disegno: scala (px per metro), ascisse dei pilastri, quota del terreno
  function estensioneSbalzo(p, lato) {              // lunghezza massima dello sbalzo ai vari livelli (per le misure del disegno)
    var m = p[lato] || 0;
    if (m > 0) Object.keys(p.sbalziLivello || {}).forEach(function (key) { if (key.split(':')[1] === lato) m = Math.max(m, p.sbalziLivello[key]); });
    return m;
  }

  // conTerrazza: c'e' spazio sopra la copertura per le persone sugli sbalzi dell'ultimo piano
  function misureDisegno(p, conTerrazza) {
    var nc = p.spans.length, tot = p.spans.reduce(function (a, b) { return a + b; }, 0);
    var sx = estensioneSbalzo(p, 'sx'), dx = estensioneSbalzo(p, 'dx'), totale = tot + sx + dx;
    var W = 900, mx = 70, my = 34;
    var s = Math.min(70, (W - 2 * mx) / totale, 320 / (p.n * p.H));
    var Hh = p.n * p.H * s + 2 * my + 30 + ($('carichi').checked ? 50 : 0) + (conTerrazza ? 1.85 * s : 0);
    var xStart = (W - totale * s) / 2, x0 = xStart + sx * s, yg = Hh - my - 14;
    var xs = [x0]; for (var i = 0; i < nc; i++) xs.push(xs[i] + p.spans[i] * s);
    return { nc: nc, sx: sx, dx: dx, totale: totale, W: W, Hh: Hh, s: s, H: p.H, xStart: xStart, yg: yg, xs: xs };
  }

  function svgTerreno(g) {
    var o = '<line x1="' + (g.xStart - 30) + '" x2="' + (g.xStart + g.totale * g.s + 30) + '" y1="' + g.yg + '" y2="' + g.yg + '" stroke="' + NERO + '" stroke-width="2"/>';
    for (var t = g.xStart - 30; t < g.xStart + g.totale * g.s + 30; t += 10) o += '<line x1="' + t + '" x2="' + (t - 7) + '" y1="' + g.yg + '" y2="' + (g.yg + 8) + '" stroke="' + GRIGIO + '"/>';
    return o;
  }

  // pilastri: un rettangolo per ogni tratto di lunghezza libera, con l'etichetta; sopra, un'area cliccabile per ogni interpiano
  function svgPilastri(g, p, r, st) {
    var o = '';
    r.colonne.forEach(function (segs, j) {
      segs.forEach(function (e) {
        var y1 = g.yg - e.a * p.H * g.s, y2 = g.yg - e.b * p.H * g.s, w = ((e.lato || 600) / 1000) * g.s, x = g.xs[j], ym = (y1 + y2) / 2;
        o += '<rect x="' + (x - w / 2) + '" y="' + y2 + '" width="' + w + '" height="' + (y1 - y2) + '" fill="' + NERO + '"/>';
        o += svgAreeClic(g, p, st, j, e, x);
        var extra = (e.nPiani > 1 || e.libera) ? 'L₀ = ' + F(e.L0, 1) + ' m' : '';
        // etichetta (sempre scura): fuori per i pilastri di estremita', dentro se c'e' lo sbalzo; a destra per quelli interni
        var conSbalzo = (j === 0 && g.sx > 0) || (j === g.nc && g.dx > 0);
        var verso = j === 0 ? (conSbalzo ? 1 : -1) : (j === g.nc ? (conSbalzo ? -1 : 1) : 1);
        var ax = verso > 0 ? x + w / 2 + 4 : x - w / 2 - 4, an = verso > 0 ? 'start' : 'end';
        o += '<text x="' + ax + '" y="' + (ym + 4) + '" font-size="11" text-anchor="' + an + '" fill="' + NERO + '" pointer-events="none">' + etichettaPil(e) + '</text>';
        if (extra) o += '<text x="' + ax + '" y="' + (ym + 17) + '" font-size="10" text-anchor="' + an + '" fill="' + ROSSO + '" font-weight="700" pointer-events="none">' + extra + '</text>';
      });
    });
    return o;
  }

  function toccoMin(g) {                                     // 32 px sullo schermo, espressi in unita' del disegno
    var el = $('fig'), rapporto = (el && el.clientWidth) ? el.clientWidth / g.W : 1;
    return Math.max(14, 32 / Math.max(rapporto, 0.2));
  }

  // un'area cliccabile per ogni interpiano del tratto: si toglie solo l'ultimo, solo con la testa libera; altrimenti il clic spiega perche' no
  function svgAreeClic(g, p, st, j, e, x) {
    var o = '', wc = Math.max(((e.lato || 600) / 1000) * g.s, toccoMin(g));
    for (var s = e.s0; s <= e.s1; s++) {
      var c = st.colonne[j][s], y1 = g.yg - (s - 1) * p.H * g.s, y2 = g.yg - s * p.H * g.s;
      var tit = c.togli ? 'Clicca per togliere il pilastro (ha la testa libera)' : 'Non si può togliere: ' + c.motivo;
      o += '<rect class="tg tcol' + (c.togli ? ' ok' : '') + '" data-col="' + j + ':' + s + '" x="' + (x - wc / 2) + '" y="' + y2 + '" width="' + wc + '" height="' + (y1 - y2) + '" fill="rgba(0,0,0,0)"><title>' + tit + '</title></rect>';
    }
    return o;
  }

  // numero del pilastro in un cerchietto: lo stesso numero della colonna «Pilastro» nelle tabelle e delle matrici dei pilastri
  function cerchioNumero(x, y, num, spento) {
    return '<g pointer-events="none"' + (spento ? ' opacity=".45"' : '') + '><circle cx="' + x + '" cy="' + y + '" r="8" fill="#fff" stroke="' + NERO + '" stroke-width="1.2"/>' +
      '<text x="' + x + '" y="' + (y + 3.8) + '" font-size="11" font-weight="700" text-anchor="middle" fill="' + NERO + '">' + num + '</text></g>';
  }
  function svgNumeriPilastri(g, r) {               // in prospetto: sotto il terreno, in corrispondenza di ogni pilastro
    var o = '';
    for (var j = 0; j <= g.nc; j++) o += cerchioNumero(g.xs[j], g.yg + 13, j + 1, r.alto[j] < 1);
    return o;
  }

  // pilastri tolti: sagoma tratteggiata, cliccabile per rimetterli
  function svgPilastriTolti(g, p, r) {
    var o = '';
    r.alto.forEach(function (al, j) {
      for (var s3 = al + 1; s3 <= p.n; s3++) {
        var wg = Math.max(0.3 * g.s, toccoMin(g)), y1g = g.yg - (s3 - 1) * p.H * g.s, y2g = g.yg - s3 * p.H * g.s;
        o += '<rect class="tg" data-col="' + j + ':' + s3 + '" x="' + (g.xs[j] - wg / 2) + '" y="' + y2g + '" width="' + wg + '" height="' + (y1g - y2g) + '" fill="rgba(18,18,18,.04)" stroke="' + GRIGIO + '" stroke-width="1" stroke-dasharray="4 4"><title>Pilastro tolto: clicca per rimetterlo (si rimette dal basso)</title></rect>';
      }
    });
    return o;
  }

  // persone da entourage di architettura: sagome affusolate con la testa staccata, semi-trasparenti con un filo di contorno.
  // Coordinate in metri, y verso l'alto, origine ai piedi; gli adulti sono alti 1,75 m.
  var SAGOME = {
    uomo:    { c: 'M-.17 1.45 C-.19 1.30 -.16 1.06 -.12 .93 L-.105 0 L-.02 0 L0 .82 L.02 0 L.105 0 L.12 .93 C.16 1.06 .19 1.30 .17 1.45 C.10 1.51 -.10 1.51 -.17 1.45 Z', t: [0, 1.665, .085] },
    donna:   { c: 'M-.15 1.43 C-.17 1.28 -.12 1.07 -.12 .96 C-.16 .82 -.22 .68 -.23 .58 L-.07 .58 L-.075 0 L-.025 0 L-.005 .58 L.005 .58 L.025 0 L.075 0 L.07 .58 L.23 .58 C.22 .68 .16 .82 .12 .96 C.12 1.07 .17 1.28 .15 1.43 C.08 1.48 -.08 1.48 -.15 1.43 Z', t: [0, 1.67, .08] },
    cammina: { c: 'M-.15 1.45 C-.17 1.30 -.15 1.08 -.11 .94 L-.23 0 L-.14 0 L0 .80 L.10 0 L.19 0 L.12 .94 C.16 1.08 .18 1.30 .15 1.45 C.08 1.50 -.08 1.50 -.15 1.45 Z', t: [.03, 1.665, .085] }
  };
  var GRUPPI = [                                    // [sagoma, spostamento x [m], scala]
    [['uomo', 0, 1]],
    [['donna', 0, 1]],
    [['cammina', 0, 1]],
    [['uomo', -.26, 1], ['donna', .26, .94]],
    [['donna', -.22, 1], ['uomo', .2, .6]]
  ];

  // corna e coda (con la punta a freccia) per la variante "diavoletto"; verso = 1 coda a destra, -1 a sinistra
  function cornaCoda(t, verso) {
    var cx = t[0], cy = t[1], k = t[2] / .085, f = function (a, b) { return (cx + a * k) + ' ' + (cy + b * k); };
    var corno = function (v) {
      return '<path vector-effect="non-scaling-stroke" d="M' + f(.07 * v, .05) + ' C' + f(.115 * v, .09) + ' ' + f(.10 * v, .16) + ' ' + f(.065 * v, .20) + ' C' + f(.05 * v, .14) + ' ' + f(.03 * v, .10) + ' ' + f(.02 * v, .075) + ' Z"/>';
    };
    var v = verso;
    return corno(-1) + corno(1)
      + '<path fill="none" vector-effect="non-scaling-stroke" d="M' + (.11 * v) + ' .86 C' + (.34 * v) + ' .80 ' + (.44 * v) + ' 1.00 ' + (.36 * v) + ' 1.12"/>'
      + '<path vector-effect="non-scaling-stroke" d="M' + (.31 * v) + ' 1.10 L' + (.37 * v) + ' 1.21 L' + (.42 * v) + ' 1.08 Z"/>';
  }

  function omino(gruppo, cx, yPiedi, s, diavolo) {
    var col = diavolo ? ROSSO : NERO;
    var o = '<g transform="translate(' + cx + ' ' + yPiedi + ') scale(' + s + ' ' + (-s) + ')" fill="' + col + '" fill-opacity="' + (diavolo ? '.4' : '.26') + '" stroke="' + col + '" stroke-opacity="' + (diavolo ? '.85' : '.55') + '" stroke-width=".9" pointer-events="none"><title>' + (diavolo ? 'Diavoletto alto 1,75 m' : 'Persona alta 1,75 m') + '</title>';
    gruppo.forEach(function (q) {
      var d = SAGOME[q[0]];
      o += '<g transform="translate(' + q[1] + ' 0) scale(' + q[2] + ')"><path vector-effect="non-scaling-stroke" d="' + d.c + '"/><circle vector-effect="non-scaling-stroke" cx="' + d.t[0] + '" cy="' + d.t[1] + '" r="' + d.t[2] + '"/>' + (diavolo ? cornaCoda(d.t, q[1] < 0 ? -1 : 1) : '') + '</g>';
    });
    return o + '</g>';
  }

  function diavoli() { var c = $('parola'); return !!c && c.value.trim().toLowerCase() === PAROLA; }

  // al centro di ogni campata con la trave, a quota del primo solaio presente sotto (o del terreno); il tipo di gruppo dipende solo dalla posizione.
  // Anche sugli sbalzi (di estremita' e nei vuoti): in piedi sul solaio dello sbalzo, se e' lungo almeno 0,6 m.
  function svgOmini(g, p, r) {
    var o = '', dv = diavoli(), hp = function (k, i) { var t = r.livelli[k - 1].travi[i]; return t && !t.assente ? t : null; };
    for (var i = 0; i < g.nc; i++) {
      for (var k = 1; k <= p.n; k++) {
        if (!hp(k, i)) continue;
        var f = k - 1; while (f >= 1 && !hp(f, i)) f--;
        var yPiedi = g.yg - f * p.H * g.s - (f >= 1 ? ((hp(f, i).h || 600) / 1000) * g.s / 2 : 0), cx = (g.xs[i] + g.xs[i + 1]) / 2;
        o += omino(GRUPPI[(i * 2 + k) % GRUPPI.length], cx, yPiedi, g.s, dv);
      }
    }
    r.livelli.forEach(function (lv) {
      var yl = g.yg - lv.k * g.H * g.s, elenco = [];
      lv.sbalzi.forEach(function (t) { if (!t.assente) elenco.push({ t: t, xa: t.lato === 'sx' ? g.xs[0] - t.L * g.s : g.xs[g.nc] }); });
      lv.sbalziInt.forEach(function (t) { elenco.push({ t: t, xa: t.verso === 'a' ? g.xs[t.i] : g.xs[t.i + 1] - t.L * g.s }); });
      elenco.forEach(function (c, q) {
        if (c.t.L < 0.6) return;
        var yp = yl - ((c.t.h || 600) / 1000) * g.s / 2, gruppo = c.t.L >= 1.6 ? GRUPPI[3 + (lv.k % 2)] : GRUPPI[(lv.k + q) % 3];
        o += omino(gruppo, c.xa + c.t.L * g.s / 2, yp, g.s, dv);
      });
    });
    return o;
  }

  function haTerrazza(r) {                           // sbalzi presenti in copertura: servono spazio sopra e un po' di aria per le persone
    var lv = r.livelli[r.livelli.length - 1];
    return lv.sbalzi.some(function (t) { return !t.assente && t.L >= 0.6; }) || lv.sbalziInt.some(function (t) { return t.L >= 0.6; });
  }

  function svgTravi(g, r, st) {
    var o = '';
    r.livelli.forEach(function (lv) {
      var yl = g.yg - lv.k * g.H * g.s;
      lv.travi.forEach(function (t, i) {
        var key = lv.k + ':' + i;
        if (t.assente) {
          var sv = st.vuoto(lv.k, i);
          if (t.perPilastro && !sv.vuoto) return;      // manca un pilastro e nessuna trave vicina da prolungare: niente da cliccare
          var h0 = 0.35 * g.s, xa0 = g.xs[i] + sv.a * g.s, xb0 = g.xs[i + 1] - sv.b * g.s, scelto = (sel === key);
          if (r.alto[i] < lv.k) xa0 = Math.max(xa0, g.xs[i] + 0.2 * g.s);              // non copre il pilastro tolto, che si clicca per rimetterlo
          if (r.alto[i + 1] < lv.k) xb0 = Math.min(xb0, g.xs[i + 1] - 0.2 * g.s);
          if (xb0 - xa0 > 4) {                         // il vuoto che resta fra gli eventuali sbalzi: si clicca per metterli (e, se la trave puo' esserci, per rimetterla)
            o += '<rect class="tg" data-vuoto="' + key + '" x="' + (xa0 + 1) + '" y="' + (yl - h0 / 2) + '" width="' + (xb0 - xa0 - 2) + '" height="' + h0 + '" fill="rgba(209,56,43,' + (scelto ? '.16' : '.07') + ')" stroke="' + ROSSO + '" stroke-width="' + (scelto ? 2.2 : 1.2) + '" stroke-dasharray="5 4"><title>' + (t.perPilastro ? 'Clicca per mettere uno sbalzo dalla trave vicina (manca un pilastro: la trave non può esserci)' : 'Clicca per mettere sbalzi nel vuoto o rimettere la trave') + '</title></rect>';
            if (xb0 - xa0 > 44) o += '<text x="' + ((xa0 + xb0) / 2) + '" y="' + (yl + 4) + '" font-size="11" text-anchor="middle" fill="' + ROSSO + '" pointer-events="none">vuoto</text>';
          }
          return;
        }
        var hh = ((t.h || 600) / 1000) * g.s;
        o += '<rect class="tg" data-key="' + key + '" x="' + g.xs[i] + '" y="' + (yl - hh / 2) + '" width="' + (g.xs[i + 1] - g.xs[i]) + '" height="' + hh + '" fill="' + ROSSO + '"><title>Clicca per togliere la trave</title></rect>';
        if (hh < toccoMin(g)) o += '<rect class="tg" data-key="' + key + '" x="' + g.xs[i] + '" y="' + (yl - toccoMin(g) / 2) + '" width="' + (g.xs[i + 1] - g.xs[i]) + '" height="' + toccoMin(g) + '" fill="rgba(0,0,0,0)"></rect>';
        o += '<text x="' + ((g.xs[i] + g.xs[i + 1]) / 2) + '" y="' + (yl - hh / 2 - 5) + '" font-size="11" text-anchor="middle" fill="' + NERO + '" font-weight="700" pointer-events="none">' + etichettaTrave(t) + '</text>';
      });
      lv.sbalzi.forEach(function (t) {
        var key = lv.k + ':' + t.lato, L = t.L * g.s, xa = t.lato === 'sx' ? g.xs[0] - L : g.xs[g.nc];
        if (t.assente) {
          if (t.perPilastro) return;
          var h1 = 0.3 * g.s;
          o += '<rect class="tg" data-key="' + key + '" x="' + xa + '" y="' + (yl - h1 / 2) + '" width="' + L + '" height="' + h1 + '" fill="rgba(31,92,139,.07)" stroke="' + BLU + '" stroke-width="1.2" stroke-dasharray="5 4"><title>Clicca per rimettere lo sbalzo</title></rect>';
          return;
        }
        o += rettangoloSbalzo(g, t, xa, yl, key, 'data-sbalzo', 'Clicca per cambiare la lunghezza dello sbalzo o per toglierlo');
      });
      lv.sbalziInt.forEach(function (t) {              // sbalzi dentro i vuoti: prolungano le travi vicine
        var L = t.L * g.s, xa = t.verso === 'a' ? g.xs[t.i] : g.xs[t.i + 1] - L;
        o += rettangoloSbalzo(g, t, xa, yl, lv.k + ':' + t.i, 'data-vuoto', st.vuoto(lv.k, t.i).perPilastro ? 'Clicca per modificare lo sbalzo' : 'Clicca per cambiare gli sbalzi nel vuoto o per rimettere la trave');
      });
    });
    return o;
  }

  function rettangoloSbalzo(g, t, xa, yl, key, attributo, titolo) {
    var L = t.L * g.s, hh = ((t.h || 600) / 1000) * g.s, scelto = (sel === key);
    return '<rect class="tg" ' + attributo + '="' + key + '" x="' + xa + '" y="' + (yl - hh / 2) + '" width="' + L + '" height="' + hh + '" fill="' + BLU + '"' + (scelto ? ' stroke="' + NERO + '" stroke-width="2"' : '') + '><title>' + titolo + '</title></rect>' +
      '<text x="' + (xa + L / 2) + '" y="' + (yl - hh / 2 - 5) + '" font-size="10" text-anchor="middle" fill="' + BLU + '" font-weight="700" pointer-events="none">' + etichettaTrave(t) + '</text>';
  }

  function svgQuote(g, p) {
    var o = '', i;
    for (i = 0; i < g.nc; i++) {
      o += '<line x1="' + g.xs[i] + '" x2="' + g.xs[i + 1] + '" y1="' + (g.yg + 22) + '" y2="' + (g.yg + 22) + '" stroke="' + GRIGIO + '"/>';
      o += '<text x="' + ((g.xs[i] + g.xs[i + 1]) / 2) + '" y="' + (g.yg + 36) + '" font-size="11" text-anchor="middle" fill="' + GRIGIO + '">' + F(p.spans[i], 1) + ' m</text>';
    }
    function etichettaSbalzo(lato) {                 // valore comune; se qualche livello ha una lunghezza diversa lo si dice
      var diverso = Object.keys(p.sbalziLivello || {}).some(function (key) { return key.split(':')[1] === lato; });
      return 'sbalzo ' + F(p[lato], 1) + ' m' + (diverso ? ' (comune)' : '');
    }
    if (g.sx > 0) o += '<text x="' + (g.xs[0] - g.sx * g.s / 2) + '" y="' + (g.yg + 36) + '" font-size="11" text-anchor="middle" fill="' + BLU + '">' + etichettaSbalzo('sx') + '</text>';
    if (g.dx > 0) o += '<text x="' + (g.xs[g.nc] + g.dx * g.s / 2) + '" y="' + (g.yg + 36) + '" font-size="11" text-anchor="middle" fill="' + BLU + '">' + etichettaSbalzo('dx') + '</text>';
    return o;
  }

  function svgCarichi(g, p, r) {
    var o = '', dh = p.H * g.s, ah = Math.min(26, dh * 0.42);
    function carico(yl, xa, xb, hh, pd) {
      var yTop = yl - hh / 2 - 17, y0 = yTop - ah, w = xb - xa, nA = Math.max(3, Math.round(w / 24));
      o += '<line x1="' + xa + '" x2="' + xb + '" y1="' + y0 + '" y2="' + y0 + '" stroke="' + BLU + '" stroke-width="1.6"/>';
      for (var q = 0; q <= nA; q++) {
        var xq = xa + w * q / nA;
        o += '<line x1="' + xq + '" x2="' + xq + '" y1="' + y0 + '" y2="' + yTop + '" stroke="' + BLU + '" stroke-width="1.2"/><path d="M' + (xq - 3) + ',' + (yTop - 5) + ' L' + xq + ',' + yTop + ' L' + (xq + 3) + ',' + (yTop - 5) + '" fill="none" stroke="' + BLU + '" stroke-width="1.2"/>';
      }
      o += '<text x="' + ((xa + xb) / 2) + '" y="' + (y0 - 4) + '" font-size="10" text-anchor="middle" fill="' + BLU + '" font-weight="700">p<tspan font-size="8" dy="2">d</tspan><tspan dy="-2"> = ' + F(pd, 1) + ' kN/m</tspan></text>';
    }
    r.livelli.forEach(function (lv) {
      var yl = g.yg - lv.k * p.H * g.s;
      lv.travi.forEach(function (t, i) { if (t.assente) return; carico(yl, g.xs[i] + 2, g.xs[i + 1] - 2, ((t.h || 600) / 1000) * g.s, t.pd); });
      lv.sbalzi.forEach(function (t) {
        if (t.assente) return;
        var hh = ((t.h || 600) / 1000) * g.s, L = t.L * g.s, xa = t.lato === 'sx' ? g.xs[0] - L : g.xs[g.nc];
        carico(yl, xa + 2, xa + L - 2, hh, t.pd);
      });
      lv.sbalziInt.forEach(function (t) {
        var hh = ((t.h || 600) / 1000) * g.s, L = t.L * g.s, xa = t.verso === 'a' ? g.xs[t.i] : g.xs[t.i + 1] - L;
        carico(yl, xa + 2, xa + L - 2, hh, t.pd);
      });
    });
    r.colonne.forEach(function (segs, j) {
      segs.forEach(function (e) {
        var w = ((e.lato || 600) / 1000) * g.s, yb = g.yg - e.a * p.H * g.s;
        o += '<text x="' + (g.xs[j] + w / 2 + 4) + '" y="' + (yb - 5) + '" font-size="10" fill="' + BLU + '" font-weight="700" pointer-events="none">N = ' + F(e.N, 0) + ' kN</text>';
      });
    });
    return o;
  }

  function disegna(p, r) {
    $('msgParola').hidden = !diavoli();
    var g = misureDisegno(p, $('omini').checked && haTerrazza(r)), st = RT.telaioStato(p);
    var svg = $('fig'); svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.Hh);
    var o = svgTerreno(g) + svgPilastri(g, p, r, st) + svgPilastriTolti(g, p, r);
    if ($('omini').checked) o += svgOmini(g, p, r);
    o += svgTravi(g, r, st) + svgQuote(g, p) + svgNumeriPilastri(g, r);
    if ($('carichi').checked) o += svgCarichi(g, p, r);
    svg.innerHTML = o;
  }

  // ---------------------------------------------------------------- pianta: luce fuori piano B e area d'influenza delle travi
  // Un solo telaio piano: la striscia di solaio che scarica sulle sue travi e' larga B (B/2 per parte), o B/2 se il telaio e' di bordo.
  function disegnaPianta(p, r) {
    var n = p.n, k = Math.min(Math.max(parseInt($('livPianta').value, 10) || 1, 1), n), lv = r.livelli[k - 1];
    var g = misureDisegno(p), st = RT.telaioStato(p), nc = g.nc, sx = g.sx, dx = g.dx, totale = g.totale;          // stessa scala e stesse ascisse del prospetto: i due disegni restano allineati
    var Bi = r.Binf, W = g.W, top = 52, bot = 56, s = g.s, xStart = g.xStart, xs = g.xs, i, o = '';
    var Hh = top + Bi * s + bot;
    var y0 = top, yAsse = p.bordo ? y0 : y0 + Bi * s / 2, y1 = y0 + Bi * s;     // striscia d'influenza da y0 a y1; asse del telaio in yAsse
    var svg = $('pianta'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh);
    o += '<defs><pattern id="trattVuoto" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="' + GRIGIO + '" stroke-width="1" stroke-opacity=".5"/></pattern></defs>';
    function striscia(xa, xb, presente, sbalzo) {
      if (presente) return '<rect x="' + xa + '" y="' + y0 + '" width="' + (xb - xa) + '" height="' + (y1 - y0) + '" fill="' + BLU + '" fill-opacity="' + (sbalzo ? '.10' : '.14') + '"/>';
      return '<rect x="' + xa + '" y="' + y0 + '" width="' + (xb - xa) + '" height="' + (y1 - y0) + '" fill="url(#trattVuoto)" stroke="' + GRIGIO + '" stroke-dasharray="4 4"/>';
    }
    function stricciaSbalzo(xa, xb, Lm) {             // striscia d'influenza di uno sbalzo, con la sua area
      var o2 = striscia(xa, xb, true, true), w = xb - xa;
      if (w > 28) o2 += '<text x="' + ((xa + xb) / 2) + '" y="' + (y1 - 8) + '" font-size="10" text-anchor="middle" fill="' + BLU + '" font-weight="700">A = ' + F(Lm * Bi, 1) + ' m²</text>';
      return o2;
    }
    // campate: striscia d'influenza, frecce del solaio verso la trave, area; nei vuoti, solo gli sbalzi hanno la striscia
    for (i = 0; i < nc; i++) {
      var t = lv.travi[i], on = !t.assente, xa = xs[i], xb = xs[i + 1], xm = (xa + xb) / 2;
      var sv = !on ? st.vuoto(k, i) : { a: 0, b: 0 }, xa1 = xa + sv.a * s, xb1 = xb - sv.b * s;
      if (on) o += striscia(xa, xb, true, false);
      else if (xb1 - xa1 > 0.5) o += striscia(xa1, xb1, false, false);
      if (on) {
        [0.25, 0.75].forEach(function (f) {
          var xf = xa + (xb - xa) * f;
          if (yAsse - y0 > 14) o += freccia(xf, y0 + 6, xf, yAsse - 8);
          if (y1 - yAsse > 14) o += freccia(xf, y1 - 6, xf, yAsse + 8);
        });
        o += '<text x="' + xm + '" y="' + (y1 - 8) + '" font-size="11" text-anchor="middle" fill="' + BLU + '" font-weight="700">A = ' + F(p.spans[i], 1) + ' × ' + F(Bi, 2) + ' = ' + F(p.spans[i] * Bi, 1) + ' m²</text>';
      } else {
        if (sv.a > 0) o += stricciaSbalzo(xa, xa1, sv.a);
        if (sv.b > 0) o += stricciaSbalzo(xb1, xb, sv.b);
        if (xb1 - xa1 > 110) o += '<text x="' + ((xa1 + xb1) / 2) + '" y="' + ((y0 + y1) / 2 + 4) + '" font-size="11" text-anchor="middle" fill="' + GRIGIO + '">' + (t.perPilastro ? 'trave impossibile' : 'vuoto: niente solaio') + '</text>';
      }
    }
    // sbalzi di estremita': ciascuno con la propria lunghezza
    lv.sbalzi.forEach(function (tb) {
      var L = tb.L * s, xa = tb.lato === 'sx' ? xs[0] - L : xs[nc];
      o += tb.assente ? striscia(xa, xa + L, false, true) : stricciaSbalzo(xa, xa + L, tb.L);
    });
    // limiti della striscia: a meta' tra questo telaio e il successivo (non disegnato)
    o += '<line x1="' + (xStart - 14) + '" x2="' + (xStart + totale * s + 14) + '" y1="' + y1 + '" y2="' + y1 + '" stroke="' + BLU + '" stroke-dasharray="6 4"/>';
    if (!p.bordo) o += '<line x1="' + (xStart - 14) + '" x2="' + (xStart + totale * s + 14) + '" y1="' + y0 + '" y2="' + y0 + '" stroke="' + BLU + '" stroke-dasharray="6 4"/>';
    // travi del telaio (asse) e pilastri
    function larghezzaTrave(t) { return Math.max(((t.b || (t.h || 400) / 2) / 1000) * s, 4); }
    for (i = 0; i < nc; i++) {
      var tt = lv.travi[i];
      if (tt.assente) {
        var sv2 = st.vuoto(k, i);
        o += '<line x1="' + (xs[i] + sv2.a * s) + '" x2="' + (xs[i + 1] - sv2.b * s) + '" y1="' + yAsse + '" y2="' + yAsse + '" stroke="' + ROSSO + '" stroke-dasharray="5 4" stroke-opacity=".7"/>';
        continue;
      }
      var wt = larghezzaTrave(tt);
      o += '<rect x="' + xs[i] + '" y="' + (yAsse - wt / 2) + '" width="' + (xs[i + 1] - xs[i]) + '" height="' + wt + '" fill="' + ROSSO + '"/>';
    }
    lv.sbalzi.forEach(function (tb) {
      if (tb.assente) return;
      var L = tb.L * s, xa = tb.lato === 'sx' ? xs[0] - L : xs[nc], wt = larghezzaTrave(tb);
      o += '<rect x="' + xa + '" y="' + (yAsse - wt / 2) + '" width="' + L + '" height="' + wt + '" fill="' + BLU + '"/>';
    });
    lv.sbalziInt.forEach(function (tb) {              // sbalzi dentro i vuoti
      var L = tb.L * s, xa = tb.verso === 'a' ? xs[tb.i] : xs[tb.i + 1] - L, wt = larghezzaTrave(tb);
      o += '<rect x="' + xa + '" y="' + (yAsse - wt / 2) + '" width="' + L + '" height="' + wt + '" fill="' + BLU + '"/>';
    });
    for (var j = 0; j <= nc; j++) {
      if (r.alto[j] < k) continue;                                              // il pilastro non arriva a questo livello
      var e = r.interpiani[k - 1].pilastri[j];
      if (!e) continue;
      var a = Math.max(((e.larg || e.lato || 300) / 1000) * s, 6), b2 = Math.max(((e.lato || 300) / 1000) * s, 6);
      o += '<rect x="' + (xs[j] - b2 / 2) + '" y="' + (yAsse - a / 2) + '" width="' + b2 + '" height="' + a + '" fill="' + NERO + '"/>';
      o += cerchioNumero(xs[j], yAsse + a / 2 + 11, j + 1, false);          // numero del pilastro, come nelle tabelle
    }
    // quote: B a sinistra (breve, per non uscire dal disegno), spiegazione in alto, luci delle campate in basso
    o += quotaV(xStart - 14, y0, y1, p.bordo ? 'B/2' : 'B');
    for (i = 0; i < nc; i++) {
      o += '<line x1="' + xs[i] + '" x2="' + xs[i + 1] + '" y1="' + (y1 + 18) + '" y2="' + (y1 + 18) + '" stroke="' + GRIGIO + '"/>';
      o += '<text x="' + ((xs[i] + xs[i + 1]) / 2) + '" y="' + (y1 + 32) + '" font-size="11" text-anchor="middle" fill="' + GRIGIO + '">L = ' + F(p.spans[i], 1) + ' m</text>';
    }
    o += '<text x="' + xStart + '" y="18" font-size="12" font-weight="700" fill="' + NERO + '">Pianta: ' + nomeLivello(k, n).toLowerCase() + '</text>';
    o += '<text x="' + xStart + '" y="37" font-size="11" fill="' + NERO + '"><tspan font-weight="700">' + (p.bordo ? 'B/2 = ' + F(Bi, 2) : 'B = ' + F(p.B, 2)) + ' m</tspan><tspan fill="' + GRIGIO + '"> ' + (p.bordo ? 'metà luce fuori piano (telaio di bordo)' : 'luce fuori piano (telaio al centro)') + '</tspan></text>';
    svg.innerHTML = o;
    $('notaPianta').innerHTML = 'Telaio con le travi in rosso (sbalzi in blu); in blu chiaro l\'<b>area d\'influenza</b> delle travi, una striscia larga ' +
      (p.bordo ? '<b>B/2 = ' + F(Bi, 2) + ' m</b> (telaio di bordo)' : '<b>B = ' + F(p.B, 2) + ' m</b> (B/2 per parte)') + '. Le frecce mostrano il solaio che scarica sulle travi. Il carico lineare è p<sub>d</sub> = q<sub>d</sub>·' + F(Bi, 2) + ' m. I limiti della striscia sono a metà strada dal telaio successivo, non disegnato.';
  }

  function freccia(xa, ya, xb, yb) {
    var dy = yb > ya ? 1 : -1;
    return '<line x1="' + xa + '" y1="' + ya + '" x2="' + xb + '" y2="' + yb + '" stroke="' + BLU + '" stroke-width="1.2"/><path d="M' + (xb - 3) + ',' + (yb - 5 * dy) + ' L' + xb + ',' + yb + ' L' + (xb + 3) + ',' + (yb - 5 * dy) + '" fill="none" stroke="' + BLU + '" stroke-width="1.2"/>';
  }
  function quotaV(x, ya, yb, testo) {
    return '<line x1="' + x + '" x2="' + x + '" y1="' + ya + '" y2="' + yb + '" stroke="' + NERO + '"/><line x1="' + (x - 5) + '" x2="' + (x + 5) + '" y1="' + ya + '" y2="' + ya + '" stroke="' + NERO + '"/><line x1="' + (x - 5) + '" x2="' + (x + 5) + '" y1="' + yb + '" y2="' + yb + '" stroke="' + NERO + '"/>' +
      '<text x="' + (x - 8) + '" y="' + ((ya + yb) / 2 + 4) + '" font-size="12" font-weight="700" text-anchor="end" fill="' + NERO + '">' + testo + '</text>';
  }

  // ---------------------------------------------------------------- tabelle
  function intestazioneTravi(p) {
    var ac = materiale === 'acciaio', ca = materiale === 'ca';
    return '<thead><tr><th>Livello</th><th>Elemento</th><th>L [m]</th><th>p<sub>d</sub> [kN/m]</th><th>M<sub>Ed</sub> [kN·m]</th>' +
      (ca ? '<th>Livello 1: ' + (p.travaTipo === 'spessore' ? 'b ≈ L/6' : 'h = L/10') + ' [mm]</th><th>Livello 2: d<sub>min</sub> / b<sub>min</sub> [mm]</th><th>Sezione b×h [mm]</th><th>L/h</th>'
          : (ac ? '<th>Livello 1: h = L/' + RT.HLUCE[p.vincolo] + ' [mm]</th><th>Livello 2: W<sub>min</sub> [cm³]</th><th>I<sub>min</sub> [cm⁴]</th><th>Profilo (livello 2)</th><th>L/h</th>'
                : '<th>Livello 1: h = L/20–L/15 [mm]</th><th>Livello 2: W<sub>min</sub> [cm³]</th><th>I<sub>min</sub> [cm⁴]</th><th>Sezione b×h [mm]</th><th>L/h</th>')) + '</tr></thead><tbody>';
  }

  // le tre righe di trave (c.a., acciaio, legno) restituiscono le celle specifiche del materiale; le avvertenze vanno in avv
  function celleTraveCa(p, t, Leq, liv, nome, avv) {
    var spess = p.travaTipo === 'spessore', dm = spess ? 'b<sub>min</sub> = ' + F(t.bmin, 0) : 'd<sub>min</sub> = ' + F(t.d, 0);
    if (spess && t.b > Leq * 1000 / 6 * 1.5) avv.push(liv + ', ' + nome.toLowerCase() + ': la trave a spessore risulta molto larga (b = ' + t.b + ' mm). Valuta una trave emergente.');
    return '<td>' + F(spess ? Leq * 1000 / 6 : t.hGeo, 0) + (spess ? ' (b)' : '') + '</td><td>' + dm + '</td><td><b>' + t.b + '×' + t.h + '</b></td><td>' + F(Leq * 1000 / t.h, 1) + '</td>';
  }
  function celleTraveAcciaio(t, Leq, liv, nome, avv) {
    var r_ = '<td>' + F(t.hGeo, 0) + '</td><td>' + F(t.W, 0) + '</td><td>' + F(t.Imin, 0) + '</td>';
    if (t.prof) return r_ + '<td><b>' + t.prof[0] + '</b> <span class="unita">I<sub>y</sub> = ' + F(t.I, 0) + ' cm⁴</span>' + (t.gov === 'deformabilità' ? ' <span class="unita">(decide I<sub>min</sub>: per W basterebbe ' + t.profW[0] + ')</span>' : '') + '</td><td>' + F(Leq * 1000 / t.h, 1) + '</td>';
    avv.push(liv + ', ' + nome.toLowerCase() + ': nessun IPE soddisfa W e I min. Riduci la luce o la luce fuori piano, o cambia schema.');
    return r_ + '<td class="ko">oltre IPE 600</td><td>-</td>';
  }
  function celleTraveLegno(t, Leq, liv, nome, avv) {
    if (t.h > 1000) avv.push(liv + ', ' + nome.toLowerCase() + ': altezza di ' + t.h + ' mm: valuta una base maggiore, una classe migliore o una luce minore.');
    return '<td>' + F(t.hMin, 0) + '–' + F(t.hMax, 0) + '</td><td>' + F(t.W, 0) + '</td><td>' + F(t.Imin, 0) + '</td><td><b>' + t.b + '×' + t.h + '</b> <span class="unita">I = ' + F(t.I, 0) + ' cm⁴</span>' + (t.gov === 'deformabilità' ? ' <span class="unita">(decide I<sub>min</sub>)</span>' : '') + '</td><td>' + F(Leq * 1000 / t.h, 1) + '</td>';
  }

  function tabellaTravi(p, r, avv) {
    var ncol = materiale === 'ca' ? 9 : 10, h = intestazioneTravi(p);
    function riga(lv, t, nome) {
      var liv = nomeLivello(lv.k, p.n);
      if (t.assente) return '<tr class="vuoto"><td>' + liv + '</td><td>' + nome + '</td><td>' + F(t.L, 1) + '</td><td colspan="' + (ncol - 3) + '">trave tolta (vuoto)</td></tr>';
      var Leq = t.lato ? 2 * t.L : t.L;
      var comuni = '<tr><td>' + liv + '</td><td>' + nome + '</td><td>' + F(t.L, 1) + '</td><td>' + F(t.pd, 1) + '</td><td>' + F(t.M, 1) + '</td>';
      var specifiche = materiale === 'ca' ? celleTraveCa(p, t, Leq, liv, nome, avv) : (materiale === 'acciaio' ? celleTraveAcciaio(t, Leq, liv, nome, avv) : celleTraveLegno(t, Leq, liv, nome, avv));
      return comuni + specifiche + '</tr>';
    }
    r.livelli.slice().reverse().forEach(function (lv) {
      lv.travi.forEach(function (t, i) { h += riga(lv, t, 'Campata ' + (i + 1)); });
      lv.sbalzi.forEach(function (t) { h += riga(lv, t, 'Sbalzo ' + (t.lato === 'sx' ? 'sx' : 'dx')); });
      lv.sbalziInt.forEach(function (t) { h += riga(lv, t, 'Sbalzo nel vuoto, campata ' + (t.i + 1) + ' (da ' + (t.verso === 'a' ? 'sx' : 'dx') + ')'); });
    });
    return h + '</tbody>';
  }

  var NOME_POS = { interno: 'interno ×1', bordo: 'di bordo ×0,7', angolo: 'd\'angolo ×0,5' };
  // Livello 1: lato ≈ κ·L_max·pos·√n (nessuna regola di snellezza). Livello 2: A_min, poi la stabilita' (acciaio: i_min; c.a. e legno: lato ≥ L₀/15).
  function tabellaPilastri(r, avv) {
    var ac = materiale === 'acciaio';
    var h = '<thead><tr><th>Interpiani</th><th>Pilastro</th><th>Posizione (pos)</th><th>L<sub>max</sub> [m]</th><th>n</th><th>Livello 1: lato ≈ κ·L<sub>max</sub>·pos·√n [mm]</th>' +
      '<th>ΣA [m²]</th><th>N<sub>Ed</sub> alla base [kN]</th><th>L₀ [m]</th><th>Livello 2: A<sub>min</sub> [cm²]</th><th>' + (ac ? 'i<sub>min</sub> = L₀/100 [mm]' : 'lato ≥ L₀/15 [mm]') + '</th><th>' + (ac ? 'Profilo' : 'Sezione [mm]') + ' (livello 2)</th><th>Decide</th></tr></thead><tbody>';
    var righe = [];
    r.colonne.forEach(function (segs) { segs.forEach(function (sg) { righe.push(sg); }); });
    righe.sort(function (a, b) { return (b.s1 - a.s1) || (b.s0 - a.s0) || (a.j - b.j); });
    righe.forEach(function (e) {
      var ip = e.s0 === e.s1 ? e.s0 + (e.s0 === 1 ? ' (terra)' : '') : e.s0 + '–' + e.s1 + ' (doppia altezza)';
      if (e.libera) ip += ', testa libera';
      var l1 = F(e.latoKgrezzo, 0) + ' → <b>' + F(e.latoK, 0) + '</b>';
      h += '<tr><td>' + ip + '</td><td><b>' + (e.j + 1) + '</b></td><td>' + NOME_POS[e.posNome] + '</td><td>' + F(e.Lmax, 1) + '</td><td>' + e.nSopra + '</td><td>' + l1 + '</td>' +
        '<td>' + F(e.Atot, 1) + '</td><td>' + F(e.N, 0) + (e.dN > 0 ? ' <span class="unita">(di cui sbalzo ' + F(e.dN, 0) + ')</span>' : '') + '</td><td>' + F(e.L0, 1) + '</td><td>' + F(ac ? e.A : e.A / 100, ac ? 1 : 0) + '</td>' +
        '<td>' + (ac ? F(e.imin, 0) : F(e.L0 * 1000 / RT.LATO_L0, 0)) + '</td>';
      if (ac) {
        h += e.prof ? '<td><b>' + e.prof[0] + '</b></td>' : '<td class="ko">oltre ' + r.serie + ' 600</td>';
        if (!e.prof) avv.push('Interpiano ' + e.s0 + ', pilastro ' + (e.j + 1) + ': nessun ' + r.serie + ' soddisfa A min e i min.');
      } else h += '<td><b>' + e.lato + '×' + e.lato + '</b></td>';
      h += '<td>' + (e.N <= 0 ? '-' : e.gov) + '</td></tr>';
    });
    return h + '</tbody>';
  }

  function indicatori(p, r) {
    var ac = materiale === 'acciaio', lg = materiale === 'legno', ca = materiale === 'ca', nTolte = Object.keys(p.senza).length, k = '';
    if (ac) k += '<div><b>' + F(r.tot.massaAcciaio, 0) + ' kg</b><span>acciaio nel telaio</span></div>';
    else if (lg) k += '<div><b>' + F(r.tot.volumeLegno, 2) + ' m³</b><span>legno di travi e pilastri</span></div>';
    else k += '<div><b>' + F(r.tot.volumeCls, 1) + ' m³</b><span>calcestruzzo di travi e pilastri</span></div>';
    k += '<div><b>' + F(r.Binf, 2) + ' m</b><span>larghezza d\'influenza</span></div>';
    if (ca) k += '<div><b>' + F(r.hs, 0) + ' mm</b><span>spessore solaio (B/25)</span></div>';
    var fval = ac ? r.fyd : (lg ? r.fmd : r.fcd), flab = ac ? 'f<sub>yd</sub>' : (lg ? 'f<sub>m,d</sub>' : 'f<sub>cd</sub>');
    k += '<div><b>' + F(fval, 1) + ' MPa</b><span>' + flab + '</span></div>';
    if (nTolte) k += '<div><b>' + nTolte + '</b><span>travi tolte</span></div>';
    return k;
  }

  function mostraAvvisi(avv) {
    var av = $('avvisi');
    if (avv.length) { av.hidden = false; av.innerHTML = '<b>Attenzione</b><ul style="margin:.3rem 0 0 1rem;padding:0">' + avv.slice(0, 8).map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul>'; }
    else av.hidden = true;
  }

  function tabelle(p, r) {
    var avv = r.avvisi.slice();
    $('tTravi').innerHTML = tabellaTravi(p, r, avv);
    $('tPil').innerHTML = tabellaPilastri(r, avv);
    $('kpi').innerHTML = indicatori(p, r);
    mostraAvvisi(avv);
  }

  // ---------------------------------------------------------------- CO2 e costi (stima)
  var IPOTESI = [                                  // [id del campo, gruppo, chiave] dei valori unitari modificabili
    ['iCo2Acc', 'co2', 'acciaio'], ['iCo2Arm', 'co2', 'armatura'], ['iCo2Cls', 'co2', 'cls'], ['iCo2Leg', 'co2', 'legno'],
    ['iCoAcc', 'costo', 'acciaio'], ['iCoArm', 'costo', 'armatura'], ['iCoCls', 'costo', 'cls'], ['iCoCas', 'costo', 'casseforme'], ['iCoLeg', 'costo', 'legno'],
    ['iArmTP', 'armatura', 'telaio'], ['iArmSol', 'armatura', 'solaio']
  ];
  var NOMI_MAT = { acciaio: 'Acciaio', legno: 'Legno', ca: 'C.a.' };

  function impostaIpotesi() {
    IPOTESI.forEach(function (x) { $(x[0]).value = RT.IMPATTO_DEF[x[1]][x[2]]; });
  }
  function leggiIpotesi() {
    var ip = { co2: {}, costo: {}, armatura: {} };
    IPOTESI.forEach(function (x) { ip[x[1]][x[2]] = parseFloat($(x[0]).value); });
    return ip;
  }

  function tabellaImpatto(im) {
    var h = '<thead><tr><th>Voce</th><th>Quantità</th><th>CO₂e [kg]</th><th>Costo [€]</th></tr></thead><tbody>';
    im.voci.forEach(function (v) {
      h += '<tr><td>' + v.nome + '</td><td>' + F(v.qta, v.unita === 'kg' ? 0 : 1) + ' ' + v.unita + '</td><td>' + (v.co2 > 0 ? F(v.co2, 0) : '-') + '</td><td>' + F(v.costo, 0) + '</td></tr>';
    });
    return h + '<tr><td><b>Totale</b></td><td></td><td><b>' + F(im.co2, 0) + '</b></td><td><b>' + F(im.costo, 0) + '</b></td></tr></tbody>';
  }

  function indicatoriImpatto(im) {
    var k = '<div><b>' + F(im.co2, 0) + ' kg</b><span>CO₂e (produzione)</span></div>' +
      '<div><b>' + (im.area > 0 ? F(im.co2m2, 0) : '-') + ' kg/m²</b><span>CO₂e per m² di solaio servito</span></div>' +
      '<div><b>' + F(im.costo, 0) + ' €</b><span>costo in opera</span></div>' +
      '<div><b>' + (im.area > 0 ? F(im.costom2, 0) : '-') + ' €/m²</b><span>costo per m² di solaio servito</span></div>';
    return k;
  }

  // stesso telaio (stessa geometria e stessi carichi) nei tre materiali
  function tabellaConfronto(p, ip, conSolaio) {
    var h = '<thead><tr><th>Materiale</th><th>CO₂e [kg/m²]</th><th>Costo [€/m²]</th><th>CO₂e totale [kg]</th><th>Costo totale [€]</th></tr></thead><tbody>';
    ['acciaio', 'legno', 'ca'].forEach(function (m) {
      var pm = Object.assign({}, p, { mat: m, chi: m === materiale ? p.chi : CHI[m] }), im = RT.impatto(RT.telaio(pm), pm, ip, conSolaio), cur = m === materiale;
      var cella = function (t) { return cur ? '<b>' + t + '</b>' : t; };
      h += '<tr' + (cur ? ' class="corrente"' : '') + '><td>' + cella(NOMI_MAT[m]) + '</td><td>' + cella(im.area > 0 ? F(im.co2m2, 0) : '-') + '</td><td>' + cella(im.area > 0 ? F(im.costom2, 0) : '-') +
        '</td><td>' + cella(F(im.co2, 0)) + '</td><td>' + cella(F(im.costo, 0)) + '</td></tr>';
    });
    return h + '</tbody>';
  }

  function impatto(p, r) {
    var ip = leggiIpotesi(), conSolaio = $('conSolaio').checked, im = RT.impatto(r, p, ip, conSolaio);
    $('tImpatto').innerHTML = tabellaImpatto(im);
    $('kpiImpatto').innerHTML = indicatoriImpatto(im);
    $('tConfronto').innerHTML = tabellaConfronto(p, ip, conSolaio);
    var nota = '';
    if (materiale === 'legno') nota = 'Il legno immagazzina circa <b>' + F(im.stoccata, 0) + ' kg di CO₂</b> (carbonio biogenico), che qui <b>non è sottratta</b>: vale finché l\'edificio dura e il legno non viene bruciato.';
    $('notaImpatto').innerHTML = nota;
    $('notaImpatto').hidden = !nota;
  }

  // ---------------------------------------------------------------- pannello degli sbalzi (nei vuoti e di estremita')
  function arrotonda1(x) { return Math.round(x * 10) / 10; }
  function estremo(chiave) { var l = chiave.split(':')[1]; return l === 'sx' || l === 'dx'; }

  function mostraPannello(p) {
    var pan = $('pannelloSbalzi');
    if (!sel) { pan.hidden = true; return; }
    var pr = sel.split(':'), k = parseInt(pr[0], 10), st = RT.telaioStato(p), nome = nomeLivello(k, p.n);
    function sliderA(testo, valore, max, attivo) {
      $('etichettaA').innerHTML = testo + ' <span class="unita">[m]</span>';
      var el = $('sbA'); el.min = 0; el.max = max; el.value = valore; el.disabled = !attivo; $('sbAv').textContent = F(valore, 1) + ' m';
    }
    function sliderB(valore, max, attivo) { var el = $('sbB'); el.min = 0; el.max = max; el.value = valore; el.disabled = !attivo; $('sbBv').textContent = F(valore, 1) + ' m'; }
    if (estremo(sel)) {                              // sbalzo di estremita' al livello k: lunghezza individuale
      var lato = pr[1], comune = p[lato] || 0, ok = comune > 0 && st.trave(k, lato);
      if (!ok) { sel = null; pan.hidden = true; return; }
      var v = lung[sel] > 0 ? lung[sel] : comune;
      $('titoloSbalzi').textContent = nome + ': sbalzo ' + (lato === 'sx' ? 'sinistro' : 'destro') + ' (valore comune ' + F(comune, 1) + ' m)';
      sliderA('Lunghezza dello sbalzo', v, $(lato).max, true); $('sbA').min = 0.1;
      $('rigaB').hidden = true;
      $('notaSbalzi').textContent = 'Lo sbalzo prolunga la trave adiacente e qui può essere diverso da quello degli altri piani. Il valore comune si cambia con il cursore «Sbalzo ' + (lato === 'sx' ? 'sinistro' : 'destro') + '».';
      $('rimettiTrave').hidden = true; $('valoreComune').hidden = !(lung[sel] > 0); $('togliSbalzo').hidden = false;
    } else {                                         // vuoto: sbalzi dalle travi vicine
      var i = parseInt(pr[1], 10), sv = st.vuoto(k, i);
      if (!sv.vuoto) { sel = null; pan.hidden = true; return; }
      $('titoloSbalzi').textContent = (sv.perPilastro ? 'Campata senza pilastro: ' : 'Vuoto: ') + nome + ', campata ' + (i + 1) + ' (' + F(sv.L, 1) + ' m)';
      sliderA('Sbalzo da sinistra', sv.a, arrotonda1(sv.L - sv.b), sv.haA); sliderB(sv.b, arrotonda1(sv.L - sv.a), sv.haB);
      $('rigaB').hidden = false;
      var nota = sv.perPilastro
        ? 'Manca un pilastro a questo livello: la trave non può esserci, ma la trave vicina può continuare con uno sbalzo che non esce dalla campata (' + F(sv.L, 1) + ' m).'
        : 'Gli sbalzi prolungano le travi vicine e non escono dal vuoto: la somma dei due non supera la luce della trave tolta (' + F(sv.L, 1) + ' m).';
      if (!sv.haA) nota += ' A sinistra non c\'è una trave da prolungare: niente sbalzo.';
      if (!sv.haB) nota += ' A destra non c\'è una trave da prolungare: niente sbalzo.';
      $('notaSbalzi').textContent = nota;
      $('rimettiTrave').hidden = sv.perPilastro; $('valoreComune').hidden = true; $('togliSbalzo').hidden = true;
    }
    pan.hidden = false;
  }

  function cambiaSbalzo(quale, valore) {
    if (!sel) return;
    var pr = sel.split(':'), v = arrotonda1(valore);
    if (estremo(sel)) { if (Math.abs(v - leggi(pr[1])) < 1e-9) delete lung[sel]; else lung[sel] = Math.max(v, 0.1); }
    else {
      var sv = RT.telaioStato(parametri()).vuoto(parseInt(pr[0], 10), parseInt(pr[1], 10)), a = quale === 'a' ? v : sv.a, b = quale === 'b' ? v : sv.b;
      if (a + b > sv.L) { if (quale === 'a') a = sv.L - b; else b = sv.L - a; }
      vuoti[sel] = { a: arrotonda1(a), b: arrotonda1(b) };
    }
    calcola();
  }

  function scegli(chiave) { sel = chiave; calcola(); $('pannelloSbalzi').scrollIntoView({ block: 'nearest' }); }

  // ---------------------------------------------------------------- schermo intero (prospetto e pianta)
  function inSchermoIntero(el) { return document.fullscreenElement === el || el.classList.contains('schermo-intero'); }
  function aggiornaTastiSchermo() {
    Array.prototype.forEach.call(document.querySelectorAll('.tasto-schermo'), function (b) {
      var attivo = inSchermoIntero($(b.getAttribute('data-vista')));
      b.textContent = attivo ? '✕ Esci dallo schermo intero' : '⤢ Schermo intero';
      b.setAttribute('aria-pressed', attivo);
    });
  }
  function schermoIntero(id) {
    var el = $(id);
    if (inSchermoIntero(el)) {
      el.classList.remove('schermo-intero');
      if (document.fullscreenElement === el && document.exitFullscreen) document.exitFullscreen();
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(function () { el.classList.add('schermo-intero'); aggiornaTastiSchermo(); });   // se il browser lo rifiuta: copre la pagina
    } else el.classList.add('schermo-intero');
    aggiornaTastiSchermo();
  }

  // ---------------------------------------------------------------- calcolo e aggiornamento
  function aggiornaEtichette() {
    $('nv').textContent = $('n').value; $('ncv').textContent = $('nc').value;
    $('Hv').textContent = F(leggi('H'), 1) + ' m'; $('Bv').textContent = F(leggi('B'), 1) + ' m';
    $('sxv').textContent = leggi('sx') > 0 ? F(leggi('sx'), 1) + ' m' : 'assente'; $('dxv').textContent = leggi('dx') > 0 ? F(leggi('dx'), 1) + ' m' : 'assente';
    $('g1v').textContent = F(leggi('g1'), 1); $('g2v').textContent = F(leggi('g2'), 1); $('qv').textContent = F(leggi('q'), 1); $('qbv').textContent = F(leggi('qb'), 1);
    $('neveV').textContent = $('usaNeve').checked ? F(leggi('neve'), 1) : 'esclusa'; $('neve').disabled = !$('usaNeve').checked; $('chiv').textContent = F(leggi('chi'), 2);
  }

  function ripulisciVuoti() {                                  // gli sbalzi nel vuoto esistono solo dove c'e' un vuoto (campata senza trave con una trave vicina da prolungare)
    var st = RT.telaioStato(parametri()), n = intero('n');
    Object.keys(vuoti).forEach(function (key) {
      var pr = key.split(':'), k = parseInt(pr[0], 10), i = parseInt(pr[1], 10);
      if (!(k >= 1 && k <= n) || !st.vuoto(k, i).vuoto) delete vuoti[key];
    });
  }

  function calcola() {
    aggiornaEtichette();
    costruisciLivelliPianta(intero('n'));
    ripulisciVuoti();
    var p = parametri(), r = RT.telaio(p);
    disegna(p, r); disegnaPianta(p, r); tabelle(p, r); impatto(p, r); mostraPannello(p);
  }

  // ---------------------------------------------------------------- eventi
  function nuovoStato(nuovaSenza, nuovaColSenza) { senza = nuovaSenza; colSenza = nuovaColSenza; vuoti = {}; lung = {}; sel = null; msg(''); costruisciMatrice(); calcola(); }
  function almenoPiani(m) { if (intero('n') < m) $('n').value = m; }

  function collegaEventi() {
    $('mAcc').addEventListener('click', function () { impostaMateriale('acciaio', true); });
    $('mLeg').addEventListener('click', function () { impostaMateriale('legno', true); });
    $('mCa').addEventListener('click', function () { impostaMateriale('ca', true); });
    $('nc').addEventListener('input', function () { costruisciCampate(); costruisciMatrice(); calcola(); });
    $('n').addEventListener('input', function () { costruisciMatrice(); costruisciMatriceCarichi(); calcola(); });
    ['sx', 'dx'].forEach(function (id) { $(id).addEventListener('input', function () { costruisciMatrice(); calcola(); }); });
    $('uguali').addEventListener('change', function () { if (this.checked) { for (var j = 1; j < 5; j++) luci[j] = luci[0]; costruisciCampate(); calcola(); } });
    ['H', 'B', 'bordo', 'chi', 'carichi', 'omini', 'parola', 'vinc', 'acc', 'serie', 'cleg', 'bleg', 'fck', 'tipoTrave', 'livPianta', 'conSolaio'].concat(IPOTESI.map(function (x) { return x[0]; })).forEach(function (id) { $(id).addEventListener('input', calcola); });
    ['g1', 'g2', 'q', 'qb', 'neve'].forEach(function (id) {                 // cursori generali: con i carichi per livello impostano tutti i livelli
      $(id).addEventListener('input', function () { if (perLivello()) { applicaGenerale(id); costruisciMatriceCarichi(); } calcola(); });
    });
    $('usaNeve').addEventListener('input', function () { costruisciMatriceCarichi(); calcola(); });
    $('carLiv').addEventListener('change', function () {                   // attiva o disattiva i carichi diversi ai piani
      if (this.checked) { carPiani = {}; carTetto = null; }
      costruisciMatriceCarichi(); calcola();
    });
    $('matriceCarichi').addEventListener('input', modificaCarico);
    $('ripristinaIpotesi').addEventListener('click', function () { impostaIpotesi(); calcola(); });
    $('sbA').addEventListener('input', function () { cambiaSbalzo('a', parseFloat(this.value)); });
    $('sbB').addEventListener('input', function () { cambiaSbalzo('b', parseFloat(this.value)); });
    $('rimettiTrave').addEventListener('click', function () { delete senza[sel]; delete vuoti[sel]; sel = null; msg(''); costruisciMatrice(); calcola(); });
    $('valoreComune').addEventListener('click', function () { delete lung[sel]; calcola(); });
    $('togliSbalzo').addEventListener('click', function () { senza[sel] = true; sel = null; msg(''); costruisciMatrice(); calcola(); });
    $('chiudiPannello').addEventListener('click', function () { sel = null; calcola(); });
    Array.prototype.forEach.call(document.querySelectorAll('.tasto-schermo'), function (b) {
      b.addEventListener('click', function () { schermoIntero(b.getAttribute('data-vista')); });
    });
    document.addEventListener('fullscreenchange', aggiornaTastiSchermo);
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      Array.prototype.forEach.call(document.querySelectorAll('.vista.schermo-intero'), function (el) { el.classList.remove('schermo-intero'); });
      aggiornaTastiSchermo();
    });
    $('fig').addEventListener('click', function (ev) {                   // clic sul disegno: trave, sbalzo o pilastro
      var el = ev.target;
      while (el && el !== $('fig')) {
        if (el.getAttribute && el.getAttribute('data-key')) { alterna(el.getAttribute('data-key')); return; }
        if (el.getAttribute && el.getAttribute('data-col')) { alternaCol(el.getAttribute('data-col')); return; }
        if (el.getAttribute && el.getAttribute('data-vuoto')) { scegli(el.getAttribute('data-vuoto')); return; }
        if (el.getAttribute && el.getAttribute('data-sbalzo')) { scegli(el.getAttribute('data-sbalzo')); return; }
        el = el.parentNode;
      }
    });
    // esempi
    $('pTutte').addEventListener('click', function () { nuovoStato({}, {}); });
    $('pArretra').addEventListener('click', function () {                // arretramento: via la campata di destra in copertura, poi la testa del pilastro di destra
      almenoPiani(2);
      var nn = intero('n'), nc2 = intero('nc'), s = {}, c = {};
      s[nn + ':' + (nc2 - 1)] = true; c[nc2 + ':' + nn] = true; nuovoStato(s, c);
    });
    $('pSx').addEventListener('click', function () { almenoPiani(2); nuovoStato({ '1:0': true }, {}); });
    $('pCentro').addEventListener('click', function () {
      almenoPiani(2);
      if (intero('nc') < 3) { $('nc').value = 3; costruisciCampate(); }
      var s = {}; s['1:' + Math.floor(intero('nc') / 2)] = true; nuovoStato(s, {});
    });
  }

  // preset da URL: ?materiale=acciaio|legno|ca&piani=N&campate=N&luci=4,5.5&H=3.5&B=6&bordo=1&sbalzo_sx=m&sbalzo_dx=m&serie=HEA|HEB&senza=1:0,2:1&senzaPil=2:3
  //   &sbalziVuoto=2:1:1.5:2 (livello:campata:da sinistra:da destra, in m)&sbalziLivello=2:sx:0.8 (sbalzo di estremita' di un solo livello)
  //   &acc=S235|S275|S355&fck=C25/30&vinc=appoggiata|semi|incastro&g1=3&g2=3&q=2&qb=4&neve=0.5 (materiale, schema e carichi in kN/m2)
  //   &carichiLiv=1:3:3:4:5,2:2.5:2:2:4,3:3:3:0.5 (carichi diversi ai piani: livello:G1:G2:Q[:Q sbalzi], in kN/m2; in copertura Q = neve)
  function leggiUrl() {
    var qs = new URLSearchParams(location.search);
    if (qs.get('piani')) $('n').value = Math.min(6, Math.max(1, parseInt(qs.get('piani'), 10) || 2));
    if (qs.get('campate')) $('nc').value = Math.min(5, Math.max(1, parseInt(qs.get('campate'), 10) || 2));
    if (qs.get('luci')) {                                        // luci delle campate in m, separate da virgole: luci=4,5.5
      var lv = qs.get('luci').split(',').map(parseFloat).filter(function (x) { return x >= 2 && x <= 10; }).slice(0, 5);
      if (lv.length) {
        lv.forEach(function (x, i) { luci[i] = x; });
        if (!qs.get('campate')) $('nc').value = Math.max(1, lv.length);
        $('uguali').checked = lv.every(function (x) { return x === lv[0]; });
      }
    }
    if (qs.get('H')) $('H').value = Math.min(5, Math.max(2.6, parseFloat(qs.get('H')) || 3.2));
    if (qs.get('B')) $('B').value = Math.min(9, Math.max(2.5, parseFloat(qs.get('B')) || 5));
    if (qs.get('bordo') === '1') $('bordo').checked = true;
    if (qs.get('sbalzo_sx')) $('sx').value = Math.min(3, Math.max(0, parseFloat(qs.get('sbalzo_sx')) || 0));
    if (qs.get('sbalzo_dx')) $('dx').value = Math.min(3, Math.max(0, parseFloat(qs.get('sbalzo_dx')) || 0));
    if (qs.get('serie') === 'HEA') $('serie').value = 'HEA';
    if (RT.ACCIAI[qs.get('acc')]) $('acc').value = qs.get('acc');                        // acciaio: S235 | S275 | S355
    if (RT.CLS[qs.get('fck')]) $('fck').value = qs.get('fck');                            // calcestruzzo: C25/30 | C28/35 | C30/37
    if (['appoggiata', 'semi', 'incastro'].indexOf(qs.get('vinc')) >= 0) $('vinc').value = qs.get('vinc');
    if (qs.get('senza')) qs.get('senza').split(',').forEach(function (x) { if (/^\d+:(\d+|sx|dx)$/.test(x)) senza[x] = true; });
    if (qs.get('senzaPil')) qs.get('senzaPil').split(',').forEach(function (x) { if (/^\d+:\d+$/.test(x)) colSenza[x] = true; });
    if (qs.get('sbalziVuoto')) qs.get('sbalziVuoto').split(',').forEach(function (x) {         // k:i:a:b (m)
      var q = /^(\d+:\d+):(\d*\.?\d+):(\d*\.?\d+)$/.exec(x);
      if (q) vuoti[q[1]] = { a: parseFloat(q[2]), b: parseFloat(q[3]) };
    });
    if (qs.get('sbalziLivello')) qs.get('sbalziLivello').split(',').forEach(function (x) {      // k:sx:m oppure k:dx:m
      var q = /^(\d+:(?:sx|dx)):(\d*\.?\d+)$/.exec(x);
      if (q) lung[q[1]] = parseFloat(q[2]);
    });
    var m = qs.get('materiale');
    return m === 'ca' ? 'ca' : (m === 'legno' ? 'legno' : 'acciaio');
  }

  // carichi da URL (dopo impostaMateriale, che rimette i valori del materiale): g1, g2, q, qb, neve in kN/m2 e, per i carichi diversi ai piani,
  // carichiLiv=1:3:3:4:5,2:2.5:2:2:4,3:3:3:0.5 (livello:G1:G2:Q[:Q sbalzi]; in copertura Q e' la neve)
  function leggiCarichiUrl() {
    var qs = new URLSearchParams(location.search), v = qs.get('carichiLiv'), cambiato = false;
    ['g1', 'g2', 'q', 'qb', 'neve'].forEach(function (id) {
      var x = parseFloat(qs.get(id));
      if (qs.get(id) !== null && x >= 0) { $(id).value = x; cambiato = true; }
    });
    if (!v) { if (cambiato) calcola(); return; }
    var n = intero('n'), trovato = false;
    carPiani = {}; carTetto = null;
    v.split(',').forEach(function (x) {
      var q = x.split(':').map(parseFloat), k = q[0];
      if (!(k >= 1 && k <= n) || q.length < 4 || q.slice(1, 4).some(function (y) { return !(y >= 0); })) return;
      if (k === n) { carTetto = { g1: q[1], g2: q[2], q: q[3], qb: q[3] }; trovato = true; }
      else { carPiani[k] = { g1: q[1], g2: q[2], q: q[3], qb: q.length > 4 && q[4] >= 0 ? q[4] : leggi('qb') }; trovato = true; }
    });
    if (trovato) { $('carLiv').checked = true; costruisciMatriceCarichi(); }
    calcola();
  }

  function avvia() {
    impostaIpotesi();
    collegaEventi();
    var m = leggiUrl();
    costruisciCampate();
    costruisciMatrice();
    impostaMateriale(m, true);
    leggiCarichiUrl();
    aggiornaTastiSchermo();
  }
  avvia();
})();
