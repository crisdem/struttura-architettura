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
  // HEA e HEB [nome, h mm, b mm, A cm2, massa kg/m, i_y cm, i_z cm] (sagomario ArcelorMittal; generato da sagomario_he.py)
  RT.HE = {
    HEA: [
      ['HEA 100', 96.0, 100.0, 21.2, 16.7, 4.06, 2.51],
      ['HEA 120', 114.0, 120.0, 25.3, 19.9, 4.89, 3.02],
      ['HEA 140', 133.0, 140.0, 31.4, 24.7, 5.73, 3.52],
      ['HEA 160', 152.0, 160.0, 38.8, 30.4, 6.57, 3.98],
      ['HEA 180', 171.0, 180.0, 45.3, 35.5, 7.45, 4.52],
      ['HEA 200', 190.0, 200.0, 53.8, 42.3, 8.28, 4.98],
      ['HEA 220', 210.0, 220.0, 64.3, 50.5, 9.17, 5.51],
      ['HEA 240', 230.0, 240.0, 76.8, 60.3, 10.05, 6.0],
      ['HEA 260', 250.0, 260.0, 86.8, 68.2, 10.97, 6.5],
      ['HEA 280', 270.0, 280.0, 97.3, 76.4, 11.86, 7.0],
      ['HEA 300', 290.0, 300.0, 112.5, 88.3, 12.74, 7.49],
      ['HEA 320', 310.0, 300.0, 124.4, 97.6, 13.58, 7.49],
      ['HEA 340', 330.0, 300.0, 133.5, 105.0, 14.4, 7.46],
      ['HEA 360', 350.0, 300.0, 142.8, 112.0, 15.22, 7.43],
      ['HEA 400', 390.0, 300.0, 159.0, 125.0, 16.84, 7.34],
      ['HEA 450', 440.0, 300.0, 178.0, 140.0, 18.92, 7.29],
      ['HEA 500', 490.0, 300.0, 197.5, 155.0, 20.98, 7.24],
      ['HEA 550', 540.0, 300.0, 211.8, 166.0, 22.99, 7.15],
      ['HEA 600', 590.0, 300.0, 226.5, 178.0, 24.97, 7.05]
    ],
    HEB: [
      ['HEB 100', 100.0, 100.0, 26.0, 20.4, 4.16, 2.53],
      ['HEB 120', 120.0, 120.0, 34.0, 26.7, 5.04, 3.06],
      ['HEB 140', 140.0, 140.0, 43.0, 33.7, 5.93, 3.58],
      ['HEB 160', 160.0, 160.0, 54.3, 42.6, 6.78, 4.05],
      ['HEB 180', 180.0, 180.0, 65.3, 51.2, 7.66, 4.57],
      ['HEB 200', 200.0, 200.0, 78.1, 61.3, 8.54, 5.07],
      ['HEB 220', 220.0, 220.0, 91.0, 71.5, 9.43, 5.59],
      ['HEB 240', 240.0, 240.0, 106.0, 83.2, 10.31, 6.08],
      ['HEB 260', 260.0, 260.0, 118.4, 93.0, 11.22, 6.58],
      ['HEB 280', 280.0, 280.0, 131.4, 103.0, 12.11, 7.09],
      ['HEB 300', 300.0, 300.0, 149.1, 117.0, 12.99, 7.58],
      ['HEB 320', 320.0, 300.0, 161.3, 127.0, 13.82, 7.57],
      ['HEB 340', 340.0, 300.0, 170.9, 134.0, 14.65, 7.53],
      ['HEB 360', 360.0, 300.0, 180.6, 142.0, 15.46, 7.49],
      ['HEB 400', 400.0, 300.0, 197.8, 155.0, 17.08, 7.4],
      ['HEB 450', 450.0, 300.0, 218.0, 171.0, 19.14, 7.33],
      ['HEB 500', 500.0, 300.0, 238.6, 187.0, 21.19, 7.27],
      ['HEB 550', 550.0, 300.0, 254.1, 199.0, 23.2, 7.17],
      ['HEB 600', 600.0, 300.0, 270.0, 212.0, 25.17, 7.08]
    ]
  };

  // ---- sagomario europeo (ArcelorMittal, Sections and Merchant Bars) ----
  // [nome, h mm, b mm, tw mm, tf mm, A cm2, massa kg/m, Iy cm4, Wel,y cm3, Wpl,y cm3, iy cm, iz cm]; null = dato non estratto
  RT.SAGOMARIO = {
    IPE: [
      ['IPE 120', 120, 64, 4.4, 6.3, 13.2, 10.4, 318, 53, 60.7, 4.9, 1.45],
      ['IPE 140', 140, 73, 4.7, 6.9, 16.4, 12.9, 541, 77.3, 88.3, 5.74, 1.65],
      ['IPE 160', 160, 82, 5.0, 7.4, 20.1, 15.8, 869, 109, 124, 6.58, 1.84],
      ['IPE 180', 180, 91, 5.3, 8.0, 23.9, 18.8, 1317, 146, 166, 7.42, 2.05],
      ['IPE 200', 200, 100, 5.6, 8.5, 28.5, 22.4, 1943, 194, 221, 8.26, 2.24],
      ['IPE 220', 220, 110, 5.9, 9.2, 33.4, 26.2, 2772, 252, 285, 9.11, 2.48],
      ['IPE 240', 240, 120, 6.2, 9.8, 39.1, 30.7, 3892, 324, 367, 9.97, 2.69],
      ['IPE 270', 270, 135, 6.6, 10.2, 45.9, 36.1, 5790, 429, 484, 11.2, 3.02],
      ['IPE 300', 300, 150, 7.1, 10.7, 53.8, 42.2, 8356, 557, 628, 12.5, 3.35],
      ['IPE 330', 330, 160, 7.5, 11.5, 62.6, 49.1, 11770, 713, 804, 13.7, 3.55],
      ['IPE 360', 360, 170, 8.0, 12.7, 72.7, 57.1, 16270, 904, 1019, 15.0, 3.79],
      ['IPE 400', 400, 180, 8.6, 13.5, 84.5, 66.3, 23130, 1160, 1307, 16.6, 3.95],
      ['IPE 450', 450, 190, 9.4, 14.6, 98.8, 77.6, 33740, 1500, 1702, 18.5, 4.12],
      ['IPE 500', 500, 200, 10.2, 16.0, 116.0, 90.7, 48200, 1930, 2194, 20.4, 4.31],
      ['IPE 550', 550, 210, 11.1, 17.2, 134.0, 106.0, 67120, 2440, 2787, 22.4, 4.45],
      ['IPE 600', 600, 220, 12.0, 19.0, 156.0, 122.0, 92080, 3070, 3512, 24.3, 4.66]
    ],
    HEA: [
      ['HEA 100', 96, 100, 5.0, 8.0, 21.2, 16.7, 349.2, 72.76, 83.01, 4.06, 2.51],
      ['HEA 120', 114, 120, 5.0, 8.0, 25.3, 19.9, 606.2, 106.3, 119.5, 4.89, 3.02],
      ['HEA 140', 133, 140, 5.5, 8.5, 31.4, 24.7, 1033, 155.4, 173.5, 5.73, 3.52],
      ['HEA 160', 152, 160, 6.0, 9.0, 38.8, 30.4, 1673, 220.1, 245.1, 6.57, 3.98],
      ['HEA 180', 171, 180, 6.0, 9.5, 45.3, 35.5, 2510, 293.6, 324.9, 7.45, 4.52],
      ['HEA 200', 190, 200, 6.5, 10.0, 53.8, 42.3, 3692, 388.6, 429.5, 8.28, 4.98],
      ['HEA 220', 210, 220, 7.0, 11.0, 64.3, 50.5, 5410, 515.2, 568.5, 9.17, 5.51],
      ['HEA 240', 230, 240, 7.5, 12.0, 76.8, 60.3, 7763, 675.1, 744.6, 10.05, 6.0],
      ['HEA 260', 250, 260, 7.5, 12.5, 86.8, 68.2, 10450, 836.4, 919.8, 10.97, 6.5],
      ['HEA 280', 270, 280, 8.0, 13.0, 97.3, 76.4, 13670, 1013, 1112, 11.86, 7.0],
      ['HEA 300', 290, 300, 8.5, 14.0, 112.5, 88.3, 18260, 1260, 1383, 12.74, 7.49],
      ['HEA 320', 310, 300, 9.0, 15.5, 124.4, 97.6, 22930, 1479, 1628, 13.58, 7.49],
      ['HEA 340', 330, 300, 9.5, 16.5, 133.5, 105.0, 27690, 1678, 1850, 14.4, 7.46],
      ['HEA 360', 350, 300, 10.0, 17.5, 142.8, 112.0, 33090, 1891, 2088, 15.22, 7.43],
      ['HEA 400', 390, 300, 11.0, 19.0, 159.0, 125.0, 45070, 2311, 2562, 16.84, 7.34],
      ['HEA 450', 440, 300, 11.5, 21.0, 178.0, 140.0, 63720, 2896, 3216, 18.92, 7.29],
      ['HEA 500', 490, 300, 12.0, 23.0, 197.5, 155.0, null, null, null, null, 7.24],
      ['HEA 550', 540, 300, 12.5, 24.0, 211.8, 166.0, null, null, null, null, 7.15],
      ['HEA 600', 590, 300, 13.0, 25.0, 226.5, 178.0, null, null, null, null, 7.05],
      ['HEA 650', 640, 300, 13.5, 26.0, 241.6, 190.0, null, null, null, null, 6.97],
      ['HEA 700', 690, 300, 14.5, 27.0, 260.5, 204.0, null, null, null, null, 6.84],
      ['HEA 800', 790, 300, 15.0, 28.0, 285.8, 224.0, null, null, null, null, 6.65],
      ['HEA 900', 890, 300, 16.0, 30.0, 320.5, 252.0, null, null, null, null, 6.5],
      ['HEA 1000', 990, 300, 16.5, 31.0, 346.8, 272.0, null, null, null, null, 6.35]
    ],
    HEB: [
      ['HEB 100', 100, 100, 6.0, 10.0, 26.0, 20.4, 449.5, 89.91, 104.2, 4.16, 2.53],
      ['HEB 120', 120, 120, 6.5, 11.0, 34.0, 26.7, 864.4, 144.1, 165.2, 5.04, 3.06],
      ['HEB 140', 140, 140, 7.0, 12.0, 43.0, 33.7, 1509, 215.6, 245.4, 5.93, 3.58],
      ['HEB 160', 160, 160, 8.0, 13.0, 54.3, 42.6, 2492, 311.5, 354, 6.78, 4.05],
      ['HEB 180', 180, 180, 8.5, 14.0, 65.3, 51.2, 3831, 425.7, 481.4, 7.66, 4.57],
      ['HEB 200', 200, 200, 9.0, 15.0, 78.1, 61.3, 5696, 569.6, 642.5, 8.54, 5.07],
      ['HEB 220', 220, 220, 9.5, 16.0, 91.0, 71.5, 8091, 735.5, 827, 9.43, 5.59],
      ['HEB 240', 240, 240, 10.0, 17.0, 106.0, 83.2, 11260, 938.3, 1053, 10.31, 6.08],
      ['HEB 260', 260, 260, 10.0, 17.5, 118.4, 93.0, 14920, 1148, 1283, 11.22, 6.58],
      ['HEB 280', 280, 280, 10.5, 18.0, 131.4, 103.0, 19270, 1376, 1534, 12.11, 7.09],
      ['HEB 300', 300, 300, 11.0, 19.0, 149.1, 117.0, 25170, 1678, 1869, 12.99, 7.58],
      ['HEB 320', 320, 300, 11.5, 20.5, 161.3, 127.0, 30820, 1926, 2149, 13.82, 7.57],
      ['HEB 340', 340, 300, 12.0, 21.5, 170.9, 134.0, 36660, 2156, 2408, 14.65, 7.53],
      ['HEB 360', 360, 300, 12.5, 22.5, 180.6, 142.0, null, null, null, null, 7.49],
      ['HEB 400', 400, 300, 13.5, 24.0, 197.8, 155.0, null, null, null, null, 7.4],
      ['HEB 450', 450, 300, 14.0, 26.0, 218.0, 171.0, null, null, null, null, 7.33],
      ['HEB 500', 500, 300, 14.5, 28.0, 238.6, 187.0, null, null, null, null, 7.27],
      ['HEB 550', 550, 300, 15.0, 29.0, 254.1, 199.0, null, null, null, null, 7.17],
      ['HEB 600', 600, 300, 15.5, 30.0, 270.0, 212.0, null, null, null, null, 7.08],
      ['HEB 650', 650, 300, 16.0, 31.0, 286.3, 225.0, null, null, null, null, 6.99],
      ['HEB 700', 700, 300, 17.0, 32.0, 306.4, 241.0, null, null, null, null, 6.87],
      ['HEB 800', 800, 300, 17.5, 33.0, 334.2, 262.0, null, null, null, null, 6.68],
      ['HEB 900', 900, 300, 18.5, 35.0, 371.3, 291.0, null, null, null, null, 6.53],
      ['HEB 1000', 1000, 300, 19.0, 36.0, 400.0, 314.0, null, null, null, null, 6.38]
    ]
  };
  RT.SAGOMARIO_COLONNE = ['Profilo', 'h [mm]', 'b [mm]', 't_w [mm]', 't_f [mm]', 'A [cm²]', 'G [kg/m]', 'I_y [cm⁴]', 'W_el,y [cm³]', 'W_pl,y [cm³]', 'i_y [cm]', 'i_z [cm]'];

  // ---- azioni ----
  RT.pSLU = function (g1, g2, q) { return RT.GAMMA.G1 * g1 + RT.GAMMA.G2 * g2 + RT.GAMMA.Q * q; };
  RT.momento = function (p, L, beta) { return p * L * L / beta; };          // kNm
  RT.kgfDaKN = function (kN) { return kN * 1000 / 9.81; };

  // ---- acciaio ----
  RT.fyd = function (fyk) { return fyk / RT.GAMMA.M0; };
  RT.Wmin = function (M_kNm, fyd) { return M_kNm * 1e6 / fyd / 1e3; };      // cm3
  RT.Amin_pilastro_acc = function (N_kN, fyd, chi) { return N_kN * 1e3 / ((chi || 0.5) * fyd) / 100; }; // cm2, chi0 (default 0.5)

  // ---- livello 1: predimensionamento (criteri geometrici; lezioni 1, 3 e 4) ----
  RT.HLUCE = { appoggiata: 20, semi: 25, incastro: 30 };      // acciaio: h = L / x, in funzione dello schema
  // Pilastri, livello 1 (revisione TA8, 9/11/2026): lato [mm] = kappa * L_max [m] * pos * radice(n), con
  //   L_max = lunghezza massima delle travi che convergono nel pilastro (anche quelle trasversali al telaio), n = numero di piani sopra.
  //   Non c'e' nessuna regola sulla snellezza: i_min (acciaio) e lato >= L0/15 (c.a., legno) sono del livello 2.
  RT.K_PILASTRO = { acciaio: 30, legno: 30, ca: 45 };
  RT.POS_PILASTRO = { interno: 1, bordo: 0.7, angolo: 0.5 };  // pos: pilastro interno, di bordo, d'angolo
  RT.MIN_K = { acciaio: 200, legno: 200, ca: 300 };            // mm: limite inferiore della regola kappa
  RT.PASSO_K = { acciaio: 50, legno: 50, ca: 50 };             // arrotondamento per eccesso a multipli di 50 mm
  RT.latoKgrezzo = function (mat, Lmax, pos, n) {              // mm, prima dell'arrotondamento e del minimo (pos: numero oppure 'interno' | 'bordo' | 'angolo')
    var ps = (typeof pos === 'string') ? RT.POS_PILASTRO[pos] : pos;
    return RT.K_PILASTRO[mat] * Math.max(Lmax, 0) * ps * Math.sqrt(Math.max(n, 0));
  };
  RT.latoK = function (mat, Lmax, pos, n) {                    // mm, arrotondato per eccesso a 50 mm, con il minimo
    var pa = RT.PASSO_K[mat];
    return Math.max(RT.MIN_K[mat], pa * Math.ceil(RT.latoKgrezzo(mat, Lmax, pos, n) / pa - 1e-9));
  };
  RT.LAMBDA0 = 100;                                            // snellezza di riferimento: i_min >= beta H / lambda0
  RT.imin = function (L0_m) { return L0_m * 1000 / RT.LAMBDA0; };   // mm, L0 = beta * H libera (livello 2, acciaio)
  RT.LATO_L0 = 15;                                             // c.a. e legno: lato >= L0 / 15 (lambda circa 50, valore didattico; livello 2)
  RT.sceltaHE = function (serie, Amin, imin_mm) {              // primo HEA/HEB con A >= Amin e i_z >= i_min
    var T = RT.HE[serie];
    for (var i = 0; i < T.length; i++) { if (T[i][3] >= Amin && T[i][6] * 10 >= imin_mm) return T[i]; }
    return null;
  };
  // ---- livello 2, travi: la freccia NON si verifica; si calcola I_min dal limite di freccia e si sceglie il profilo con W >= W_min e I >= I_min ----
  // delta [mm] = k p L^4 / (384 E I); p [kN/m = N/mm], L [m], I [cm4]
  RT.deltaIPE = function (k, p, Lc, I_cm4) { return k * p * Math.pow(Lc * 1000, 4) / (384 * RT.E_ACCIAIO * I_cm4 * 1e4); };   // solo informativa
  RT.Imin = function (k, pk, L, Llim) {                        // momento d'inerzia minimo [cm4] perche' delta = k pk L^4 /(384 E I) <= Llim/250 (L, Llim in m; pk in kN/m)
    return k * pk * Math.pow(L * 1000, 4) / (384 * RT.E_ACCIAIO * (Llim * 1000 / 250)) / 1e4;
  };
  RT.sceltaIPE = function (Wmin, Imin) {                       // primo IPE con W_el,y >= W_min e I_y >= I_min; profW: solo per W; profI: solo per I
    var prof = null, profW = null, profI = null, tol = 1e-9;
    for (var i = 0; i < RT.IPE.length; i++) {
      var r = RT.IPE[i], okW = r[2] >= Wmin - tol, okI = r[3] >= Imin - tol;
      if (okW && !profW) profW = r;
      if (okI && !profI) profI = r;
      if (okW && okI) { prof = r; break; }
    }
    return { prof: prof, profW: profW, profI: profI };
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
  RT.dmin_emergente = function (M_kNm, b, fcd) { return 2.2 * Math.sqrt(M_kNm * 1e6 / (b * fcd)); };   // mm, rho' = 2,2 (come per la trave a spessore)
  RT.bmin_spessore = function (M_kNm, d, fcd) { return Math.pow(2.2, 2) * M_kNm * 1e6 / (d * d * fcd); }; // mm, rho' = 2,2
  RT.Amin_pilastro_cls = function (N_kN, fcd, nu) { return N_kN * 1e3 / ((nu || 0.5) * fcd); };          // mm2, nu (default 0,5)
  RT.su50 = function (x) { return Math.ceil(x / 50 - 1e-9) * 50; };

  // ---- statistica (per la lezione sulla sicurezza) ----
  // ---- carico della neve sulle coperture (NTC 2018, par. 3.4): q_s = mu_i * q_sk * C_E * C_t  [kN/m2, sulla proiezione orizzontale]
  RT.ZONE_NEVE = {                                             // q_sk = base per a_s <= 200 m; k*(1 + (a_s/a0)^2) per a_s > 200 m
    'I-A': { nome: 'Zona I - Alpina', base: 1.50, k: 1.39, a0: 728 },
    'I-M': { nome: 'Zona I - Mediterranea', base: 1.50, k: 1.35, a0: 602 },
    'II':  { nome: 'Zona II', base: 1.00, k: 0.85, a0: 481 },
    'III': { nome: 'Zona III', base: 0.60, k: 0.51, a0: 481 }
  };
  RT.CE_NEVE = { vento: 0.9, normale: 1.0, riparata: 1.1 };     // battuta dai venti, normale, riparata (Tab. 3.4.I)
  RT.neveSuolo = function (zona, as) {                         // q_sk [kN/m2] in funzione della zona e della quota a_s [m]
    var z = RT.ZONE_NEVE[zona]; if (!z) return NaN;
    return as <= 200 ? z.base : z.k * (1 + Math.pow(as / z.a0, 2));
  };
  RT.mu1 = function (alfa) {                                   // coefficiente di forma, copertura a una o due falde (Tab. 3.4.II), alfa in gradi
    if (alfa <= 30) return 0.8;
    if (alfa < 60) return 0.8 * (60 - alfa) / 30;
    return 0;
  };
  RT.caricoNeve = function (zona, as, alfa, esposizione, ct) {
    var qsk = RT.neveSuolo(zona, as), mu = RT.mu1(alfa), ce = RT.CE_NEVE[esposizione] || 1, c = (ct === undefined ? 1 : ct);
    return { qsk: qsk, mu: mu, CE: ce, Ct: c, qs: mu * qsk * ce * c };
  };

  RT.Phi = function (z) { // funzione di ripartizione normale standard (Abramowitz-Stegun)
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var d = 0.3989423 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  };
  RT.normPdf = function (x, m, s) { return Math.exp(-0.5 * Math.pow((x - m) / s, 2)) / (s * Math.sqrt(2 * Math.PI)); };

  if (typeof module !== 'undefined' && module.exports) module.exports = RT;
  root.RT = RT;
})(typeof window !== 'undefined' ? window : this);
