// はるうた HP 共通の動き（メニュー開閉・番号コピー・連携機関一覧の読み込み）
(function () {
  var btn = document.querySelector('.menu-btn'), nav = document.getElementById('nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });
  }
  document.querySelectorAll('.copy[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy'), label = b.textContent;
      var done = function () { b.textContent = 'コピーしました'; setTimeout(function () { b.textContent = label; }, 1600); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { window.prompt('番号', t); });
      else window.prompt('番号', t);
    });
  });

  // 連携機関の掲示（renkei.html だけ）。スプレッドシート（GAS）から最新を読み、だめなら保存済みの一覧を出す。
  var list = document.getElementById('partners');
  if (!list) return;
  var GAS_URL = list.getAttribute('data-src');
  var meta = document.getElementById('partners-meta');
  function fmtDate(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? m[1] + '年' + Number(m[2]) + '月' + Number(m[3]) + '日' : ''; }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function render(data, live) {
    // 0件は「シートが途中で空になった」可能性が高いので、保存済みの一覧に任せる
    if (!data || !data.ok || !data.items || !data.items.length) return false;
    list.textContent = '';
    var groups = {}, order = (data.categories || []).slice();
    data.items.forEach(function (p) {
      var c = p.category || 'その他';
      if (!groups[c]) { groups[c] = []; if (order.indexOf(c) < 0) order.push(c); }
      groups[c].push(p);
    });
    order.forEach(function (c) {
      if (!groups[c]) return;
      var g = el('section', 'p-group');
      var h = el('h3', 'p-group-head'); h.appendChild(el('span', null, c)); h.appendChild(el('small', null, groups[c].length + ' 機関'));
      g.appendChild(h);
      var ul = el('ul', 'partners');
      groups[c].forEach(function (p) {
        var li = el('li');
        li.appendChild(el('span', 'p-name', p.name));
        if (p.kind) li.appendChild(el('span', 'p-kind', p.kind));
        li.appendChild(el('span', 'p-addr', (p.zip ? '〒' + p.zip + ' ' : '') + p.address));
        ul.appendChild(li);
      });
      g.appendChild(ul);
      list.appendChild(g);
    });
    meta.textContent = '';
    meta.appendChild(el('span', null, '掲載 ' + data.items.length + ' 機関'));
    meta.appendChild(el('span', null, '最終更新：' + fmtDate(data.updated)));
    list.setAttribute('data-live', live ? '1' : '0');
    return true;
  }
  // 最新（GAS）が出たら、それ以後は保存済みの一覧やエラー表示で上書きしない。
  var liveShown = false, fallbackStarted = false;
  function fallback() {
    if (liveShown || fallbackStarted) return;
    fallbackStarted = true;
    fetch('data/partners.json', { cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (d) { if (!liveShown) render(d, false); })
      .catch(function () { if (!liveShown && !list.children.length) meta.textContent = '一覧を読み込めませんでした。お手数ですがお電話でお問い合わせください。'; });
  }
  var timer = setTimeout(fallback, 6000);
  fetch(GAS_URL, { cache: 'no-store' }).then(function (r) { return r.json(); })
    .then(function (d) { clearTimeout(timer); if (render(d, true)) liveShown = true; else fallback(); })
    .catch(function () { clearTimeout(timer); fallback(); });
})();
