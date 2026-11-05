/* Modulo Struttura e Architettura - telaio piano: dimensionamento di travi e pilastri.
   Richiede calc.js (libreria RT). Strumento DIDATTICO: non sostituisce la progettazione e le verifiche delle NTC 2018.

   RT.telaio(p)       dimensiona il telaio (livello 1 = predimensionamento, livello 2 = dimensionamento)
   RT.telaioStato(p)  dice quali travi e quali pilastri si possono togliere o rimettere (per l'interfaccia)

   p: {n, spans[m], H, B, bordo, g1, g2, q, neve, qb, sx, dx, mat:'acciaio'|'legno'|'ca',
       acciaio, classeLegno, bLegno, fck, vincolo, travaTipo, serie:'HEA'|'HEB', senza, colSenza}
   sx, dx: sbalzi sinistro e destro [m] (0 = assente); qb: sovraccarico sugli sbalzi dei piani [kN/m2].
   senza: travi tolte, chiavi 'k:i' (livello k = 1..n, campata i = 0..nc-1) oppure 'k:sx', 'k:dx' per gli sbalzi.
     Una trave tolta e' un vuoto (doppia altezza): niente trave e niente carico di solaio in quella campata e a quel livello.
     Lo sbalzo e' il prolungamento della trave adiacente: senza quella trave (o senza il pilastro) non esiste.
   colSenza: tratti di pilastro tolti, chiavi 'j:s' (pilastro j = 0..nc, interpiano s = 1..n). Si tolgono solo dall'alto e solo se in
     testa non arrivano travi (testa libera, nessun pilastro sopra): se manca l'interpiano s, mancano anche i superiori.
     Le travi che arrivano a un nodo senza pilastro sono assenti.
   sbalziLivello: lunghezza individuale degli sbalzi di estremita', chiavi 'k:sx' e 'k:dx' (m); senza valore vale quella comune sx / dx.
   sbalziVuoto: sbalzi dentro un vuoto, chiavi 'k:i' (la campata i al livello k deve essere tolta) con valori {a, b} in metri:
     a = sbalzo che parte dal pilastro di sinistra (prolunga la trave a sinistra del vuoto), b = sbalzo che parte dal pilastro di destra
     (prolunga la trave a destra). Esistono solo se la trave da prolungare esiste e non escono mai dal vuoto: a + b <= luce della campata tolta.
   Un nodo e' vincolato se vi arriva almeno una trave (o uno sbalzo); la lunghezza libera del pilastro e' la distanza fra nodi
   vincolati. L0 = beta H libera, con beta = 1 (beta = 2 se la testa e' libera, con base incastrata).
   Livello 1: h = L/x, lato = K radice(area), i_min = L0/100. Livello 2: W, A_min, freccia verificata.
   Sbalzo: mensola con M = p Ls^2 / 2; per i criteri geometrici e i limiti di freccia si usa la luce 2 Ls. */
