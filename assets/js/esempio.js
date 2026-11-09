/* Modulo Struttura e Architettura - riquadro "Esempio della lezione".
   Carica i dati dell'esempio svolto delle slide e confronta, voce per voce, i risultati della pagina con quelli scritti sulle slide.
   Si apre anche da URL: pagina.html?esempio=1 (oppure =2, =3... se la lezione ha piu' esempi): i QR delle slide puntano qui.

   RTE.avvia({
     contenitore: 'esempio',                 // id di un <section> vuoto
     descrizione: 'testo breve',
     prima: function (valori) {},            // facoltativa: prepara la pagina prima di scrivere i valori (es. costruire i cursori)
     dopo: function (valori) {},             // facoltativa: dopo averli scritti (es. selezionare un elemento)
     campi: ['L', 'B', ...],                 // id dei campi che fanno parte dei dati (per accorgersi che l'utente li ha cambiati)
     scenari: [{ titolo, nota, valori: { id: valore, ... }, attesi: [{ e: etichetta, s: valore sulle slide, p: function () { return valore della pagina }, d: decimali, tol: 0.002 (facoltativo: tolleranza relativa) }] }]
   });
   RTE.aggiorna() va chiamata alla fine di ogni ricalcolo della pagina. */
(function (root) {
  'use strict';
  var RT = root.RT, F = RT.fmt, E = root.RTE = {};
  var cfg = null, attivo = 0, firmaCarica = '', box = null, EN = false;
  try { EN = localStorage.getItem('lang') === 'en'; } catch (e) {}
  function t(it, en) { return EN ? en : it; }

  function $(id) { return document.getElementById(id); }
  function firma() { return cfg.campi.map(function (id) { var el = $(id); return el ? (el.type === 'checkbox' ? el.checked : el.value) : ''; }).join('|'); }
  function fmt(x, d) { return typeof x === 'number' ? F(x, d === undefined ? 1 : d) : String(x); }
  function uguale(a, b, d) {
    if (typeof a === 'number' && typeof b === 'number') { var t = Math.pow(10, -(d === undefined ? 1 : d)) / 2 + 1e-9; return Math.abs(a - b) <= t; }
    return String(a).trim() === String(b).trim();
  }

  function imposta(valori) {
    if (cfg.prima) cfg.prima(valori);
    Object.keys(valori).forEach(function (id) {
      var el = $(id); if (!el) return;
      if (el.type === 'checkbox') el.checked = !!valori[id]; else el.value = valori[id];
    });
    Object.keys(valori).forEach(function (id) {
      var el = $(id); if (!el) return;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      if (el.tagName === 'SELECT' || el.type === 'checkbox') el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    if (cfg.dopo) cfg.dopo(valori);
  }

  E.scenarioAttivo = function () { return cfg ? cfg.scenari[attivo] : null; };

  E.carica = function (i) {
    attivo = Math.max(0, Math.min(cfg.scenari.length - 1, i));
    imposta(cfg.scenari[attivo].valori);
    firmaCarica = firma();
    E.aggiorna();
  };

  function costruisci() {
    var s = cfg.scenari, h = '<h2>' + t('Esempio della lezione', 'Lesson example') + '</h2><p>' + (EN && cfg.descrizioneEn ? cfg.descrizioneEn : cfg.descrizione) + '</p><div class="azioni">' +
      '<button type="button" class="bottone" id="esCarica">' + t('Carica l\'esempio della lezione', 'Load the lesson example') + '</button></div>';
    if (s.length > 1) {
      h += '<div class="pillole" role="group" aria-label="' + t('Esempi della lezione', 'Lesson examples') + '">' + s.map(function (x, i) { return '<button type="button" data-es="' + i + '" aria-pressed="false">' + x.titolo + '</button>'; }).join('') + '</div>';
    }
    h += '<p class="nota" id="esNota"></p><div class="scroll"><table aria-label="' + t('Confronto con le slide', 'Comparison with the slides') + '"><thead><tr><th>' + t('Grandezza', 'Quantity') + '</th><th>' + t('Slide', 'Slides') + '</th><th>' + t('Questa pagina', 'This page') + '</th><th></th></tr></thead><tbody id="esRighe"></tbody></table></div><p class="stato" id="esStato" aria-live="polite"></p>';
    box.innerHTML = h;
    $('esCarica').addEventListener('click', function () { E.carica(s.length > 1 ? attivo : 0); });
    Array.prototype.forEach.call(box.querySelectorAll('[data-es]'), function (b) {
      b.addEventListener('click', function () { E.carica(parseInt(b.getAttribute('data-es'), 10)); });
    });
  }

  E.aggiorna = function () {
    if (!cfg || !box) return;
    var sc = cfg.scenari[attivo], modificato = firmaCarica !== '' && firma() !== firmaCarica;
    Array.prototype.forEach.call(box.querySelectorAll('[data-es]'), function (b) { b.setAttribute('aria-pressed', String(parseInt(b.getAttribute('data-es'), 10) === attivo && !modificato)); });
    $('esNota').textContent = sc.nota || '';
    if (firmaCarica === '' || modificato) {
      $('esRighe').innerHTML = '';
      $('esStato').className = 'stato';
      $('esStato').textContent = modificato ? t('Hai cambiato i dati: i risultati non sono più quelli delle slide. Premi «Carica l\'esempio della lezione» per ripartire.', 'You changed the data: the results are no longer those of the slides. Press «Load the lesson example» to start again.') : t('Premi «Carica l\'esempio della lezione» per impostare i dati delle slide e confrontare i risultati.', 'Press «Load the lesson example» to set the data of the slides and compare the results.');
      return;
    }
    var ko = [], approx = [], righe = sc.attesi.map(function (a) {
      var pag = a.p(), ok = uguale(a.s, pag, a.d), vicino = !ok && a.tol && typeof pag === 'number' && Math.abs(pag - a.s) <= a.tol * Math.abs(a.s);
      if (!ok && !vicino) ko.push(a.e); else if (vicino) approx.push(a.e);
      return '<tr><td>' + a.e + '</td><td>' + fmt(a.s, a.d) + '</td><td>' + fmt(pag, a.d) + '</td><td class="' + (ok || vicino ? 'ok' : 'ko') + '">' + (ok ? '✓' : (vicino ? '≈' : '≠')) + '</td></tr>';
    });
    $('esRighe').innerHTML = righe.join('');
    $('esStato').className = 'stato ' + (ko.length ? 'ko' : 'ok');
    $('esStato').textContent = ko.length ? t('Non coincide con le slide: ', 'It does not match the slides: ') + ko.join('; ') :
      (approx.length ? t('Coincide con le slide. Le voci con ≈ differiscono di meno dello 0,2 % perché le slide arrotondano un passaggio intermedio.', 'It matches the slides. The items marked ≈ differ by less than 0.2 % because the slides round an intermediate step.') : t('Coincide con le slide: tutti i valori sono uguali.', 'It matches the slides: all the values are the same.'));
  };

  E.avvia = function (c) {
    cfg = c; box = $(c.contenitore); if (!box) return;
    costruisci(); E.aggiorna();
    var q = null; try { q = new URLSearchParams(location.search).get('esempio'); } catch (e) {}
    if (q !== null) {
      var n = parseInt(q, 10); E.carica(isNaN(n) ? 0 : n - 1);
      if (box.scrollIntoView) setTimeout(function () { box.scrollIntoView({ block: 'start' }); }, 0);
    }
  };
})(typeof window !== 'undefined' ? window : this);
