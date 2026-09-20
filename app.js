/* ============================================================
 * 华农入口导航 · 交互逻辑
 * ============================================================ */
(function () {
  'use strict';

  var DATA = window.SCAU_DATA || { sites: [], categories: [], miniprograms: [] };
  var SITES = DATA.sites || [];
  var MPS = DATA.miniprograms || [];
  var CATS = DATA.categories || [];
  var SSO = DATA.sso || {};
  var SSO_KEY = 'scau-nav-sso';
  var ssoOn = false;
  try { ssoOn = localStorage.getItem(SSO_KEY) === '1'; } catch (e) { /* 隐私模式忽略 */ }

  var FAV_KEY = 'scau-nav-favs';
  var THEME_KEY = 'scau-nav-theme';

  // 图标映射（按 id 取，取不到就用分类图标）
  var ICONS = {
    portal: '🏛️', ehall: '🗂️', jwnew: '📚', jwc: '📢', jwold: '🕰️', thesis: '📝',
    lib: '📖', mail: '✉️', yjsy: '🎓', 'yjsy-mooc': '🎥',
    cwc: '💰', job: '💼', zsb: '🎯', alumni: '🤝',
    vpn: '🛡️', home: '🏫'
  };
  var CAT_ICON = {};
  CATS.forEach(function (c) { CAT_ICON[c.id] = c.icon; });

  var state = { q: '', cat: 'all' };

  var favs = loadJSON(FAV_KEY, []);
  if (!Array.isArray(favs)) favs = [];
  var validFavIds = {};
  SITES.concat(MPS).forEach(function (x) { validFavIds[x.id] = true; });
  var cleanedFavs = favs.filter(function (id, i) { return validFavIds[id] && favs.indexOf(id) === i; });
  if (cleanedFavs.length !== favs.length) saveJSON(FAV_KEY, cleanedFavs);
  favs = cleanedFavs;

  /* ---------------- 工具 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* 隐私模式忽略 */ }
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/[\s\-_/·、，。()（）]/g, '');
  }

  function isFav(id) { return favs.indexOf(id) > -1; }

  function updateFavCount() {
    var badge = $('#fav-count');
    if (!badge) return;
    badge.textContent = String(favs.length);
    badge.hidden = !favs.length;
    var btn = $('#btn-favs');
    if (btn) btn.setAttribute('aria-label', favs.length ? '打开我的收藏，已有 ' + favs.length + ' 个' : '打开我的收藏');
  }

  /* ---------------- 微信 URL Link（B 方案） ----------------
   * data/url-links.js 里存的是 { 'mp-xxx': 'https://wxaurl.cn/xxx' }，
   * 也兼容 { 'mp-xxx': { url, expire } } 这种写法。没有就是空字符串。
   */
  var LINKS = window.SCAU_URL_LINKS || {};
  function urlLink(id) {
    var v = LINKS[id];
    if (!v) return '';
    var u = (typeof v === 'string') ? v : (v.url || '');
    return /^https?:\/\//i.test(String(u)) ? String(u) : '';
  }
  function isMobile() {
    return /Android|iPhone|iPad|iPod|HarmonyOS|Mobile|MicroMessenger/i.test(navigator.userAgent || '');
  }

  // 拼统一认证登录地址：cas.scau.edu.cn 会带上 service 参数，登录后跳回目标系统
  function ssoUrl(service) {
    var base = SSO.loginUrl || 'https://cas.scau.edu.cn/lyuapServer/login';
    return base + '?service=' + encodeURIComponent(service);
  }

  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.hidden = true; }, 1800);
  }

  function copyText(text, okMsg) {
    var done = function () { toast(okMsg || '已复制'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); }
    catch (e) { toast('复制失败，请手动选中小程序名称'); }
    document.body.removeChild(ta);
  }

  /* ---------------- 主题 ---------------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#0e1512' : '#00693e');
  }
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  })();

  $('#btn-theme').addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });

  /* ---------------- 高频入口 ---------------- */
  function renderQuick() {
    var hot = SITES.filter(function (s) { return s.hot; });
    $('#quick').innerHTML = hot.map(function (s) {
      return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
        '<span class="q-ico">' + (ICONS[s.id] || '🔗') + '</span>' + esc(s.name) + '</a>';
    }).join('');
  }

  /* ---------------- 分类筛选 ---------------- */
  function renderFilters() {
    var items = [{ id: 'all', name: '全部', icon: '✦' }]
      .concat(CATS.map(function (c) { return { id: c.id, name: c.name, icon: c.icon }; }));
    if (MPS.length) items.push({ id: 'mp', name: '小程序', icon: '📱' });

    $('#filters').innerHTML = items.map(function (c) {
      var sel = state.cat === c.id;
      return '<button class="chip" role="tab" aria-selected="' + sel + '" data-cat="' + esc(c.id) + '">' +
        c.icon + ' ' + esc(c.name) + '</button>';
    }).join('');

    $all('#filters .chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.cat = btn.getAttribute('data-cat');
        renderFilters();
        render();
      });
    });
  }

  /* ---------------- 匹配 ---------------- */
  function matchSite(s) {
    if (state.cat !== 'all' && state.cat !== 'mp' && s.cat !== state.cat) return false;
    if (state.cat === 'mp') return false;
    if (!state.q) return true;
    var cat = CATS.filter(function (c) { return c.id === s.cat; })[0] || {};
    var hay = norm([s.name, s.desc, s.keywords, (s.tags || []).join(' '), cat.name, s.url].join(' '));
    return hay.indexOf(norm(state.q)) > -1;
  }
  function matchMP(m) {
    if (state.cat !== 'all' && state.cat !== 'mp') return false;
    if (!state.q) return true;
    var hay = norm([m.name, m.desc, m.keywords, m.path, m.username].join(' '));
    return hay.indexOf(norm(state.q)) > -1;
  }

  /* ---------------- 站点卡片 ---------------- */
  function siteCard(s) {
    var tags = (s.tags || []).map(function (t) {
      return '<span class="tag' + (t === '常用' ? ' hot' : '') + '">' + esc(t) + '</span>';
    }).join('');
    if (s.status === 'todo') tags += '<span class="tag todo">待核实</span>';
    if (s.casService) tags += '<span class="tag sso">' + (ssoOn ? '免登录' : '统一认证') + '</span>';

    return '<article class="card" data-id="' + esc(s.id) + '">' +
      '<button class="star" data-star="' + esc(s.id) + '" aria-pressed="' + isFav(s.id) + '" aria-label="收藏 ' + esc(s.name) + '" title="收藏">' + (isFav(s.id) ? '★' : '☆') + '</button>' +
      '<div class="card-top">' +
        '<span class="card-ico">' + (ICONS[s.id] || CAT_ICON[s.cat] || '🔗') + '</span>' +
        '<div>' +
          '<h3 class="card-title"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a></h3>' +
          '<p class="card-desc">' + esc(s.desc) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="card-foot">' + tags + '</div>' +
      '<div class="card-btns">' +
        '<a class="card-open" href="' + esc(s.url) + '" target="_blank" rel="noopener">打开入口 →</a>' +
        (s.casService
          ? '<a class="card-open ghost" href="' + esc(ssoUrl(s.casService)) + '" target="_blank" rel="noopener" title="经学校统一认证进入，登录态有效时不再要求输密码">免登录进入</a>'
          : '') +
      '</div>' +
    '</article>';
  }

  /* ---------------- 小程序卡片 ---------------- */
  function mpCard(m) {
    var hasQR = !!(m.qrcode && String(m.qrcode).trim());
    var link = urlLink(m.id);

    var tags = '';
    if (link) tags += '<span class="tag hot">可直达</span>';
    else if (hasQR) tags += '<span class="tag hot">有小程序码</span>';
    else tags += '<span class="tag">未配直达链接</span>';
    if (m.verified === false) tags += '<span class="tag todo">待确认</span>';

    var btns = [];
    if (link) {
      btns.push('<a class="mp-btn primary" href="' + esc(link) + '" target="_blank" rel="noopener" ' +
        'title="手机上点开会唤起微信并直接进入小程序">📲 打开小程序</a>');
      btns.push('<button class="mp-btn" data-copy-link="' + esc(link) + '">复制链接</button>');
      if (hasQR) btns.push('<button class="mp-btn" data-qr="' + esc(m.id) + '">小程序码</button>');
      else btns.push('<button class="mp-btn" data-copy="' + esc(m.name) + '">复制名称</button>');
    } else {
      btns.push('<button class="mp-btn primary" data-copy="' + esc(m.name) + '">复制名称</button>');
      btns.push('<button class="mp-btn" data-qr="' + esc(m.id) + '">' + (hasQR ? '小程序码' : '怎么进入？') + '</button>');
    }

    var hint = link
      ? '<p class="mp-hint on">✅ 已配好直达链接：<b>手机上</b>点「打开小程序」会唤起微信直接进入' +
        (isMobile() ? '。' : '（当前是电脑端，点了会跳到微信的中间页，属正常现象，真正好用的是手机）。') +
        '</p>'
      : '<p class="mp-hint">还没配直达链接 —— 先用「复制名称」去微信搜索框粘贴。</p>';

    return '<article class="card mp" data-id="' + esc(m.id) + '">' +
      '<button class="star" data-star="' + esc(m.id) + '" aria-pressed="' + isFav(m.id) + '" aria-label="收藏 ' + esc(m.name) + '" title="收藏">' + (isFav(m.id) ? '★' : '☆') + '</button>' +
      '<div class="card-top">' +
        '<span class="card-ico">📱</span>' +
        '<div>' +
          '<h3 class="card-title">' + esc(m.name) + '</h3>' +
          '<p class="card-desc">' + esc(m.desc || '') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="card-foot">' + tags + '</div>' +
      '<div class="mp-actions">' + btns.join('') + '</div>' +
      hint +
    '</article>';
  }
  /* ---------------- 主渲染 ---------------- */
  function render() {
    updateFavCount();
    var sites = SITES.filter(matchSite);
    var mps = MPS.filter(matchMP);

    var showMP = mps.length && (state.cat === 'all' || state.cat === 'mp');
    $('#mp-block').hidden = !showMP;
    $('#mp-grid').innerHTML = showMP ? mps.map(mpCard).join('') : '';

    var mpStatus = $('#mp-status');
    if (mpStatus) {
      var okCount = mps.filter(function (m) { return !!urlLink(m.id); }).length;
      mpStatus.textContent = '直达链接：' + okCount + ' / ' + mps.length + ' 已配置';
      mpStatus.className = 'mp-status' + (okCount ? ' on' : '');
    }

    var showSites = sites.length && state.cat !== 'mp';
    $('#site-block').hidden = !showSites;
    $('#site-grid').innerHTML = showSites ? sites.map(siteCard).join('') : '';

    $('#empty').hidden = !!(showSites || showMP);

    bindCards();
  }

  function bindCards() {
    $all('[data-star]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-star');
        var i = favs.indexOf(id);
        var added = false;
        if (i > -1) { favs.splice(i, 1); toast('已取消收藏'); }
        else { favs.push(id); added = true; toast('已收藏，点右上角 ★ 查看收藏'); }
        saveJSON(FAV_KEY, favs);
        render();
        if (added && $('#modal-body').dataset.view === 'favs') openFavs();
      });
    });

    $all('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyText(btn.getAttribute('data-copy'), '已复制小程序名称，去微信搜索框粘贴即可');
      });
    });

    $all('[data-copy-link]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyText(btn.getAttribute('data-copy-link'), '链接已复制，发到微信里点开即可');
      });
    });

    $all('[data-qr]').forEach(function (btn) {
      btn.addEventListener('click', function () { openQR(btn.getAttribute('data-qr')); });
    });
  }

  /* ---------------- 我的收藏弹层 ---------------- */
  function openFavs() {
    var items = [];
    favs.forEach(function (id) {
      var s = SITES.filter(function (x) { return x.id === id; })[0];
      if (s) { items.push({ kind: 'site', data: s }); return; }
      var m = MPS.filter(function (x) { return x.id === id; })[0];
      if (m) items.push({ kind: 'mp', data: m });
    });

    var html = '<h3>我的收藏</h3>';
    if (!items.length) {
      html += '<p class="modal-sub">还没有收藏任何入口</p>' +
        '<div class="fav-empty"><span aria-hidden="true">☆</span>' +
        '<p>点卡片右上角的星标，就能把常用入口收进这里。</p></div>';
    } else {
      html += '<p class="modal-sub">共 ' + items.length + ' 个入口，点「打开」直接访问，点「移除」移出收藏。</p>' +
        '<ul class="fav-list">' + items.map(function (entry) {
          var kind = entry.kind;
          var item = entry.data;
          var link = kind === 'mp' ? urlLink(item.id) : item.url;
          var icon = kind === 'mp' ? '📱' : (ICONS[item.id] || CAT_ICON[item.cat] || '🔗');
          var action = link
            ? '<a class="fav-open" href="' + esc(link) + '" target="_blank" rel="noopener">打开</a>'
            : '<button class="fav-open" type="button" data-copy="' + esc(item.name) + '">复制名称</button>';
          return '<li class="fav-item">' +
            '<span class="fav-item-ico" aria-hidden="true">' + icon + '</span>' +
            '<div class="fav-item-main"><b>' + esc(item.name) + '</b><small>' +
              esc(kind === 'mp' ? '微信小程序' : (item.desc || '')) + '</small></div>' +
            '<div class="fav-item-actions">' + action +
              '<button class="fav-remove" type="button" data-unfav="' + esc(item.id) + '">移除</button>' +
            '</div>' +
          '</li>';
        }).join('') + '</ul>' +
        '<p class="fav-modal-tip">收藏保存在本机浏览器里，不会上传。</p>';
    }

    $('#modal-body').innerHTML = html;
    $('#modal-body').dataset.view = 'favs';
    $('.modal-card').classList.add('fav-modal');
    $('.modal-card').setAttribute('aria-label', '我的收藏');
    $('#modal').hidden = false;

    $all('[data-unfav]', $('#modal-body')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-unfav');
        favs = favs.filter(function (x) { return x !== id; });
        saveJSON(FAV_KEY, favs);
        toast('已移除收藏');
        render();
        openFavs();
      });
    });
    $all('[data-copy]', $('#modal-body')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        copyText(btn.getAttribute('data-copy'), '已复制小程序名称，去微信搜索框粘贴即可');
      });
    });
  }

  /* ---------------- 小程序码弹层 ---------------- */
  function openQR(id) {
    var m = MPS.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    var hasQR = !!(m.qrcode && String(m.qrcode).trim());
    var link = urlLink(m.id);
    var html = '<h3>' + esc(m.name) + '</h3>';

    if (hasQR) {
      html += '<p class="modal-sub">微信扫一扫，或长按图片识别</p>' +
        '<img src="' + esc(m.qrcode) + '" alt="' + esc(m.name) + ' 小程序码">' +
        (m.path ? '<p class="modal-path">页面路径：' + esc(m.path) + '</p>' : '') +
        '<p class="modal-tips">电脑端用手机微信「扫一扫」；手机端在微信里长按图片识别。</p>';
    } else {
      html += '<p class="modal-sub">这个小程序还没配直达链接，也还没放小程序码</p>' +
        '<p class="modal-tips" style="text-align:left">' +
        '<b>现在能用的办法：</b>点「复制名称」→ 打开微信 → 顶部搜索框粘贴 → 进入小程序。<br>' +
        '<b>想让它一键直达（B 方案）：</b>需要该小程序官方提供一条 URL Link（<code>https://wxaurl.cn/…</code>），' +
        '把它填进 <code>data/url-links.js</code> 里对应 id 的位置，卡片上就会长出「打开小程序」按钮。' +
        '注意：微信规定只有小程序自己的管理员才能生成这种链接，别人（包括本站）都生成不了。</p>' +
        '<p class="modal-tips" style="text-align:left">' +
        '<b>想加小程序码（A 方案）：</b>1. 微信里进入该小程序 → 右上角「···」→ 分享/保存小程序码到相册；' +
        '2. 图片放到 <code>assets/miniprogram/</code>；3. 在 <code>data.js</code> 里把这个条目的 ' +
        '<code>qrcode</code> 填成 <code>assets/miniprogram/文件名.png</code>，刷新即可。</p>';
    }

    if (link) {
      html += '<p class="modal-path">直达链接：<a href="' + esc(link) + '" target="_blank" rel="noopener">' +
        esc(link) + '</a></p>' +
        '<p class="modal-tips">手机点它会唤起微信直接进入小程序；电脑端会先跳到微信的中间页。</p>';
    }

    $('#modal-body').innerHTML = html;
    $('#modal-body').dataset.view = 'qr';
    $('.modal-card').classList.remove('fav-modal');
    $('.modal-card').setAttribute('aria-label', '小程序码');
    $('#modal').hidden = false;
  }

  function closeModal() { $('#modal').hidden = true; }

  $all('[data-close]').forEach(function (el) { el.addEventListener('click', closeModal); });

  /* ---------------- 搜索 ---------------- */
  var input = $('#q');
  input.addEventListener('input', function () {
    state.q = input.value.trim();
    $('#btn-clear').hidden = !state.q;
    render();
  });
  $('#btn-clear').addEventListener('click', function () {
    input.value = ''; state.q = ''; $('#btn-clear').hidden = true; input.focus(); render();
  });

  $('#btn-favs').addEventListener('click', openFavs);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); if (state.q) { $('#btn-clear').click(); } }
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
  });

  /* ---------------- 统一认证面板 ---------------- */
  function renderSso() {
    var loginA = $('#sso-login');
    var btn = $('#sso-toggle');
    var st = $('#sso-state');
    if (!loginA || !btn || !st) return;

    loginA.href = ssoUrl(SSO.portalService || 'https://portal.scau.edu.cn/shiro-cas');

    if (ssoOn) {
      btn.textContent = '取消「已登录」标记';
      st.className = 'sso-state on';
      st.innerHTML = '✅ 已标记为已登录 —— 现在点下面带「统一认证」的系统，应该不会再要密码。' +
        '如果还是被要求登录，说明这次会话过期了，重新点一次「去统一认证登录」即可。';
    } else {
      btn.textContent = '我已登录';
      st.className = 'sso-state';
      st.innerHTML = '当前状态：未登录。建议先点上面的按钮登录一次，再回来点其它系统 —— 之后它们都会免登录。' +
        '（这个标记只存在你自己的浏览器里，用来提醒你，不涉及任何账号信息。）';
    }
  }

  $('#sso-toggle').addEventListener('click', function () {
    ssoOn = !ssoOn;
    try { localStorage.setItem(SSO_KEY, ssoOn ? '1' : '0'); } catch (e) {}
    renderSso();
    render();
    toast(ssoOn ? '已标记：本次会话已登录' : '已取消登录标记');
  });

  /* ---------------- 启动 ---------------- */
  renderSso();
  $('#updated').textContent = DATA.updated || '—';
  renderQuick();
  renderFilters();
  render();
})();

