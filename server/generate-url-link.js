#!/usr/bin/env node
/* ============================================================
 * 华农入口导航 · 微信 URL Link（B 方案）生成脚本
 * ------------------------------------------------------------
 * 作用：调用微信官方接口，把「小程序」变成一条可以在网页上点的短链
 *      （形如 https://wxaurl.cn/xxxxxxxx），写进 data/url-links.js。
 *
 * 用法（需要 Node 18+）：
 *   1) 复制 server/url-links.config.example.json 为 server/url-links.config.json
 *   2) 在里面填小程序管理员给你的 appid / secret（每个人的密钥都不一样，别外传）
 *   3) node server/generate-url-link.js
 *      只生成其中一个：node server/generate-url-link.js mp-zijing-chuxing
 *
 * 注意：AppSecret 属于小程序管理员，本站（个人导航站）拿不到别人的。
 *      也就是说：这三个小程序只有运营方才能生成链接给你。
 *
 * ⚠️ 真实调用的接口（微信官方文档）：
 *      POST https://api.weixin.qq.com/cgi-bin/stable_token
 *      POST https://api.weixin.qq.com/wxa/generate_urllink?access_token=...
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(__dirname, 'url-links.config.json');
const CACHE_PATH = path.join(__dirname, '.url-links.cache.json');
const OUT_PATH = path.join(ROOT, 'data', 'url-links.js');

const WX_ERRORS = {
  40002: '该小程序没有生成 URL Link 的权限（微信规定：只对「国内非个人主体」小程序开放）。',
  40013: 'AppID 不合法，检查是不是填错了。',
  40125: 'AppSecret 不正确。',
  40164: '调用方 IP 不在小程序的 IP 白名单里：去微信公众平台 → 开发管理 → 开发设置 → IP 白名单，把这台机器的公网 IP 加进去。',
  42001: 'access_token 已过期，重新跑一次脚本即可。',
  85407: 'no scheme permission —— 该小程序未开通生成 URL Link / Scheme 的权限。',
  85408: '生成次数已用完（每个小程序每天有上限）。',
  85409: '频率过快，稍后再试。'
};

function log(...a) { console.log(...a); }
function fail(msg) { console.error('\n❌ ' + msg); process.exit(1); }

function readJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { return fallback; }
}

async function postJSON(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  return r.json();
}

function explain(err) {
  const code = err && err.errcode;
  const hint = WX_ERRORS[code] || '微信返回了未预期的错误。';
  return 'errcode=' + code + ' errmsg=' + (err && err.errmsg) + '\n   ↳ ' + hint;
}

/* access_token 用稳定版接口（stable_token），支持多实例，不会被别的程序顶掉 */
async function getAccessToken(appid, secret) {
  const j = await postJSON('https://api.weixin.qq.com/cgi-bin/stable_token', {
    grant_type: 'client_credential',
    appid, secret
  });
  if (!j.access_token) throw new Error(explain(j));
  return j.access_token;
}

async function makeUrlLink(token, mp, days) {
  const now = Math.floor(Date.now() / 1000);
  const j = await postJSON(
    'https://api.weixin.qq.com/wxa/generate_urllink?access_token=' + encodeURIComponent(token),
    {
      path: mp.path || '',
      query: mp.query || '',
      expire_type: 1,
      expire_time: now + days * 24 * 3600,
      env_version: mp.env_version || 'release'
    }
  );
  if (!j.url_link) throw new Error(explain(j));
  return j.url_link;
}

function writeOutput(links) {
  const ids = Object.keys(links).sort();
  const lines = ids.map(function (id) {
    const v = links[id];
    return "  '" + id + "': { url: " + JSON.stringify(v.url) +
      ", expire: " + JSON.stringify(v.expire) + " }";
  });
  const body = [
    '/* ============================================================',
    ' * 华农入口导航 · 微信 URL Link（B 方案）生成结果',
    ' * ------------------------------------------------------------',
    ' * 这个文件由 server/generate-url-link.js 自动生成，别手改。',
    ' * 生成时间：' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    ' * 链接有效期最长 30 天，过期后重新跑一次脚本即可。',
    ' * ============================================================ */',
    'window.SCAU_URL_LINKS = {',
    lines.join(',\n'),
    '};',
    ''
  ].join('\n');
  fs.writeFileSync(OUT_PATH, body, 'utf8');
}

(async function main() {
  const argv = process.argv.slice(2);
  const only = argv.filter(function (a) { return !a.startsWith('--'); });
  const dryRun = argv.includes('--dry-run');

  if (typeof fetch !== 'function') fail('需要 Node 18 或更高版本（现在这个 Node 没有 fetch）。');

  const cfg = readJSON(CONFIG_PATH, null);
  if (!cfg) fail('读不到 ' + CONFIG_PATH + '\n   请复制 server/url-links.config.example.json 改成 server/url-links.config.json 再填内容。');

  const days = Math.min(Number(cfg.expireDays) || 30, 30);
  const list = (cfg.miniprograms || []).filter(function (m) {
    return !only.length || only.indexOf(m.id) > -1;
  });
  if (!list.length) fail('配置里没有匹配的小程序条目。');

  const cache = readJSON(CACHE_PATH, {});
  let ok = 0, skip = 0, bad = 0;

  for (const mp of list) {
    if (!mp.appid || !mp.secret) {
      skip++;
      log('⏭  ' + (mp.name || mp.id) + '：没填 appid/secret，跳过。');
      continue;
    }
    try {
      log('⏳ ' + (mp.name || mp.id) + '：正在获取 access_token …');
      const token = await getAccessToken(mp.appid, mp.secret);
      log('⏳ ' + (mp.name || mp.id) + '：正在生成 URL Link …');
      const url = await makeUrlLink(token, mp, days);
      const expire = new Date(Date.now() + days * 24 * 3600 * 1000)
        .toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
      cache[mp.id] = { url, expire, name: mp.name || '', generatedAt: new Date().toISOString() };
      ok++;
      log('✅ ' + (mp.name || mp.id) + ' → ' + url + '   （有效期至 ' + expire + '）');
    } catch (e) {
      bad++;
      log('❌ ' + (mp.name || mp.id) + ' 失败：' + String(e.message || e));
    }
    await new Promise(function (r) { setTimeout(r, 300); });   // 温柔一点，别撞频率限制
  }

  if (dryRun) {
    log('\n（--dry-run：没有写入 data/url-links.js）');
  } else if (Object.keys(cache).length) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
    writeOutput(cache);
    log('\n📄 已写入 data/url-links.js（共 ' + Object.keys(cache).length + ' 条）');
  }

  log('\n汇总：成功 ' + ok + '，跳过 ' + skip + '，失败 ' + bad + '。');
  if (ok) log('下一步：刷新页面，小程序卡片上就会出现「📲 打开小程序」按钮（手机点开才有效）。');
  process.exit(bad && !ok ? 1 : 0);
})();

