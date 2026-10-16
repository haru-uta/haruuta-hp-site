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
  function render(data, live) {
    if (!data || !data.ok || !data.items) return false;
    list.textContent = '';
    data.items.forEach(function (p) {
      var li = document.createElement('li');
      var n = document.createElement('span'); n.className = 'p-name'; n.textContent = p.name; li.appendChild(n);
      if (p.kind) { var k = document.createElement('span'); k.className = 'p-kind'; k.textContent = p.kind; li.appendChild(k); }
      var a = document.createElement('span'); a.className = 'p-addr'; a.textContent = (p.zip ? '〒' + p.zip + ' ' : '') + p.address; li.appendChild(a);
      list.appendChild(li);
    });
    meta.textContent = '';
    var c = document.createElement('span'); c.textContent = '掲載 ' + data.items.length + ' 機関'; meta.appendChild(c);
    var u = document.createElement('span'); u.textContent = '最終更新：' + fmtDate(data.updated); meta.appendChild(u);
    list.setAttribute('data-live', live ? '1' : '0');
    return true;
  }
  function fallback() {
    return fetch('data/partners.json', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) { render(d, false); })
      .catch(function () { meta.textContent = '一覧を読み込めませんでした。お手数ですがお電話でお問い合わせください。'; });
  }
  var timer = setTimeout(function () { if (!list.children.length) fallback(); }, 6000);
  fetch(GAS_URL, { cache: 'no-store' }).then(function (r) { return r.json(); })
    .then(function (d) { clearTimeout(timer); if (!render(d, true)) fallback(); })
    .catch(function () { clearTimeout(timer); fallback(); });
})();
