/* Modulo Struttura e Architettura - stima della CO2 e dei costi del telaio.
   Richiede calc.js e telaio-calc.js (libreria RT). Strumento DIDATTICO: ordini di grandezza, non un computo ne' un'analisi del ciclo di vita.

   RT.impatto(out, p, ip, conSolaio)  out = RT.telaio(p); ip = valori unitari (opzionale: si parte da RT.IMPATTO_DEF)
   Emissioni: solo la produzione dei materiali (moduli A1-A3 della EN 15804: dalla materia prima al cancello della fabbrica), in kg CO2 equivalente.
   Non sono contati trasporto, cantiere, uso, fine vita. Costi: materiali in opera (fornitura, lavorazione e posa), IVA e oneri esclusi. */
(function (root) {
  'use strict';
  var RT = root.RT;

  // Valori predefiniti, modificabili nella pagina. Fonti e incertezza: vedi la sezione "Ipotesi e fonti" di telaio.html.
  RT.IMPATTO_DEF = {
    co2: { acciaio: 1.74, armatura: 0.75, cls: 200, legno: 150 },                          // kgCO2e/kg, kgCO2e/kg, kgCO2e/m3 (C25/30), kgCO2e/m3
    costo: { acciaio: 4.0, armatura: 2.0, cls: 205, casseforme: 47, legno: 1400 },         // euro/kg, euro/kg, euro/m3 (C25/30), euro/m2, euro/m3
    armatura: { telaio: 150, solaio: 90 },                                                 // kg di armatura per m3 di calcestruzzo
    fcls: { 'C25/30': 1, 'C28/35': 1.075, 'C30/37': 1.15 },                                // scala di CO2 e costo del calcestruzzo con la classe (ipotesi del laboratorio)
    stoccata: { densita: 430, kgCO2perKg: 1.63 }                                           // legno lamellare: kg/m3; CO2 immagazzinata per kg di legno (C 50 % x 44/12, umidita 12 %)
  };

  function valori(ip) {
    var d = RT.IMPATTO_DEF, v = { co2: {}, costo: {}, armatura: {}, fcls: d.fcls, stoccata: d.stoccata };
    ['co2', 'costo', 'armatura'].forEach(function (g) {
      Object.keys(d[g]).forEach(function (k) { var x = ip && ip[g] ? ip[g][k] : undefined; v[g][k] = (x !== undefined && isFinite(x) && x >= 0) ? x : d[g][k]; });
    });
    return v;
  }

  RT.impatto = function (out, p, ip, conSolaio) {
    var v = valori(ip), t = out.tot, f = v.fcls[p.fck] || 1, voci = [];
    function voce(chiave, nome, qta, unita, co2, costo) { voci.push({ chiave: chiave, nome: nome, qta: qta, unita: unita, co2: qta * co2, costo: qta * costo }); }
    if (p.mat === 'acciaio') voce('acciaio', 'Acciaio da carpenteria (travi e pilastri)', t.massaAcciaio, 'kg', v.co2.acciaio, v.costo.acciaio);
    else if (p.mat === 'legno') voce('legno', 'Legno lamellare (travi e pilastri)', t.volumeLegno, 'm³', v.co2.legno, v.costo.legno);
    else {
      voce('cls', 'Calcestruzzo di travi e pilastri', t.volumeCls, 'm³', v.co2.cls * f, v.costo.cls * f);
      voce('arm', 'Armatura di travi e pilastri', t.volumeCls * v.armatura.telaio, 'kg', v.co2.armatura, v.costo.armatura);
      voce('cas', 'Casseforme di travi e pilastri', t.casseM2, 'm²', 0, v.costo.casseforme);
    }
    if (conSolaio) {
      voce('clsS', 'Calcestruzzo del solaio', t.volumeSolaio, 'm³', v.co2.cls * f, v.costo.cls * f);
      voce('armS', 'Armatura del solaio', t.volumeSolaio * v.armatura.solaio, 'kg', v.co2.armatura, v.costo.armatura);
      voce('casS', 'Casseforme del solaio (fondo)', t.areaSolaio, 'm²', 0, v.costo.casseforme);
    }
    var co2 = 0, costo = 0, area = t.areaSolaio;
    voci.forEach(function (x) { co2 += x.co2; costo += x.costo; });
    return {
      voci: voci, co2: co2, costo: costo, area: area,
      co2m2: area > 0 ? co2 / area : 0, costom2: area > 0 ? costo / area : 0,
      stoccata: p.mat === 'legno' ? t.volumeLegno * v.stoccata.densita * v.stoccata.kgCO2perKg : 0,   // CO2 immagazzinata nel legno (non sottratta)
      valori: v
    };
  };
})(typeof window !== 'undefined' ? window : this);
