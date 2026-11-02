/* Modulo Struttura e Architettura - libreria di calcolo condivisa.
   Solo funzioni pure, nessuna dipendenza. Unita': kN, m, mm, MPa (salvo dove indicato).
   Criteri di predimensionamento e dimensionamento: appunti del laboratorio (1/11/2026).
   Strumento DIDATTICO: non sostituisce la progettazione e le verifiche delle NTC 2018. */
(function (root) {
  'use strict';
  var RT = {};

  RT.fmt = function (x, d) {
    if (d === undefined) d = 1;
    if (!isFinite(x)) return '-';
    return Number(x).toLocaleString('it-IT', { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  // ---- coefficienti (NTC 2018, STR, effetti sfavorevoli) ----
  RT.GAMMA = { G1: 1.3, G2: 1.5, Q: 1.5, M0: 1.05, Mc: 1.5 };
  RT.E_ACCIAIO = 210000; // MPa
  RT.ACCIAI = { S235: 235, S275: 275, S355: 355 };           // fyk [MPa]
  RT.CLS = { 'C25/30': 25, 'C28/35': 28, 'C30/37': 30 };      // fck [MPa]
  RT.BETA = { appoggiata: 8, semi: 10, incastro: 12 };        // M = p L^2 / beta
  RT.KFRECCIA = { appoggiata: 5, semi: 2.5, incastro: 1 };    // delta = k p L^4 / (384 E I)  (semi: valore approssimato)

  // ---- profili: IPE [nome, h mm, Wel,y cm3, Iy cm4, massa kg/m] ----
  RT.IPE = [
    ['IPE 80', 80, 20.0, 80.1, 6.0], ['IPE 100', 100, 34.2, 171, 8.1], ['IPE 120', 120, 53.0, 318, 10.4],
    ['IPE 140', 140, 77.3, 541, 12.9], ['IPE 160', 160, 109, 869, 15.8], ['IPE 180', 180, 146, 1317, 18.8],
    ['IPE 200', 200, 194, 1943, 22.4], ['IPE 220', 220, 252, 2772, 26.2], ['IPE 240', 240, 324, 3892, 30.7],
    ['IPE 270', 270, 429, 5790, 36.1], ['IPE 300', 300, 557, 8356, 42.2], ['IPE 330', 330, 713, 11770, 49.1],
    ['IPE 360', 360, 904, 16270, 57.1], ['IPE 400', 400, 1156, 23130, 66.3], ['IPE 450', 450, 1500, 33740, 77.6],
    ['IPE 500', 500, 1928, 48200, 90.7], ['IPE 550', 550, 2441, 67120, 105], ['IPE 600', 600, 3070, 92080, 122]
  ];
  // HEB [nome, h mm, A cm2, massa kg/m]
  RT.HEB = [
    ['HEB 100', 100, 26.0, 20.4], ['HEB 120', 120, 34.0, 26.7], ['HEB 140', 140, 43.0, 33.7],
    ['HEB 160', 160, 54.3, 42.6], ['HEB 180', 180, 65.3, 51.2], ['HEB 200', 200, 78.1, 61.3],
    ['HEB 220', 220, 91.0, 71.5], ['HEB 240', 240, 106, 83.2], ['HEB 260', 260, 118, 93.0],
    ['HEB 280', 280, 131, 103], ['HEB 300', 300, 149, 117], ['HEB 320', 320, 161, 127],
    ['HEB 340', 340, 171, 134], ['HEB 360', 360, 181, 142], ['HEB 400', 400, 198, 155],
    ['HEB 450', 450, 218, 171], ['HEB 500', 500, 239, 187], ['HEB 550', 550, 254, 199], ['HEB 600', 600, 270, 212]
  ];

  // ---- azioni ----
  RT.pSLU = function (g1, g2, q) { return RT.GAMMA.G1 * g1 + RT.GAMMA.G2 * g2 + RT.GAMMA.Q * q; };
  RT.pSLErara = function (g1, g2, q) { return g1 + g2 + q; };
  RT.momento = function (p, L, beta) { return p * L * L / beta; };          // kNm
  RT.kgfDaKN = function (kN) { return kN * 1000 / 9.81; };

  // ---- acciaio ----
  RT.fyd = function (fyk) { return fyk / RT.GAMMA.M0; };
  RT.Wmin = function (M_kNm, fyd) { return M_kNm * 1e6 / fyd / 1e3; };      // cm3
  // Freccia: delta = k p Lc^4 / (384 E I). Momento d'inerzia minimo [cm4] per delta <= Llim/rapporto.
  // p [kN/m] (= N/mm), Lc luce di calcolo [m], Llim luce per il limite [m] (sbalzi: 2L), E [MPa]
  RT.Idef = function (k, p, Lc, rapporto, E, Llim) {
    var Lmm = Lc * 1000, Lz = (Llim || Lc) * 1000;
    return k * p * Math.pow(Lmm, 4) * rapporto / (384 * E * Lz) / 1e4;
  };
  RT.Imin = function (k, p, L, rapporto, Llim) { return RT.Idef(k, p, L, rapporto, RT.E_ACCIAIO, Llim); };
  RT.sceltaIPE = function (Wmin, Imin) {
    for (var i = 0; i < RT.IPE.length; i++) {
      if (RT.IPE[i][2] >= Wmin && RT.IPE[i][3] >= (Imin || 0)) return RT.IPE[i];
    }
    return null;
  };
  RT.Amin_pilastro_acc = function (N_kN, fyd) { return N_kN * 1e3 / (0.5 * fyd) / 100; }; // cm2, chi0 = 0.5
  // hMin: ingombro minimo del pilastro (appunti: 200x200 per l'acciaio)
  RT.sceltaHEB = function (Amin, hMin) {
    for (var i = 0; i < RT.HEB.length; i++) { if (RT.HEB[i][2] >= Amin && RT.HEB[i][1] >= (hMin || 0)) return RT.HEB[i]; }
    return null;
  };


  // ---- legno (parametri degli appunti: kh = 1, kmod = 0,8, kdef = 0,6, gammaM = 1,5, chi0 = 0,30) ----
  RT.LEGNO = {
    'C24': { fmk: 24, fc0k: 21, E: 11000 },   // massiccio
    'GL24h': { fmk: 24, fc0k: 24, E: 11500 }, // lamellare
    'GL28h': { fmk: 28, fc0k: 28, E: 12600 },
    'GL32h': { fmk: 32, fc0k: 32, E: 14200 }
  };
  RT.LEGNO_PAR = { kh: 1.0, kmod: 0.8, kdef: 0.6, gammaM: 1.5, chi0: 0.30 };
  RT.fmd = function (cl) { var P = RT.LEGNO_PAR; return P.kh * P.kmod * RT.LEGNO[cl].fmk / P.gammaM; };
  RT.fc0d = function (cl) { var P = RT.LEGNO_PAR; return P.kmod * RT.LEGNO[cl].fc0k / P.gammaM; };
  RT.Amin_pilastro_legno = function (N_kN, fc0d) { return N_kN * 1e3 / (RT.LEGNO_PAR.chi0 * fc0d); }; // mm2
  RT.su40 = function (x) { return Math.ceil(x / 40 - 1e-9) * 40; };

  // ---- calcestruzzo armato ----
  RT.fcd = function (fck) { return 0.85 * fck / RT.GAMMA.Mc; };
  RT.dmin_emergente = function (M_kNm, b, fcd) { return 2.0 * Math.sqrt(M_kNm * 1e6 / (b * fcd)); };   // mm, rho' = 2,0
  RT.bmin_spessore = function (M_kNm, d, fcd) { return Math.pow(2.2, 2) * M_kNm * 1e6 / (d * d * fcd); }; // mm, rho' = 2,2
  RT.Amin_pilastro_cls = function (N_kN, fcd) { return N_kN * 1e3 / (0.5 * fcd); };                     // mm2, nu = 0,5
  RT.su50 = function (x) { return Math.ceil(x / 50 - 1e-9) * 50; };

  // ---- statistica (per la lezione sulla sicurezza) ----
  RT.Phi = function (z) { // funzione di ripartizione normale standard (Abramowitz-Stegun)
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var d = 0.3989423 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  };
  RT.normPdf = function (x, m, s) { return Math.exp(-0.5 * Math.pow((x - m) / s, 2)) / (s * Math.sqrt(2 * Math.PI)); };

  // ---- telaio piano ----
  /* p: {n, spans[m], H, B, bordo, g1, g2, q, neve, qb, sx, dx, mat:'acciaio'|'legno'|'ca',
         acciaio, classeLegno, bLegno, fck, vincolo, travaTipo}
     sx, dx: sbalzi sinistro e destro [m] (0 = assente); qb: sovraccarico sugli sbalzi dei piani [kN/m2].
     Sbalzo: mensola con M = p Ls^2 / 2; per criteri geometrici e limiti di freccia si usa la luce 2 Ls. */
  RT.telaio = function (p) {
    var G = RT.GAMMA, beta = RT.BETA[p.vincolo], kf = RT.KFRECCIA[p.vincolo];
    var Binf = p.bordo ? p.B / 2 : p.B;
    var fyd = RT.fyd(RT.ACCIAI[p.acciaio]);
    var fcd = RT.fcd(RT.CLS[p.fck] || p.fck);
    var cl = RT.LEGNO[p.classeLegno] || RT.LEGNO['GL24h'], fmd = RT.fmd(p.classeLegno), fc0d = RT.fc0d(p.classeLegno);
    var bL = p.bLegno || 160, kdef = RT.LEGNO_PAR.kdef;
    var c = 40; // mm
    var hs = Math.max(120, Math.ceil(p.B * 1000 / 25 / 10) * 10);
    var out = { fyd: fyd, fcd: fcd, fmd: fmd, fc0d: fc0d, hs: hs, Binf: Binf, livelli: [], interpiani: [], tot: {} };
    var n = p.n, nc = p.spans.length, sb = { sx: p.sx || 0, dx: p.dx || 0 };
    var massaAcc = 0, volCls = 0, volLegno = 0;
    var psi2 = 0.3;

    // dimensiona una trave. Lgeo: luce per i criteri geometrici; Lc: luce di calcolo; Llim: luce per il limite di freccia
    function dim(M, Lgeo, Lc, Llim, kfr, psR, psQ, psQP, spessoreOK) {
      var t = { M: M, L: Lc, hMin: Lgeo * 1000 / 20, hMax: Lgeo * 1000 / 15, hGeo: Lgeo * 1000 / 10 };
      if (p.mat === 'acciaio') {
        t.W = RT.Wmin(M, fyd);
        t.I = RT.Idef(kfr, psR, Lc, 250, RT.E_ACCIAIO, Llim);
        t.prof = RT.sceltaIPE(t.W, t.I);
        t.h = t.prof ? t.prof[1] : null;
        if (t.prof) massaAcc += t.prof[4] * Lc;
      } else if (p.mat === 'legno') {
        t.W = M * 1e6 / fmd / 1e3;
        var I1 = RT.Idef(kfr, psQ, Lc, 300, cl.E, Llim);                    // freccia istantanea dovuta a Q: <= L/300
        var I2 = RT.Idef(kfr, psR + kdef * psQP, Lc, 200, cl.E, Llim);       // freccia finale: rara + kdef * quasi permanente <= L/200
        t.I = Math.max(I1, I2);
        var hW = Math.sqrt(6 * t.W * 1e3 / bL), hI = Math.cbrt(12 * t.I * 1e4 / bL);
        t.b = bL; t.h = RT.su40(Math.max(hW, hI));
        t.hW = hW; t.hI = hI;
        volLegno += t.b * t.h * Lc / 1e6;
      } else if (p.travaTipo === 'spessore') {
        t.d = hs - c;
        t.bmin = RT.bmin_spessore(M, t.d, fcd);
        t.b = Math.max(RT.su50(t.bmin), 200); t.h = hs; t.hGeo = hs;
        volCls += t.b * t.h * Lc / 1e6;
      } else {
        t.b = 300;
        t.d = RT.dmin_emergente(M, t.b, fcd);
        t.h = RT.su50(t.d + c);
        volCls += t.b * t.h * Lc / 1e6;
      }
      return t;
    }

    var qd = [], qs = [], qv = [], qsb = [], qdb = [], qvb = [];
    for (var k = 1; k <= n; k++) {
      var roof = (k === n);
      var Qv = roof ? p.neve : p.q, Qb = roof ? p.neve : (p.qb || p.q);
      qd[k] = G.G1 * p.g1 + G.G2 * p.g2 + G.Q * Qv;  qs[k] = p.g1 + p.g2 + Qv;  qv[k] = Qv;
      qdb[k] = G.G1 * p.g1 + G.G2 * p.g2 + G.Q * Qb; qsb[k] = p.g1 + p.g2 + Qb; qvb[k] = Qb;
    }
    for (k = 1; k <= n; k++) {
      var roof2 = (k === n), ps2 = roof2 ? 0 : psi2;
      var trave = [], sbalzi = [];
      for (var i = 0; i < nc; i++) {
        var L = p.spans[i], pd = qd[k] * Binf, ps = qs[k] * Binf;
        var t = dim(RT.momento(pd, L, beta), L, L, L, kf, ps, qv[k] * Binf, (p.g1 + p.g2 + ps2 * qv[k]) * Binf);
        t.pd = pd; t.ps = ps; trave.push(t);
      }
      ['sx', 'dx'].forEach(function (lato) {
        var Ls = sb[lato]; if (!(Ls > 0)) return;
        var pdb = qdb[k] * Binf, psb = qsb[k] * Binf;
        var t = dim(pdb * Ls * Ls / 2, 2 * Ls, Ls, 2 * Ls, 48, psb, qvb[k] * Binf, (p.g1 + p.g2 + ps2 * qvb[k]) * Binf);
        t.pd = pdb; t.ps = psb; t.lato = lato; sbalzi.push(t);
      });
      out.livelli.push({ k: k, qd: qd[k], qs: qs[k], travi: trave, sbalzi: sbalzi });
    }
    for (var s2 = 1; s2 <= n; s2++) {
      var pil = [];
      for (var j = 0; j <= nc; j++) {
        var tj = (j === 0 ? p.spans[0] / 2 : (j === nc ? p.spans[nc - 1] / 2 : (p.spans[j - 1] + p.spans[j]) / 2));
        var N = 0, dN = 0;
        for (var kk = s2; kk <= n; kk++) {
          N += qd[kk] * tj * Binf;
          // reazione aggiuntiva della mensola sul pilastro di estremita': p Ls (1 + Ls / (2 L))
          if (j === 0 && sb.sx > 0) dN += qdb[kk] * Binf * sb.sx * (1 + sb.sx / (2 * p.spans[0]));
          if (j === nc && sb.dx > 0) dN += qdb[kk] * Binf * sb.dx * (1 + sb.dx / (2 * p.spans[nc - 1]));
        }
        N += dN;
        var e = { j: j, N: N, dN: dN, tj: tj };
        if (p.mat === 'acciaio') {
          e.A = RT.Amin_pilastro_acc(N, fyd);
          e.prof = RT.sceltaHEB(e.A, 200);
          e.lato = e.prof ? e.prof[1] : null;
          if (e.prof) massaAcc += e.prof[3] * p.H;
        } else if (p.mat === 'legno') {
          e.A = RT.Amin_pilastro_legno(N, fc0d);
          e.lato = Math.max(300, RT.su50(Math.sqrt(e.A)));
          volLegno += e.lato * e.lato * p.H / 1e6;
        } else {
          e.A = RT.Amin_pilastro_cls(N, fcd);
          e.lato = Math.max(300, RT.su50(Math.sqrt(e.A)));
          volCls += e.lato * e.lato * p.H / 1e6;
        }
        pil.push(e);
      }
      out.interpiani.push({ s: s2, pilastri: pil });
    }
    out.tot.massaAcciaio = massaAcc;
    out.tot.volumeCls = volCls;
    out.tot.volumeLegno = volLegno;
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = RT;
  root.RT = RT;
})(typeof window !== 'undefined' ? window : this);
