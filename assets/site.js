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

  // トップの紹介動画（ある時だけ）。動きを減らす設定・データ節約モードの人には流さず、絵のまま。
  var hv = document.querySelector('.hero-video');
  if (hv) {
    var frame = hv.parentNode, playBtn = frame.querySelector('.hv-play'), soundBtn = frame.querySelector('.hv-sound');
    var still = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || (navigator.connection && navigator.connection.saveData);
    if (still) { frame.classList.add('hv-still'); hv.removeAttribute('autoplay'); hv.preload = 'none'; }
    else {
      var setPlay = function (playing) { playBtn.textContent = playing ? '一時停止' : (hv.ended ? 'もう一度見る' : '再生'); playBtn.setAttribute('aria-pressed', playing ? 'false' : 'true'); };
      hv.addEventListener('play', function () { setPlay(true); });
      hv.addEventListener('pause', function () { setPlay(false); });
      hv.addEventListener('ended', function () { setPlay(false); });
      hv.addEventListener('error', function () { frame.classList.add('hv-still'); }, true);
      playBtn.addEventListener('click', function () { if (hv.paused) { if (hv.ended) hv.currentTime = 0; hv.play(); } else hv.pause(); });
      soundBtn.addEventListener('click', function () {
        hv.muted = !hv.muted; soundBtn.textContent = hv.muted ? '音を出す' : '音を消す'; soundBtn.setAttribute('aria-pressed', hv.muted ? 'false' : 'true');
        if (!hv.muted && hv.paused) { if (hv.ended) hv.currentTime = 0; hv.play(); }
      });
      var p = hv.play(); if (p && p.catch) p.catch(function () { setPlay(false); });
    }
  }

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
    // contact.html?who=work のように来たら「どなたから」を先に選んでおく（採用ページから）
    var preWho = (location.search.match(/[?&]who=(\w+)/) || [])[1];
    var preEl = preWho && cf.querySelector('input[name=who][data-who="' + preWho + '"]');
    if (preEl) { preEl.checked = true; preEl.dispatchEvent(new Event('change', { bubbles: true })); }
    // 面談の希望日は明日以降だけ選べるようにする
    // 日本時間の「明日」（端末の時計の地域に左右されないように UTC＋9時間で数える）
    var tm = new Date(Date.now() + 9 * 3600e3 + 864e5), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    cf.querySelectorAll('.slot-d').forEach(function (d) { d.min = tm.getUTCFullYear() + '-' + pad(tm.getUTCMonth() + 1) + '-' + pad(tm.getUTCDate()); });
    var getSlots = function () {
      var out = [];
      cf.querySelectorAll('.slot').forEach(function (r) { var d = r.querySelector('.slot-d').value; if (d) out.push({ date: d, part: r.querySelector('.slot-p').value }); });
      return out;
    };
    cf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var g = function (id) { return document.getElementById(id).value; };
      var data = { who: picked('who'), name: g('c-name'), kana: g('c-kana'), email: g('c-email'), tel: g('c-tel'), kind: picked('kind'),
        message: g('c-msg'), pref: picked('pref'), time: g('c-time'), slots: getSlots(), source: picked('source'),
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
          // 通信が切れたときは届いたか分からない。送信番号は同じままなので、押し直しても記録シートで見分けて二重にしない
          errBox.textContent = (e && e.known) ? e.message : '通信が途切れ、送信できたか確かめられませんでした。もう一度「この内容で送信する」を押してください（同じ内容が二重に届かないようにしています）。\nつながらない場合は、お電話（092-410-6392）でご連絡ください。';
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
    // 似顔絵の大きさ・位置をそろえる（2026-10-17 代表「統一感がない」）。元の絵は余白も縦横比もばらばらなので、
    // 白い背景から絵の描かれた範囲を探し、その範囲が 3:4 の枠の同じ割合を占めるように白地へ描き直す。失敗したら元の絵のまま。
    var fitPortrait = function (data, done) {
      var src = new Image();
      src.onload = function () {
        try {
          var W = src.naturalWidth, H = src.naturalHeight, k = Math.min(1, 240 / Math.max(W, H));
          var sw = Math.max(1, Math.round(W * k)), sh = Math.max(1, Math.round(H * k));
          var c = document.createElement('canvas'); c.width = sw; c.height = sh;
          var g = c.getContext('2d'); g.drawImage(src, 0, 0, sw, sh);
          var px = g.getImageData(0, 0, sw, sh).data, x0 = sw, y0 = sh, x1 = -1, y1 = -1;
          for (var y = 0; y < sh; y++) for (var x = 0; x < sw; x++) {
            var i = (y * sw + x) * 4;
            if (px[i + 3] > 40 && (px[i] < 225 || px[i + 1] < 225 || px[i + 2] < 225)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          }
          if (x1 < 0) return done(data);
          var bx = x0 / k, by = y0 / k, bw = (x1 - x0 + 1) / k, bh = (y1 - y0 + 1) / k;
          var OW = 600, OH = 800, s = Math.min(OH * 0.80 / bh, OW * 0.86 / bw);
          var o = document.createElement('canvas'); o.width = OW; o.height = OH;
          var og = o.getContext('2d'); og.fillStyle = '#fff'; og.fillRect(0, 0, OW, OH);
          var dw = bw * s, dh = bh * s;
          og.drawImage(src, bx, by, bw, bh, (OW - dw) / 2, OH * 0.12, dw, dh);
          done(o.toDataURL('image/jpeg', 0.9));
        } catch (e) { done(data); }
      };
      src.onerror = function () { done(data); };
      src.src = data;
    };
    var DEPT_TITLE ={ '代表': '', '看護': '看護師（准看護師を含む）', 'リハビリ': 'リハビリ（作業療法士）', '事務': '事務' };
    fetch(SURL + '?type=staff', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok || !d.items || !d.items.length) throw new Error('empty');
      intro.textContent = d.intro || '';
      var groups = {};
      d.items.forEach(function (p) { (groups[p.dept] = groups[p.dept] || []).push(p); });
      // 資格ごとの人数（2026-10-18 代表。シートの「資格」の列から自動で数える。職種は数えない）
      // ページの上に出すのは「資格の一覧」でチェックした資格だけ（2026-10-18 代表。関係のない資格も書くことがあるため）
      var qn = {}, qorder = (d.featured || []).slice();
      qorder.forEach(function (q) { qn[q] = 0; });
      d.items.forEach(function (p) { (p.quals || []).forEach(function (q) { if (q in qn) qn[q]++; }); });
      qorder = qorder.filter(function (q) { return qn[q] > 0; });
      if (qorder.length) {
        var qs = mk('section', 'staff-quals');
        qs.appendChild(mk('h2', null, 'スタッフの資格'));
        var ql = mk('ul', 'qual-list');
        qorder.forEach(function (q) { var li = mk('li', null, q); li.appendChild(mk('b', null, String(qn[q]))); li.appendChild(document.createTextNode('名')); ql.appendChild(li); });
        qs.appendChild(ql);
        staffBox.appendChild(qs);
      }
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
          if (p.quals && p.quals.length) { var tg = mk('span', 'quals'); p.quals.forEach(function (q) { tg.appendChild(mk('span', null, q)); }); card.appendChild(tg); }
          if (p.comment) card.appendChild(mk('p', 'cm', p.comment));
          grid.appendChild(card);
          if (p.photo) fetch(SURL + '?photo=' + encodeURIComponent(p.photo)).then(function (r) { return r.json(); }).then(function (x) {
            if (x && x.ok && /^data:image\//.test(x.data)) fitPortrait(x.data, function (src) { var im = mk('img'); im.alt = p.name + 'さんの似顔絵'; im.src = src; ph.appendChild(im); });
          }).catch(function () {});
        });
        sec.appendChild(grid);
        staffBox.appendChild(sec);
      });
    }).catch(function () { intro.textContent = 'スタッフ紹介を読み込めませんでした。時間をおいて、もう一度お試しください。'; });
  }

  // 新規の受け入れ状況（2026-10-18。トップ・お問い合わせ・医療機関の方へ）。シートで「HPに出さない」・読めないときは何も出さない
  var accSlots = document.querySelectorAll('.acc-slot');
  if (accSlots.length) {
    var mkA = function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    fetch(accSlots[0].getAttribute('data-src') + '?type=accept', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (a) {
      if (!a || !a.ok || !/^(ok|adj|stop)$/.test(a.key)) return;
      accSlots.forEach(function (slot) {
        var box = mkA('div', 'acc acc-' + a.key);
        box.appendChild(mkA('span', 'dot'));
        var tx = mkA('div');
        tx.appendChild(mkA('b', null, a.title));
        tx.appendChild(document.createTextNode(a.sub || ''));
        if (a.note) tx.appendChild(mkA('span', 'acc-note', a.note));
        if (a.updated) tx.appendChild(mkA('small', null, a.updated + ' 更新'));
        box.appendChild(tx);
        slot.appendChild(box);
      });
    }).catch(function () {});
  }

  // ご利用の流れと料金（flow-price.html だけ）: 受給者証のタブと、自立支援医療の目安
  var tabs = document.querySelectorAll('.fp-tabs [role="tab"]');
  if (tabs.length) {
    var pick = function (t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) t.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); pick(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  }
  var cap = document.getElementById('fp-cap'), used = document.getElementById('fp-used'), out = document.getElementById('fp-out');
  if (cap && used && out) {
    var yen = function (n) { return n.toLocaleString('ja-JP'); };
    var calc = function () {
      var c = Number(cap.value) || 0, u = Math.max(0, Number(used.value) || 0), rest = Math.max(0, c - u);
      out.innerHTML = rest === 0
        ? 'この月の訪問看護の利用料は <strong>0円</strong>'
        : 'この月の訪問看護の利用料は、多くても <strong>' + yen(rest) + '円</strong> まで';
    };
    cap.addEventListener('change', calc); used.addEventListener('input', calc); calc();
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
