/* Campo numerico accanto a ogni cursore (input type=range) dei calcolatori. Creato il 27/11/2026.
   Non cambia ne' le formule ne' gli script delle pagine: il cursore resta quello di prima.
   - Scrivendo nel campo si assegna il valore al cursore e si lancia l'evento 'input' del cursore (come se lo si fosse trascinato).
   - Mentre si scrive il valore passa al cursore solo se e' dentro la scala (min e max del cursore, letti ogni volta perche' alcuni
     cursori cambiano scala); con Invio o uscendo dal campo il valore e' riportato al limite piu' vicino e al passo del cursore.
   - Il campo segue il cursore anche quando e' la pagina a cambiarlo (preset, cambio di materiale, cursori ricostruiti...).
   - I cursori che hanno gia' un campo numerico nella stessa riga (Lezione 2: G1, G2, Q1, Q2) restano come sono.
   - Il campo prende il posto del valore scritto (l'elemento output resta nel documento, nascosto: le pagine continuano ad aggiornarlo). */
(function () {
  'use strict';

  function decimali(passo) {
    var s = String(passo), i = s.indexOf('.');
    return i < 0 ? 0 : s.length - i - 1;
  }
  function formato(r) {
    var p = parseFloat(r.step);
    return isNaN(p) ? String(r.value) : (+r.value).toFixed(decimali(r.step));
  }
  function etichetta(r) {
    var l = r.id ? document.querySelector('label[for="' + r.id + '"]') : null;
    var t = l ? l.textContent.replace(/\s+/g, ' ').trim() : (r.getAttribute('aria-label') || r.id);
    return t + (document.documentElement.lang === 'en' ? ', numeric value' : ', valore numerico');
  }
  function imposta(el, nome, valore) { if (el.getAttribute(nome) !== valore) el.setAttribute(nome, valore); }   // niente scritture inutili (evita cicli con l'observer)

  function mostra(r, n, forza) {
    imposta(n, 'min', r.min); imposta(n, 'max', r.max); imposta(n, 'step', r.step);
    if (n.disabled !== r.disabled) n.disabled = r.disabled;       // anche qui: niente scritture inutili
    imposta(n, 'aria-label', etichetta(r));
    if (forza || document.activeElement !== n) { var f = formato(r); if (n.value !== f) n.value = f; }   // mentre si scrive non si riscrive il campo (salvo conferma con Invio)
  }

  function applica(r, v, conChange) {
    var prima = r.value;
    r.value = v;                                                  // il cursore arrotonda al passo e si ferma agli estremi
    if (r.value !== prima) {
      r.dispatchEvent(new Event('input', { bubbles: true }));
      if (conChange) r.dispatchEvent(new Event('change', { bubbles: true }));
      sincronizza();                                              // gli altri campi seguono subito (es. campate uguali)
    }
  }

  function attacca(r) {
    var campo = r.closest('.campo');
    if (!campo || campo.querySelector('input[type=number]')) { r.cursoreNum = false; return; }
    var n = document.createElement('input');
    n.type = 'number'; n.className = 'cursore-num'; n.setAttribute('inputmode', 'decimal');
    if (r.id) n.id = r.id + '_num';
    n.addEventListener('input', function (e) {
      e.stopPropagation();                                        // gli script delle pagine ascoltano solo il cursore
      var v = parseFloat(n.value);
      if (isNaN(v) || v < +r.min || v > +r.max) return;           // fuori scala: si sta ancora scrivendo
      applica(r, v, false);
    });
    n.addEventListener('change', function (e) {
      e.stopPropagation();
      var v = parseFloat(n.value);
      if (!isNaN(v)) applica(r, Math.min(+r.max, Math.max(+r.min, v)), true);
      mostra(r, n, true);                                         // il campo mostra il valore effettivo (limite, passo); se vuoto o non numerico torna al cursore
    });
    n.addEventListener('blur', function () { mostra(r, n); });
    var o = campo.querySelector('output');
    if (o) { o.hidden = true; o.parentNode.insertBefore(n, o.nextSibling); } else r.parentNode.insertBefore(n, r);
    r.cursoreNum = n;
  }

  function sincronizza() {
    var rr = document.querySelectorAll('input[type=range]');
    for (var i = 0; i < rr.length; i++) {
      var r = rr[i];
      if (r.cursoreNum === undefined) attacca(r);
      if (r.cursoreNum) mostra(r, r.cursoreNum);
    }
  }

  sincronizza();
  // dopo gli script delle pagine (fase di risalita) e a ogni modifica del documento: lo script della pagina ha gia' finito di cambiare i cursori
  ['input', 'change', 'click', 'keyup'].forEach(function (ev) { document.addEventListener(ev, sincronizza, false); });
  if (window.MutationObserver) {
    new MutationObserver(sincronizza).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['min', 'max', 'step', 'disabled'] });
  }
  window.addEventListener('load', sincronizza);
})();