(function (root) {
  'use strict';
  var RT = root.RT;
  var PSI2 = 0.3;                // coefficiente quasi permanente del sovraccarico (legno)
  var COPRIFERRO = 40;           // mm, c.a.

  // ---------------------------------------------------------------- geometria: che cosa esiste
  function geometria(p) {
    var n = p.n, nc = p.spans.length, senza = p.senza || {}, colSenza = p.colSenza || {};
    var haSx = (p.sx || 0) > 0, haDx = (p.dx || 0) > 0, alto = [], j, s;
    for (j = 0; j <= nc; j++) {                        // interpiano piu' alto presente di ciascun pilastro (0 = tolto del tutto)
      alto[j] = n;
      for (s = 1; s <= n; s++) { if (colSenza[j + ':' + s]) { alto[j] = s - 1; break; } }
    }
    // la trave (o lo sbalzo) puo' esistere: i pilastri arrivano al livello e, per lo sbalzo, c'e' la trave adiacente
    function disponibile(k, i) {
      if (i === 'sx') return haSx && alto[0] >= k && !senza[k + ':0'] && alto[1] >= k;
      if (i === 'dx') return haDx && alto[nc] >= k && !senza[k + ':' + (nc - 1)] && alto[nc - 1] >= k;
      return alto[i] >= k && alto[i + 1] >= k;
    }
    function presente(k, i) { return !senza[k + ':' + i] && disponibile(k, i); }
    var ov = p.sbalziLivello || {};
    function lungSbalzo(k, lato) {                     // lunghezza dello sbalzo di estremita' al livello k: individuale, altrimenti quella comune
      var comune = (lato === 'sx' ? p.sx : p.dx) || 0, v = ov[k + ':' + lato];
      return (comune > 0 && v > 0) ? v : comune;
    }
    // sbalzi dentro un vuoto: lunghezze efficaci a e b (0 se manca la trave da prolungare), con a + b <= luce
    var sv = p.sbalziVuoto || {};
    function sbalziVuoto(k, i) {
      var L = p.spans[i], v = sv[k + ':' + i] || {}, vuoto = !!senza[k + ':' + i] && disponibile(k, i);
      var haA = vuoto && i >= 1 && presente(k, i - 1), haB = vuoto && i + 1 <= nc - 1 && presente(k, i + 1);
      var a = haA ? Math.min(Math.max(v.a || 0, 0), L) : 0, b = haB ? Math.min(Math.max(v.b || 0, 0), L - a) : 0;
      return { vuoto: vuoto, haA: haA, haB: haB, a: a, b: b, L: L };
    }
    function nodoEsiste(j2, k) { return alto[j2] >= k; }
    function treAlNodo(j2, k) {                        // al nodo (j2, k) arriva almeno una trave o uno sbalzo
      return (j2 > 0 && presente(k, j2 - 1)) || (j2 < nc && presente(k, j2)) ||
             (j2 === 0 && presente(k, 'sx')) || (j2 === nc && presente(k, 'dx'));
    }
    function vincolato(j2, k) { return k === 0 || (nodoEsiste(j2, k) && treAlNodo(j2, k)); }
    return { n: n, nc: nc, alto: alto, haSx: haSx, haDx: haDx, disponibile: disponibile, presente: presente,
             nodoEsiste: nodoEsiste, treAlNodo: treAlNodo, vincolato: vincolato, sbalziVuoto: sbalziVuoto, lungSbalzo: lungSbalzo };
  }

  // ---------------------------------------------------------------- materiali e carichi
  function materiali(p) {
    var cl = RT.LEGNO[p.classeLegno] || RT.LEGNO['GL24h'];
    return {
      fyd: RT.fyd(RT.ACCIAI[p.acciaio]), fcd: RT.fcd(RT.CLS[p.fck] || p.fck),
      cl: cl, fmd: RT.fmd(p.classeLegno), fc0d: RT.fc0d(p.classeLegno),
      bL: p.bLegno || 160, kdef: RT.LEGNO_PAR.kdef, serie: (p.serie === 'HEA') ? 'HEA' : 'HEB',
      hs: Math.max(120, Math.ceil(p.B * 1000 / 25 / 10) * 10),       // spessore del solaio B/25, minimo 120 mm
      massaAcc: 0, volCls: 0, volLegno: 0,                             // totali, accumulati dal dimensionamento
      casseM2: 0,                                                      // casseforme di travi e pilastri in c.a. [m2]
      areaSol: 0, volSov: 0                                            // area di solaio servita dal telaio [m2]; volume di trave a spessore dentro il solaio [m3]
    };
  }

  // carichi per livello: qd (SLU), qs (rara), qv (variabile); con suffisso b: sugli sbalzi
  function carichi(p) {
    var G = RT.GAMMA, c = { qd: [], qs: [], qv: [], qdb: [], qsb: [], qvb: [] };
    for (var k = 1; k <= p.n; k++) {
      var roof = (k === p.n), Qv = roof ? p.neve : p.q, Qb = roof ? p.neve : (p.qb || p.q);
      c.qd[k] = G.G1 * p.g1 + G.G2 * p.g2 + G.Q * Qv;  c.qs[k] = p.g1 + p.g2 + Qv;  c.qv[k] = Qv;
      c.qdb[k] = G.G1 * p.g1 + G.G2 * p.g2 + G.Q * Qb; c.qsb[k] = p.g1 + p.g2 + Qb; c.qvb[k] = Qb;
    }
    return c;
  }

  // ---------------------------------------------------------------- travi
  // Lgeo, xGeo: luce e coefficiente del criterio geometrico (livello 1); Lc: luce di calcolo; Llim: luce per il limite di freccia
  function dimensionaTrave(p, m, M, Lgeo, xGeo, Lc, Llim, kfr, psR, psQ, psQP) {
    var t = { M: M, L: Lc, hGeo: Lgeo * 1000 / xGeo, hMin: Lgeo * 1000 / 20, hMax: Lgeo * 1000 / 15 };
    if (p.mat === 'acciaio') {
      t.W = RT.Wmin(M, m.fyd);
      var sc = RT.sceltaIPEverificato(t.W, kfr, psR, Lc, Llim);       // W per la resistenza, poi la freccia si verifica
      t.prof = sc.prof; t.profW = sc.profW; t.delta = sc.delta; t.dlim = sc.lim;
      t.h = t.prof ? t.prof[1] : null;
      t.gov = (t.prof && t.profW && t.prof !== t.profW) ? 'freccia' : 'resistenza';
      if (t.prof) m.massaAcc += t.prof[4] * Lc;
    } else if (p.mat === 'legno') {
      t.W = M * 1e6 / m.fmd / 1e3;
      t.hW = Math.sqrt(6 * t.W * 1e3 / m.bL);
      var h = RT.su40(t.hW), rr = 0, I;
      for (var g = 0; g < 80; g++) {                                   // la freccia si verifica; se non basta si alza la sezione
        I = m.bL * Math.pow(h, 3) / 12;                                // mm4
        var w1 = kfr * psQ * Math.pow(Lc * 1000, 4) / (384 * m.cl.E * I);
        var w2 = kfr * (psR + m.kdef * psQP) * Math.pow(Lc * 1000, 4) / (384 * m.cl.E * I);
        rr = Math.max(w1 / (Llim * 1000 / 300), w2 / (Llim * 1000 / 200));
        if (rr <= 1 + 1e-9) break;
        h += 40;
      }
      t.b = m.bL; t.h = h; t.uso = rr; t.I = I / 1e4; t.gov = (h > RT.su40(t.hW)) ? 'freccia' : 'resistenza';
      m.volLegno += t.b * t.h * Lc / 1e6;
    } else if (p.travaTipo === 'spessore') {
      t.d = m.hs - COPRIFERRO;
      t.bmin = RT.bmin_spessore(M, t.d, m.fcd);
      t.b = Math.max(RT.su50(t.bmin), 200); t.h = m.hs; t.hGeo = m.hs;
      m.volCls += t.b * t.h * Lc / 1e6; m.casseM2 += t.b / 1000 * Lc; m.volSov += t.b * t.h * Lc / 1e6;   // a spessore: solo il fondo; il volume e' gia' nel solaio
    } else {
      t.b = 300;
      t.d = RT.dmin_emergente(M, t.b, m.fcd);
      t.h = RT.su50(t.d + COPRIFERRO);
      m.volCls += t.b * t.h * Lc / 1e6; m.casseM2 += (t.b + 2 * t.h) / 1000 * Lc;   // fondo e due lati
    }
    return t;
  }

  function progettaTravi(p, m, geo, car, Binf, out) {
    var beta = RT.BETA[p.vincolo], kf = RT.KFRECCIA[p.vincolo];
    var xTrave = (p.mat === 'acciaio') ? RT.HLUCE[p.vincolo] : 10, xSbalzo = (p.mat === 'acciaio') ? 20 : 10;
    for (var k = 1; k <= p.n; k++) {
      var ps2 = (k === p.n) ? 0 : PSI2, travi = [], sbalzi = [], presenti = 0;
      for (var i = 0; i < geo.nc; i++) {
        var L = p.spans[i];
        if (!geo.presente(k, i)) { travi.push({ assente: true, L: L, i: i, perPilastro: !geo.disponibile(k, i) }); continue; }
        var pd = car.qd[k] * Binf, ps = car.qs[k] * Binf;
        var t = dimensionaTrave(p, m, RT.momento(pd, L, beta), L, xTrave, L, L, kf, ps, car.qv[k] * Binf, (p.g1 + p.g2 + ps2 * car.qv[k]) * Binf);
        t.pd = pd; t.ps = ps; travi.push(t); presenti++; m.areaSol += L * Binf;
      }
      ['sx', 'dx'].forEach(function (lato) {
        var Ls = geo.lungSbalzo(k, lato); if (!(Ls > 0)) return;
        if (!geo.presente(k, lato)) { sbalzi.push({ assente: true, L: Ls, lato: lato, perPilastro: !geo.disponibile(k, lato) }); return; }
        var pdb = car.qdb[k] * Binf, psb = car.qsb[k] * Binf;
        var ts = dimensionaTrave(p, m, pdb * Ls * Ls / 2, 2 * Ls, xSbalzo, Ls, 2 * Ls, 48, psb, car.qvb[k] * Binf, (p.g1 + p.g2 + ps2 * car.qvb[k]) * Binf);
        ts.pd = pdb; ts.ps = psb; ts.lato = lato; sbalzi.push(ts); presenti++; m.areaSol += Ls * Binf;
      });
      var interni = [];                                // sbalzi dentro i vuoti: prolungano le travi vicine
      for (var iv = 0; iv < geo.nc; iv++) {
        var sv = geo.sbalziVuoto(k, iv);
        [['a', sv.a, iv - 1], ['b', sv.b, iv + 1]].forEach(function (c) {
          var Ls = c[1]; if (!(Ls > 0)) return;
          var pdb = car.qdb[k] * Binf, psb = car.qsb[k] * Binf;
          var ti = dimensionaTrave(p, m, pdb * Ls * Ls / 2, 2 * Ls, xSbalzo, Ls, 2 * Ls, 48, psb, car.qvb[k] * Binf, (p.g1 + p.g2 + ps2 * car.qvb[k]) * Binf);
          ti.pd = pdb; ti.ps = psb; ti.lato = 'int'; ti.verso = c[0]; ti.i = iv; ti.Ladj = p.spans[c[2]];
          interni.push(ti); presenti++; m.areaSol += Ls * Binf;
        });
      }
      out.livelli.push({ k: k, qd: car.qd[k], qs: car.qs[k], travi: travi, sbalzi: sbalzi, sbalziInt: interni, nPresenti: presenti });
      var esiste = false;
      for (var j = 0; j <= geo.nc; j++) { if (geo.nodoEsiste(j, k)) esiste = true; }
      if (presenti === 0 && esiste) out.avvisi.push((k === p.n ? 'Copertura' : 'Piano ' + k) + ': nessuna trave. I pilastri non sono collegati nel piano a questo livello.');
    }
  }

  // ---------------------------------------------------------------- pilastri
  // tratti di pilastro fra nodi vincolati: {a, b, libera} (livelli a..b; libera = testa senza travi)
  function tratti(geo, j) {
    var R = [], segs = [], k, q;
    for (k = 0; k <= geo.alto[j]; k++) { if (geo.vincolato(j, k)) R.push(k); }
    for (q = 0; q < R.length - 1; q++) segs.push({ a: R[q], b: R[q + 1], libera: false });
    if (R[R.length - 1] < geo.alto[j]) segs.push({ a: R[R.length - 1], b: geo.alto[j], libera: true });
    return segs;
  }

  // dimensiona un tratto di pilastro: livello 1 (i_min, ingombro K) e livello 2 (A_min); la sezione deve soddisfare entrambi
  function dimensionaPilastro(p, m, sg) {
    var N = sg.N;
    if (p.mat === 'acciaio') {
      sg.A = RT.Amin_pilastro_acc(N, m.fyd, p.chi);
      var T = RT.HE[m.serie], profA = null;
      for (var u = 0; u < T.length; u++) { if (T[u][3] >= sg.A) { profA = T[u]; break; } }
      sg.profA = profA; sg.prof = RT.sceltaHE(m.serie, sg.A, sg.imin);
      sg.lato = sg.prof ? sg.prof[1] : null; sg.larg = sg.prof ? sg.prof[2] : null;
      sg.gov = (sg.prof && profA && sg.prof !== profA) ? 'stabilità' : 'resistenza';
      if (sg.prof) m.massaAcc += sg.prof[4] * sg.Hlib;
    } else {
      var legno = (p.mat === 'legno'), minC = legno ? 200 : 300;         // lato costruttivo minimo [mm]
      sg.A = legno ? RT.Amin_pilastro_legno(N, m.fc0d, p.chi) : RT.Amin_pilastro_cls(N, m.fcd, p.chi);
      sg.latoA = Math.max(minC, RT.su50(Math.sqrt(sg.A)));
      sg.latoSn = RT.su50(sg.L0 * 1000 / RT.LATO_L0);
      sg.lato = Math.max(sg.latoA, sg.latoSn); sg.larg = sg.lato;
      sg.gov = (sg.latoSn > sg.latoA) ? 'stabilità' : 'resistenza';
      if (legno) m.volLegno += sg.lato * sg.lato * sg.Hlib / 1e6;
      else { m.volCls += sg.lato * sg.lato * sg.Hlib / 1e6; m.casseM2 += 4 * sg.lato / 1000 * sg.Hlib; }
    }
  }

  function progettaPilastri(p, m, geo, car, Binf, out) {
    var nc = geo.nc;
    function larg(j, k) {                       // larghezza d'influenza [m] del pilastro j al livello k (solo campate con la trave)
      var w = 0;
      if (j > 0 && geo.presente(k, j - 1)) w += p.spans[j - 1] / 2;
      if (j < nc && geo.presente(k, j)) w += p.spans[j] / 2;
      return w;
    }
    function sbalzoSu(j, k) {                   // reazione [kN] e area [m2] dello sbalzo sul pilastro di estremita'
      var r = 0, a = 0;
      var Lsx = geo.lungSbalzo(k, 'sx'), Ldx = geo.lungSbalzo(k, 'dx');
      if (j === 0 && Lsx > 0 && geo.presente(k, 'sx')) { r += car.qdb[k] * Binf * Lsx * (1 + Lsx / (2 * p.spans[0])); a += Lsx * Binf; }
      if (j === nc && Ldx > 0 && geo.presente(k, 'dx')) { r += car.qdb[k] * Binf * Ldx * (1 + Ldx / (2 * p.spans[nc - 1])); a += Ldx * Binf; }
      out.livelli[k - 1].sbalziInt.forEach(function (t) {              // sbalzi dentro i vuoti, sul pilastro da cui partono
        if ((t.verso === 'a' ? t.i : t.i + 1) === j) { r += t.pd * t.L * (1 + t.L / (2 * t.Ladj)); a += t.L * Binf; }
      });
      return { N: r, A: a };
    }
    for (var s2 = 1; s2 <= p.n; s2++) out.interpiani.push({ s: s2, pilastri: [] });
    for (var j = 0; j <= nc; j++) {
      var segs = tratti(geo, j);
      segs.forEach(function (sg) {
        sg.j = j; sg.s0 = sg.a + 1; sg.s1 = sg.b; sg.nPiani = sg.b - sg.a;
        sg.Hlib = sg.nPiani * p.H; sg.beta = sg.libera ? 2 : 1; sg.L0 = sg.beta * sg.Hlib;
        var N = 0, dN = 0, At = 0;
        for (var k = sg.s0; k <= geo.alto[j]; k++) {
          var sbz = sbalzoSu(j, k);
          N += car.qd[k] * Binf * larg(j, k) + sbz.N; dN += sbz.N; At += larg(j, k) * Binf + sbz.A;
        }
        sg.N = N; sg.dN = dN; sg.Atot = At; sg.imin = RT.imin(sg.L0); sg.latoK = RT.latoK(p.mat, At);
        dimensionaPilastro(p, m, sg);
        for (var s3 = sg.s0; s3 <= sg.s1; s3++) out.interpiani[s3 - 1].pilastri[j] = sg;
        if (sg.libera) out.avvisi.push('Pilastro ' + (j + 1) + ': testa libera al livello ' + sg.b + ' (in cima non arrivano travi). Si può togliere dalla matrice dei pilastri, oppure serve un vincolo; qui è calcolato come mensola, L₀ = 2·(altezza libera).');
        else if (sg.nPiani > 1) out.avvisi.push('Pilastro ' + (j + 1) + ': doppia altezza (interpiani ' + sg.s0 + '–' + sg.s1 + '), lunghezza libera ' + (sg.Hlib).toFixed(1).replace('.', ',') + ' m: L₀ cresce e la sezione deve essere più grande per la stabilità.');
      });
      out.colonne.push(segs);
    }
  }

  // ---------------------------------------------------------------- interfaccia pubblica
  RT.telaio = function (p) {
    var geo = geometria(p), m = materiali(p), car = carichi(p), Binf = p.bordo ? p.B / 2 : p.B;
    var out = { fyd: m.fyd, fcd: m.fcd, fmd: m.fmd, fc0d: m.fc0d, hs: m.hs, Binf: Binf, serie: m.serie, alto: geo.alto,
                livelli: [], interpiani: [], colonne: [], avvisi: [], tot: {} };
    progettaTravi(p, m, geo, car, Binf, out);
    progettaPilastri(p, m, geo, car, Binf, out);
    out.tot.massaAcciaio = m.massaAcc;
    out.tot.volumeCls = m.volCls;
    out.tot.volumeLegno = m.volLegno;
    out.tot.casseM2 = m.casseM2;
    out.tot.areaSolaio = m.areaSol;
    out.tot.volumeSolaio = Math.max(m.areaSol * m.hs / 1000 - m.volSov, 0);   // solaio in c.a. di spessore hs (B/25), al netto delle travi a spessore
    return out;
  };

  // Stato per l'interfaccia. Pilastro (j, s): presente; si puo' togliere solo se e' l'interpiano piu' alto e in testa non arrivano
  // travi; si puo' rimettere solo se e' il primo tolto. Travi: trave(k, i) esiste, disponibile(k, i) puo' esistere.
  RT.telaioStato = function (p) {
    var geo = geometria(p), col = [], j, s;
    for (j = 0; j <= geo.nc; j++) {
      col[j] = [];
      for (s = 1; s <= geo.n; s++) {
        var e = { presente: s <= geo.alto[j], togli: false, ripristina: false, motivo: '' };
        if (e.presente) {
          if (s < geo.alto[j]) e.motivo = 'sopra c\'è ancora il pilastro';
          else if (geo.treAlNodo(j, s)) e.motivo = 'in testa arrivano travi';
          else e.togli = true;
        } else if (s === geo.alto[j] + 1) e.ripristina = true;
        else e.motivo = 'prima va rimesso l\'interpiano sotto';
        col[j][s] = e;
      }
    }
    return { alto: geo.alto, colonne: col, trave: geo.presente, disponibile: geo.disponibile, vuoto: geo.sbalziVuoto };
  };
})(typeof window !== 'undefined' ? window : this);
