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
    var loc = 'it-IT'; try { if (localStorage.getItem('lang') === 'en') loc = 'en-US'; } catch (e) {}
    return Number(x).toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d });
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

  // ---- sagomario europeo (ArcelorMittal, Sections and Merchant Bars) ----
  // [nome, h mm, b mm, tw mm, tf mm, A cm2, massa kg/m, Iy cm4, Wel,y cm3, Wpl,y cm3, iy cm]; null = dato non estratto
  RT.SAGOMARIO = {
    IPE: [
      ['IPE 120', 120, 64, 4.4, 6.3, 13.2, 10.4, 318, 53, 60.7, 4.9],
      ['IPE 140', 140, 73, 4.7, 6.9, 16.4, 12.9, 541, 77.3, 88.3, 5.74],
      ['IPE 160', 160, 82, 5.0, 7.4, 20.1, 15.8, 869, 109, 124, 6.58],
      ['IPE 180', 180, 91, 5.3, 8.0, 23.9, 18.8, 1317, 146, 166, 7.42],
      ['IPE 200', 200, 100, 5.6, 8.5, 28.5, 22.4, 1943, 194, 221, 8.26],
      ['IPE 220', 220, 110, 5.9, 9.2, 33.4, 26.2, 2772, 252, 285, 9.11],
      ['IPE 240', 240, 120, 6.2, 9.8, 39.1, 30.7, 3892, 324, 367, 9.97],
      ['IPE 270', 270, 135, 6.6, 10.2, 45.9, 36.1, 5790, 429, 484, 11.2],
      ['IPE 300', 300, 150, 7.1, 10.7, 53.8, 42.2, 8356, 557, 628, 12.5],
      ['IPE 330', 330, 160, 7.5, 11.5, 62.6, 49.1, 11770, 713, 804, 13.7],
      ['IPE 360', 360, 170, 8.0, 12.7, 72.7, 57.1, 16270, 904, 1019, 15.0],
      ['IPE 400', 400, 180, 8.6, 13.5, 84.5, 66.3, 23130, 1160, 1307, 16.6],
      ['IPE 450', 450, 190, 9.4, 14.6, 98.8, 77.6, 33740, 1500, 1702, 18.5],
      ['IPE 500', 500, 200, 10.2, 16.0, 116.0, 90.7, 48200, 1930, 2194, 20.4],
      ['IPE 550', 550, 210, 11.1, 17.2, 134.0, 106.0, 67120, 2440, 2787, 22.4],
      ['IPE 600', 600, 220, 12.0, 19.0, 156.0, 122.0, 92080, 3070, 3512, 24.3]
    ],
    HEA: [
      ['HEA 100', 96, 100, 5.0, 8.0, 21.2, 16.7, 349.2, 72.76, 83.01, 4.06],
      ['HEA 120', 114, 120, 5.0, 8.0, 25.3, 19.9, 606.2, 106.3, 119.5, 4.89],
      ['HEA 140', 133, 140, 5.5, 8.5, 31.4, 24.7, 1033, 155.4, 173.5, 5.73],
      ['HEA 160', 152, 160, 6.0, 9.0, 38.8, 30.4, 1673, 220.1, 245.1, 6.57],
      ['HEA 180', 171, 180, 6.0, 9.5, 45.3, 35.5, 2510, 293.6, 324.9, 7.45],
      ['HEA 200', 190, 200, 6.5, 10.0, 53.8, 42.3, 3692, 388.6, 429.5, 8.28],
      ['HEA 220', 210, 220, 7.0, 11.0, 64.3, 50.5, 5410, 515.2, 568.5, 9.17],
      ['HEA 240', 230, 240, 7.5, 12.0, 76.8, 60.3, 7763, 675.1, 744.6, 10.05],
      ['HEA 260', 250, 260, 7.5, 12.5, 86.8, 68.2, 10450, 836.4, 919.8, 10.97],
      ['HEA 280', 270, 280, 8.0, 13.0, 97.3, 76.4, 13670, 1013, 1112, 11.86],
      ['HEA 300', 290, 300, 8.5, 14.0, 112.5, 88.3, 18260, 1260, 1383, 12.74],
      ['HEA 320', 310, 300, 9.0, 15.5, 124.4, 97.6, 22930, 1479, 1628, 13.58],
      ['HEA 340', 330, 300, 9.5, 16.5, 133.5, 105.0, 27690, 1678, 1850, 14.4],
      ['HEA 360', 350, 300, 10.0, 17.5, 142.8, 112.0, 33090, 1891, 2088, 15.22],
      ['HEA 400', 390, 300, 11.0, 19.0, 159.0, 125.0, 45070, 2311, 2562, 16.84],
      ['HEA 450', 440, 300, 11.5, 21.0, 178.0, 140.0, 63720, 2896, 3216, 18.92],
      ['HEA 500', 490, 300, 12.0, 23.0, 197.5, 155.0, null, null, null, null],
      ['HEA 550', 540, 300, 12.5, 24.0, 211.8, 166.0, null, null, null, null],
      ['HEA 600', 590, 300, 13.0, 25.0, 226.5, 178.0, null, null, null, null],
      ['HEA 650', 640, 300, 13.5, 26.0, 241.6, 190.0, null, null, null, null],
      ['HEA 700', 690, 300, 14.5, 27.0, 260.5, 204.0, null, null, null, null],
      ['HEA 800', 790, 300, 15.0, 28.0, 285.8, 224.0, null, null, null, null],
      ['HEA 900', 890, 300, 16.0, 30.0, 320.5, 252.0, null, null, null, null],
      ['HEA 1000', 990, 300, 16.5, 31.0, 346.8, 272.0, null, null, null, null]
    ],
    HEB: [
      ['HEB 100', 100, 100, 6.0, 10.0, 26.0, 20.4, 449.5, 89.91, 104.2, 4.16],
      ['HEB 120', 120, 120, 6.5, 11.0, 34.0, 26.7, 864.4, 144.1, 165.2, 5.04],
      ['HEB 140', 140, 140, 7.0, 12.0, 43.0, 33.7, 1509, 215.6, 245.4, 5.93],
      ['HEB 160', 160, 160, 8.0, 13.0, 54.3, 42.6, 2492, 311.5, 354, 6.78],
      ['HEB 180', 180, 180, 8.5, 14.0, 65.3, 51.2, 3831, 425.7, 481.4, 7.66],
      ['HEB 200', 200, 200, 9.0, 15.0, 78.1, 61.3, 5696, 569.6, 642.5, 8.54],
      ['HEB 220', 220, 220, 9.5, 16.0, 91.0, 71.5, 8091, 735.5, 827, 9.43],
      ['HEB 240', 240, 240, 10.0, 17.0, 106.0, 83.2, 11260, 938.3, 1053, 10.31],
      ['HEB 260', 260, 260, 10.0, 17.5, 118.4, 93.0, 14920, 1148, 1283, 11.22],
      ['HEB 280', 280, 280, 10.5, 18.0, 131.4, 103.0, 19270, 1376, 1534, 12.11],
      ['HEB 300', 300, 300, 11.0, 19.0, 149.1, 117.0, 25170, 1678, 1869, 12.99],
      ['HEB 320', 320, 300, 11.5, 20.5, 161.3, 127.0, 30820, 1926, 2149, 13.82],
      ['HEB 340', 340, 300, 12.0, 21.5, 170.9, 134.0, 36660, 2156, 2408, 14.65],
      ['HEB 360', 360, 300, 12.5, 22.5, 180.6, 142.0, null, null, null, null],
      ['HEB 400', 400, 300, 13.5, 24.0, 197.8, 155.0, null, null, null, null],
      ['HEB 450', 450, 300, 14.0, 26.0, 218.0, 171.0, null, null, null, null],
      ['HEB 500', 500, 300, 14.5, 28.0, 238.6, 187.0, null, null, null, null],
      ['HEB 550', 550, 300, 15.0, 29.0, 254.1, 199.0, null, null, null, null],
      ['HEB 600', 600, 300, 15.5, 30.0, 270.0, 212.0, null, null, null, null],
      ['HEB 650', 650, 300, 16.0, 31.0, 286.3, 225.0, null, null, null, null],
      ['HEB 700', 700, 300, 17.0, 32.0, 306.4, 241.0, null, null, null, null],
      ['HEB 800', 800, 300, 17.5, 33.0, 334.2, 262.0, null, null, null, null],
      ['HEB 900', 900, 300, 18.5, 35.0, 371.3, 291.0, null, null, null, null],
      ['HEB 1000', 1000, 300, 19.0, 36.0, 400.0, 314.0, null, null, null, null]
    ]
  };
  RT.SAGOMARIO_COLONNE = ['Profilo', 'h [mm]', 'b [mm]', 't_w [mm]', 't_f [mm]', 'A [cm²]', 'G [kg/m]', 'I_y [cm⁴]', 'W_el,y [cm³]', 'W_pl,y [cm³]', 'i_y [cm]'];

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
  RT.Amin_pilastro_acc = function (N_kN, fyd, chi) { return N_kN * 1e3 / ((chi || 0.5) * fyd) / 100; }; // cm2, chi0 (default 0.5)
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
  RT.Amin_pilastro_legno = function (N_kN, fc0d, chi) { return N_kN * 1e3 / ((chi || RT.LEGNO_PAR.chi0) * fc0d); }; // mm2 (chi0 default 0,30)
  RT.su40 = function (x) { return Math.ceil(x / 40 - 1e-9) * 40; };

  // ---- calcestruzzo armato ----
  RT.fcd = function (fck) { return 0.85 * fck / RT.GAMMA.Mc; };
  RT.dmin_emergente = function (M_kNm, b, fcd) { return 2.0 * Math.sqrt(M_kNm * 1e6 / (b * fcd)); };   // mm, rho' = 2,0
  RT.bmin_spessore = function (M_kNm, d, fcd) { return Math.pow(2.2, 2) * M_kNm * 1e6 / (d * d * fcd); }; // mm, rho' = 2,2
  RT.Amin_pilastro_cls = function (N_kN, fcd, nu) { return N_kN * 1e3 / ((nu || 0.5) * fcd); };          // mm2, nu (default 0,5)
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
          e.A = RT.Amin_pilastro_acc(N, fyd, p.chi);
          e.prof = RT.sceltaHEB(e.A, 200);
          e.lato = e.prof ? e.prof[1] : null;
          if (e.prof) massaAcc += e.prof[3] * p.H;
        } else if (p.mat === 'legno') {
          e.A = RT.Amin_pilastro_legno(N, fc0d, p.chi);
          e.lato = Math.max(300, RT.su50(Math.sqrt(e.A)));
          volLegno += e.lato * e.lato * p.H / 1e6;
        } else {
          e.A = RT.Amin_pilastro_cls(N, fcd, p.chi);
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

  // ---- muratura portante: predimensionamento di una parete (striscia di 1 m) ----
  // Resistenza caratteristica fk [daN/cm2] di murature con elementi artificiali pieni/semipieni e pietra squadrata,
  // in funzione della resistenza fbk dell'elemento e della classe di malta.
  RT.FK_MURATURA = {
    fbk: [50, 75, 100, 150, 200],
    malte: ['M15', 'M10', 'M5', 'M2.5'],
    tab: [[35, 34, 33, 30], [50, 45, 41, 35], [62, 53, 47, 41], [82, 67, 60, 51], [97, 80, 70, 61]]
  };
  RT.fkMuratura = function (fbk, malta) {   // MPa
    var i = RT.FK_MURATURA.fbk.indexOf(fbk), j = RT.FK_MURATURA.malte.indexOf(malta);
    return RT.FK_MURATURA.tab[i][j] / 10;
  };
  // tipi di muratura: peso [kN/m3], spessore minimo [mm] (NTC 2018, 7.8.1.2); fk da tabella (tabellare) o valore indicativo
  RT.MURATURE = {
    pieno:   { nome: 'Mattoni pieni',                    gamma: 18, tmin: 240, tabellare: true },
    forato:  { nome: 'Blocchi in laterizio semipieno',   gamma: 11, tmin: 240, tabellare: true },
    pietra:  { nome: 'Pietra squadrata',                 gamma: 22, tmin: 240, tabellare: true },
    cls:     { nome: 'Blocchi in calcestruzzo',          gamma: 14, tmin: 200, tabellare: true },
    tufo:    { nome: 'Tufo / pietra irregolare (fk indicativo 2 MPa)',     gamma: 16, tmin: 300, fk: 2.0 },
    storica: { nome: 'Mattoni e calce, esistente (fk indicativo 3 MPa)',   gamma: 18, tmin: 240, fk: 3.0 }
  };
  RT.SPESSORI_MUR = [200, 240, 250, 300, 380, 400, 500, 600, 800, 1000]; // mm

  // Coefficiente di riduzione Phi_t per snellezza h/t e coefficiente di eccentricita' m = 6e/t
  // ("-" = nessuna capacita'; interpolazione lineare)
  RT.PHI_T = {
    lam: [0, 5, 10, 15, 20],
    m: [0, 0.5, 1.0, 1.5, 2.0],
    tab: [[1.00, 0.74, 0.59, 0.44, 0.33], [0.97, 0.71, 0.55, 0.39, 0.27], [0.86, 0.61, 0.45, 0.27, 0.15],
          [0.69, 0.48, 0.32, 0.17, 0], [0.53, 0.36, 0.23, 0, 0]]
  };
  RT.phiMuratura = function (lam, m) {
    var T = RT.PHI_T;
    if (lam > 20 || m > 2) return 0;
    function idx(arr, x) { var k = 0; while (k < arr.length - 2 && x > arr[k + 1]) k++; return k; }
    var i = idx(T.lam, lam), j = idx(T.m, m);
    var tl = (lam - T.lam[i]) / (T.lam[i + 1] - T.lam[i]), tm = (m - T.m[j]) / (T.m[j + 1] - T.m[j]);
    var a = T.tab[i][j] * (1 - tm) + T.tab[i][j + 1] * tm, b = T.tab[i + 1][j] * (1 - tm) + T.tab[i + 1][j + 1] * tm;
    return Math.max(0, a * (1 - tl) + b * tl);
  };

  // p: {n, H, L1, L2, tipo: 'bordo'|'spina', g1,g2,q,neve, aperture (0-0.5), mur, fk [MPa], gammaM, sismica, costante}
  // Restituisce, per ogni interpiano (1 = terra), spessore, tensione e coefficiente di utilizzo.
  RT.muratura = function (p) {
    var G = RT.GAMMA, m = RT.MURATURE[p.mur], fk = p.fk, fd = fk / p.gammaM;
    var lamMax = p.sismica ? 12 : 20;
    var Linf = p.tipo === 'spina' ? (p.L1 + p.L2) / 2 : p.L1 / 2;       // larghezza d'influenza del solaio [m]
    var pSol = (G.G1 * p.g1 + G.G2 * p.g2 + G.Q * p.q) * Linf;          // kN/m, solaio di piano
    var pCop = (G.G1 * p.g1 + G.G2 * p.g2 + G.Q * p.neve) * Linf;       // kN/m, copertura
    var eL = p.tipo === 'spina' ? 0.03 : 0.10;                          // eccentricita' del carico del solaio, in frazioni di t
    var apertura = 1 - p.aperture;
    var hef = p.H * 1000;
    var tmin = Math.max(m.tmin, hef / lamMax);
    var out = { fd: fd, fk: fk, Linf: Linf, lamMax: lamMax, piani: [], pSol: pSol, pCop: pCop, tot: {} };
    function verifica(s, t, Nsopra) {
      var Nsol = (s === p.n ? pCop : pSol);
      var pp = G.G1 * m.gamma * (t / 1000) * p.H;                        // peso proprio dell'interpiano [kN/m]
      var N = Nsopra + Nsol + pp;                                        // alla base dell'interpiano [kN/m]
      var Nm = N - pp / 2;                                               // a meta' altezza
      var e = eL * t / 2 + hef / 200;                                    // es + ea  [mm]
      var mt = 6 * e / t;
      var phi = RT.phiMuratura(hef / t, mt);
      var sigma = Nm / apertura / (t / 1000) / 1000;                     // MPa, sul pannello resistente
      var Rd = phi * fd;
      return { s: s, t: t, N: N, Nm: Nm, e: e, mt: mt, phi: phi, sigma: sigma, Rd: Rd, uso: Rd > 0 ? sigma / Rd : Infinity, lam: hef / t, pp: pp };
    }
    var Nsopra = 0, tPrec = 0, vol = 0, i, r;
    for (var s = p.n; s >= 1; s--) {
      var scelto = null;
      for (i = 0; i < RT.SPESSORI_MUR.length; i++) {
        var t = RT.SPESSORI_MUR[i];
        if (t < tmin - 1e-9 || t < tPrec) continue;
        scelto = verifica(s, t, Nsopra);
        if (scelto.sigma <= scelto.Rd) break;
      }
      out.piani.push(scelto);
      Nsopra = scelto.N; tPrec = scelto.t;
    }
    if (p.costante) {                                                     // stesso spessore in tutti i piani = quello della base
      var tb = out.piani[out.piani.length - 1].t, Ns = 0;
      out.piani = out.piani.map(function (x) { r = verifica(x.s, tb, Ns); Ns = r.N; return r; });
    }
    out.piani.forEach(function (x) { vol += x.t / 1000 * p.H; });
    out.tot.volumePerMetro = vol;                                         // m3 di muratura per metro di parete
    out.tot.Nbase = out.piani[out.piani.length - 1].N;
    out.tot.ok = out.piani.every(function (x) { return x.uso <= 1 + 1e-9 && x.lam <= lamMax + 1e-9; });
    return out;
  };


  // ---- muratura portante, versione semplificata (tre requisiti sullo spessore) ----
  // fk indicativi dalle tabelle: mattoni pieni fbk 150/M5, laterizio semipieno fbk 100/M5, blocchi cls fbk 75/M5, pietra fbk 150/M5; tufo: valore indicativo.
  RT.MURATURE_S = {
    pieno:  { nome: 'Mattoni pieni',               fk: 6.0, gamma: 18, tmin: 240 },
    forato: { nome: 'Blocchi di laterizio',        fk: 4.7, gamma: 11, tmin: 240 },
    cls:    { nome: 'Blocchi di calcestruzzo',     fk: 4.1, gamma: 14, tmin: 200 },
    pietra: { nome: 'Pietra squadrata',            fk: 6.0, gamma: 22, tmin: 240 },
    tufo:   { nome: 'Tufo',                        fk: 2.0, gamma: 16, tmin: 300 }
  };
  RT.GAMMA_M_MUR = 2.5;   // coefficiente di sicurezza della muratura
  RT.NU_MUR = 0.5;        // coefficiente nu: A_min = N_Ed / (nu * f_d), come per i pilastri in c.a.
  // p: {n, H, L1, L2, tipo, g1, g2, q, neve, aperture (0-0.5), mur, sismica, nu}
  RT.muraturaSemplice = function (p) {
    var G = RT.GAMMA, m = RT.MURATURE_S[p.mur], fd = m.fk / RT.GAMMA_M_MUR, nu = p.nu || RT.NU_MUR;
    var Linf = p.tipo === 'spina' ? (p.L1 + p.L2) / 2 : p.L1 / 2;
    var pSol = (G.G1 * p.g1 + G.G2 * p.g2 + G.Q * p.q) * Linf, pCop = (G.G1 * p.g1 + G.G2 * p.g2 + G.Q * p.neve) * Linf;
    var tSn = p.H * 1000 / (p.sismica ? 12 : 20), apertura = 1 - p.aperture;
    var out = { fd: fd, nu: nu, fk: m.fk, Linf: Linf, tSn: tSn, tMin: m.tmin, piani: [] }, Nsopra = 0, tPrec = 0;
    for (var s = p.n; s >= 1; s--) {
      var scelto = null;
      for (var i = 0; i < RT.SPESSORI_MUR.length; i++) {
        var t = RT.SPESSORI_MUR[i];
        var pp = G.G1 * m.gamma * (t / 1000) * p.H;
        var N = Nsopra + (s === p.n ? pCop : pSol) + pp;
        var tRes = (N - pp / 2) / apertura / (nu * fd);                    // mm: t = N / ((1 - a) * nu * fd), N in kN/m = N/mm
        scelto = { s: s, t: t, N: N, pSol: (s === p.n ? pCop : pSol), tMin: m.tmin, tSn: tSn, tRes: tRes, pp: pp,
                   sigma: (N - pp / 2) / apertura / t, Rd: nu * fd };
        scelto.uso = scelto.sigma / scelto.Rd;
        if (t >= m.tmin && t >= tSn && t >= tRes && t >= tPrec) break;
      }
      var mx = Math.max(scelto.tMin, scelto.tSn, scelto.tRes);
      scelto.decide = (mx === scelto.tRes) ? 'resistenza' : (mx === scelto.tSn ? 'snellezza' : 'minimo normativo');
      scelto.ok = scelto.t >= mx - 1e-9;
      out.piani.push(scelto); Nsopra = scelto.N; tPrec = scelto.t;
    }
    out.tot = { volumePerMetro: out.piani.reduce(function (a, x) { return a + x.t / 1000 * p.H; }, 0) };
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = RT;
  root.RT = RT;
})(typeof window !== 'undefined' ? window : this);
