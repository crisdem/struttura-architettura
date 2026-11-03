/* Selettore di lingua IT / EN. Italiano di default; la scelta e' ricordata nel browser.
   In inglese si traducono i testi della pagina con il dizionario RT_EN (frasi e frammenti) e gli elementi con data-en. */
(function () {
  var LANG = 'it';
  try { LANG = localStorage.getItem('lang') || 'it'; } catch (e) {}
  function imposta(l) { try { localStorage.setItem('lang', l); } catch (e) {} location.reload(); }

  // selettore nel menu in alto
  var hdr = document.querySelector('header.sito .in');
  if (hdr) {
    var box = document.createElement('div'); box.className = 'lang'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Lingua / Language');
    [['it', 'IT'], ['en', 'EN']].forEach(function (x) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = x[1]; b.setAttribute('aria-pressed', LANG === x[0]);
      b.addEventListener('click', function () { if (LANG !== x[0]) imposta(x[0]); }); box.appendChild(b);
    });
    hdr.appendChild(box);
  }
  document.documentElement.lang = LANG;
  if (LANG !== 'en' || !window.RT_EN) return;

  var D = window.RT_EN, chiavi = Object.keys(D).sort(function (a, b) { return b.length - a.length; }), cache = {};
  function tr(testo) {
    var t = testo.trim(); if (!t) return testo;
    if (cache[t] !== undefined) return testo.replace(t, cache[t]);
    var r = D[t];
    if (r === undefined) {
      r = t;
      for (var i = 0; i < chiavi.length; i++) { var k = chiavi[i]; if (k.length > 2 && r.indexOf(k) >= 0) r = r.split(k).join(D[k]); }
    }
    cache[t] = r; return testo.replace(t, r);
  }
  function nodo(n) {
    if (n.nodeType === 3) {
      var p = n.parentNode; if (p && /^(SCRIPT|STYLE)$/.test(p.nodeName)) return;
      var v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v;
    } else if (n.nodeType === 1 && !/^(SCRIPT|STYLE)$/.test(n.nodeName)) {
      if (n.hasAttribute('data-en')) { if (!n.hasAttribute('data-it')) n.setAttribute('data-it', n.innerHTML); n.innerHTML = n.getAttribute('data-en'); return; }
      ['aria-label', 'alt', 'title'].forEach(function (a) { if (n.hasAttribute(a)) { var x = tr(n.getAttribute(a)); if (x !== n.getAttribute(a)) n.setAttribute(a, x); } });
      for (var c = n.firstChild; c; c = c.nextSibling) nodo(c);
    }
  }
  nodo(document.body);
  var te = document.querySelector('title'); if (te) { te.textContent = te.hasAttribute('data-en') ? te.getAttribute('data-en') : tr(te.textContent); }
  var obs = new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === 'characterData') nodo(m.target);
      else m.addedNodes.forEach(function (a) { nodo(a); });
    });
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
