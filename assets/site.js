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

  // お問い合わせ（contact.html だけ）。GAS の doPost へ送り、メールで届く。
  var cf = document.getElementById('contact-form');
  if (cf) {
    var ticket = '', SRC = cf.getAttribute('data-src');
    var newId = function () { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random().toString(36).slice(2, 12); };
    var requestId = newId();
    var getTicket = function () { return fetch(SRC + '?type=form', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (x) { if (x && x.ok) ticket = x.ticket; }).catch(function () {}); };
    getTicket();
    var errBox = document.getElementById('c-error'), sub = document.getElementById('c-submit');
    var msgEl = document.getElementById('c-msg'), countEl = document.getElementById('c-count'), leftEl = document.getElementById('c-left');
    var exBox = document.getElementById('c-ex'), exChips = document.getElementById('c-ex-chips');
    var picked = function (n) { var x = cf.querySelector('input[name=' + n + ']:checked'); return x ? x.value : ''; };
    // 書き出しの例文（どなたからのご相談かで変える）。押すと内容の欄に足される。
    var EX = {
      self: [['まず話を聞いてみたい', '訪問看護がどんなものか、まずは話を聞いてみたいです。\n今の状況：'],
             ['料金を知りたい', '利用した場合の料金の目安を知りたいです。\n自立支援医療は（使っている／使っていない／わからない）です。'],
             ['退院後の生活が不安', 'もうすぐ退院の予定ですが、家に戻ってからの生活が不安です。\n退院の予定：']],
      family: [['家族のことで相談したい', '家族のことで相談させてください。\n本人は（通院している／通院していない）です。\n困っていること：'],
               ['本人に内緒で相談したい', 'まだ本人には話していませんが、家族として相談だけしてみたいです。'],
               ['料金を知りたい', '利用した場合の料金の目安を知りたいです。']],
      pro: [['利用者さんを紹介したい', 'ご紹介したい方がいます。一度お電話でご相談させてください。\n所属・お名前：\nご連絡のつきやすい時間：'],
            ['空き状況を知りたい', '新しく訪問をお願いできるか、空き状況を教えてください。\n地域：']],
      work: [['見学してみたい', '働くことに興味があります。見学や面談をお願いできますか。\n職種：（看護師／准看護師／作業療法士／その他）'],
             ['働き方を知りたい', '勤務時間や働き方について教えてください。\n職種：']]
    };
    var WHO_KEY = {};
    cf.querySelectorAll('input[name=who]').forEach(function (r) { WHO_KEY[r.value] = r.getAttribute('data-who'); });
    var showEx = function () {
      var list = EX[WHO_KEY[picked('who')]] || [];
      exChips.textContent = '';
      list.forEach(function (x) {
        var b = document.createElement('button'); b.type = 'button'; b.textContent = x[0];
        b.addEventListener('click', function () {
          msgEl.value = msgEl.value.trim() ? msgEl.value.replace(/\s+$/, '') + '\n\n' + x[1] : x[1];
          msgEl.focus(); msgEl.setSelectionRange(msgEl.value.length, msgEl.value.length); update();
        });
        exChips.appendChild(b);
      });
      exBox.hidden = !list.length;
    };
    // 送信ボタンの横に「あと◯項目」を出す
    var update = function () {
      countEl.textContent = msgEl.value.length + ' / 4000';
      var v = function (id) { return document.getElementById(id).value.trim(); };
      var need = [picked('who'), picked('kind'), v('c-msg'), v('c-name'), v('c-kana'), v('c-email'), v('c-tel'), document.getElementById('c-agree').checked ? 'x' : ''];
      var left = need.filter(function (x) { return !x; }).length;
      leftEl.textContent = left ? 'あと ' + left + ' 項目で送れます' : '送信の準備ができました';
      leftEl.className = 'f-left' + (left ? '' : ' ready');
    };
    cf.addEventListener('input', update);
    cf.addEventListener('change', function (e) {
      if (e.target.name === 'who') {
        showEx();
        // はたらきたい方は「採用について」を先に選んでおく（あとで変えられる）
        if (WHO_KEY[e.target.value] === 'work' && !picked('kind')) cf.querySelector('input[name=kind][value="採用について"]').checked = true;
      }
      update();
    });
    update();
    cf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var g = function (id) { return document.getElementById(id).value; };
      var data = { who: picked('who'), name: g('c-name'), kana: g('c-kana'), email: g('c-email'), tel: g('c-tel'), kind: picked('kind'),
        message: g('c-msg'), pref: picked('pref'), time: g('c-time'), source: picked('source'),
        website: g('c-web'), agree: document.getElementById('c-agree').checked, ticket: ticket, requestId: requestId };
      var miss = [];
      if (!data.who) miss.push('どなたからのご相談かを選んでください');
      if (!data.name.trim()) miss.push('お名前を入れてください');
      if (!data.kana.trim()) miss.push('ふりがなを入れてください');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) miss.push('メールアドレスの形を確かめてください');
      if (data.tel.replace(/\D/g, '').length < 10) miss.push('電話番号を確かめてください');
      if (!data.kind) miss.push('お問い合わせの種類を選んでください');
      if (!data.message.trim()) miss.push('お問い合わせ内容を入れてください');
      if (!data.agree) miss.push('個人情報保護方針への同意が必要です');
      if (miss.length) { errBox.textContent = miss.join('\n'); errBox.hidden = false; return; }
      errBox.hidden = true; sub.disabled = true; sub.textContent = '送信しています…';
      fetch(SRC, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && res.ok) { cf.reset(); cf.hidden = true; document.getElementById('contact-done').hidden = false; document.getElementById('form').scrollIntoView(); return; }
          var msg = (res && res.errors || []).join('\n') || '送信できませんでした';
          if (/開き直して|もう一度/.test(msg)) getTicket();
          var known = new Error(msg); known.known = true; throw known;
        })
        .catch(function (e) {
          // 通信が切れたときは届いたか分からない。送信番号は同じままなので、押し直しても二重には届かない
          errBox.textContent = (e && e.known) ? e.message : '通信が途切れ、送信できたか確かめられませんでした。もう一度「この内容で送信する」を押してください（二重に届くことはありません）。\nつながらない場合は、お電話（092-410-6392）でご連絡ください。';
          errBox.hidden = false; sub.disabled = false; sub.textContent = 'この内容で送信する';
        });
    });
  }

  // よくある質問の絞り込み（qa.html だけ）
  var qbox = document.getElementById('qa-q');
  if (qbox) {
    var count = document.getElementById('qa-count');
    qbox.addEventListener('input', function () {
      var w = qbox.value.trim(), shown = 0;
      document.querySelectorAll('.qa-group').forEach(function (g) {
        var any = false;
        g.querySelectorAll('details.qa').forEach(function (d) {
          var hit = !w || d.textContent.indexOf(w) >= 0;
          d.hidden = !hit; if (hit) { any = true; shown++; if (w) d.open = true; }
        });
        g.hidden = !any;
      });
      count.textContent = w ? '「' + w + '」に合う質問 ' + shown + ' 件' : shown + ' 件の質問';
    });
  }

  // スタッフ紹介（staff.html だけ）。名前と似顔絵はスプレッドシートとドライブにあり、GAS から読む。
  var staffBox = document.getElementById('staff');
  if (staffBox) {
    var SURL = staffBox.getAttribute('data-src');
    var intro = document.getElementById('staff-intro');
    var mk = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    var DEPT_TITLE = { '代表': '', '看護': '看護師', 'リハビリ': 'リハビリ（作業療法士）', '事務': '事務' };
    fetch(SURL + '?type=staff', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok || !d.items || !d.items.length) throw new Error('empty');
      intro.textContent = d.intro || '';
      var groups = {};
      d.items.forEach(function (p) { (groups[p.dept] = groups[p.dept] || []).push(p); });
      (d.depts || Object.keys(groups)).forEach(function (dep) {
        if (!groups[dep]) return;
        var sec = mk('section', 'staff-group');
        if (DEPT_TITLE[dep]) sec.appendChild(mk('h2', null, DEPT_TITLE[dep]));
        var grid = mk('div', 'staff-grid');
        groups[dep].forEach(function (p) {
          var card = mk('article', 'staff-card');
          var ph = mk('div', 'ph'); card.appendChild(ph);
          card.appendChild(mk('span', 'role', p.role));
          card.appendChild(mk('span', 'nm', p.name));
          if (p.roma) card.appendChild(mk('span', 'rm', p.roma));
          if (p.comment) card.appendChild(mk('p', 'cm', p.comment));
          grid.appendChild(card);
          if (p.photo) fetch(SURL + '?photo=' + encodeURIComponent(p.photo)).then(function (r) { return r.json(); }).then(function (x) {
            if (x && x.ok && /^data:image\//.test(x.data)) { var im = mk('img'); im.alt = p.name + 'さんの似顔絵'; im.src = x.data; ph.appendChild(im); }
          }).catch(function () {});
        });
        sec.appendChild(grid);
        staffBox.appendChild(sec);
      });
    }).catch(function () { intro.textContent = 'スタッフ紹介を読み込めませんでした。時間をおいて、もう一度お試しください。'; });
  }

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
