# 华农入口导航

华南农业大学学生向实用入口导航：融合门户、新版教务系统、办事大厅、图书馆、WebVPN、缴费、就业、小程序等，一个页面全部搞定。

- 前端是纯静态的：没有依赖、没有 CDN，双击 `index.html` 就能打开，也能直接部署到 GitHub Pages / Vercel / 任意静态托管。（`server/` 里那个 Node 脚本是可选的，只有想用方案 B 生成小程序直达链接时才需要跑。）
- 手机优先的响应式布局，自带搜索、分类、收藏、深浅色切换。
- 内置**统一身份认证（CAS）入口**：不在本站收密码，而是把用户送到学校自己的 `cas.scau.edu.cn`；登录一次后，融合门户、新版教务等接入统一认证的系统自动放行。
- **所有内容都在 `data.js` 里**，加一个网站 = 加一段对象，不用改 HTML。
- 顶栏用的是**华农官网原版校徽**（中英文字标 + 圆徽），浅色底显示绿色版、深色底自动换成白色版。
- 小程序板块接的是微信官方 **URL Link（B 方案）**：配好链接就能在手机上一点直达小程序，没配的自动退回「复制名称 / 小程序码」。

```
scau-nav/
├── index.html            页面结构
├── styles.css            样式（华农绿 + 紫荆粉）
├── app.js                搜索/分类/收藏/弹层逻辑
├── data.js               ← 要改的东西都在这里
├── data/
│   └── url-links.js      微信 URL Link（B 方案）结果表，可留空
├── server/
│   ├── generate-url-link.js           生成 URL Link 的 Node 脚本（可选）
│   └── url-links.config.example.json  配置模板（含 AppID/AppSecret）
├── assets/
│   ├── logo-scau-green.svg  校徽（浅色底用，取自华农官网）
│   ├── logo-scau.svg        校徽（深色底用，取自华农官网）
│   └── miniprogram/         小程序码图片放这里
└── README.md             本文件
```

---

## 一、怎么跑起来

**本地看效果**：直接双击 `index.html` 即可。

**部署上线**（三选一）：

1. **GitHub Pages**：新建仓库 → 把整个文件夹传上去 → Settings → Pages → Source 选 `main` 分支 `/root` → 得到一个 `https://用户名.github.io/仓库名/` 的网址。
2. **Vercel / Netlify**：把文件夹拖进部署页面，几十秒出网址。
3. **自己服务器 / 校园空间**：把整个文件夹丢进网站根目录即可。

> 只要以后想让"网页里点按钮直接跳小程序"，就必须用 **HTTPS + 已备案域名**（见下面方案 C）。纯展示的话，GitHub Pages 完全够用。

---

## 二、怎么添加/修改一个网站

打开 `data.js`，在 `sites: [ ... ]` 里照着现有格式加一段：

```js
{
  id: 'unique-name',      // 唯一英文 id，不能重复
  name: '校园网自助服务',   // 卡片标题
  cat: 'life',            // study | life | access
  url: 'https://xxx.scau.edu.cn/',
  desc: '充网费、查流量、改密码',
  keywords: 'wangluo self 网费 流量 密码',  // 搜索关键词，拼音缩写写这里
  tags: ['需登录', '仅校内网'],            // 会显示成小标签
  hot: true,              // true 会出现在首屏"高频入口"
  status: 'ok'            // ok 已核实 / todo 待核实（卡片显示"待核实"）
}
```

保存刷新即可生效。**`keywords` 是搜索体验的关键**：把同学们会输的拼音缩写（`jwxt`、`cet`、`sf`）和俗称都塞进去。

---

---

## 三、统一身份认证（CAS）：登录接口与「免登录」原理

> 这一节回答你这次的问题：**登录接口在哪、能不能在导航站里收密码、怎么做到点一下直接进各系统。**

### 1. 统一认证入口（已实测）

华农的统一身份认证用的是联奕 `lyuapServer`，走标准 **CAS** 协议。所有系统的登录入口其实是同一个：

```
https://cas.scau.edu.cn/lyuapServer/login?service=<目标系统的回调地址>
```

`service` 参数决定「登录成功后把你送回哪个系统」。**这个值必须和目标系统登记的一致**，不能随便改。

| 目标系统 | service 参数 | 直达登录链接 |
| --- | --- | --- |
| 融合门户 | `https://portal.scau.edu.cn/shiro-cas` | https://cas.scau.edu.cn/lyuapServer/login?service=https%3A%2F%2Fportal.scau.edu.cn%2Fshiro-cas |
| 教务管理系统（新版） | `https://jwzf.scau.edu.cn/sso/lyiotlogin` | https://cas.scau.edu.cn/lyuapServer/login?service=https%3A%2F%2Fjwzf.scau.edu.cn%2Fsso%2Flyiotlogin |
| WebVPN（校外访问） | `https://vpn.scau.edu.cn:443/passport/v1/auth/cas` | https://cas.scau.edu.cn/lyuapServer/login?service=https%3A%2F%2Fvpn.scau.edu.cn%3A443%2Fpassport%2Fv1%2Fauth%2Fcas |
| 办事大厅（一网通办） | ⚠️ **动态 service，不能写死**：它每次都会生成随机的 `state` / `nonce` | 直接用 https://service.scau.edu.cn/ ，它会自己跳 CAS |

**为什么办事大厅不能写死 `service`？** 实测它跳转后的 `service` 长这样（节选）：

```
https://service.scau.edu.cn/sso/login?redirect_uri=...oauth2/authorize?client_id=QXrrZLD5w2YNM55fjdvi&...&state=<每次随机>&nonce=<每次随机>&x_client=cas
```

`state` 和 `nonce` 是每次登录随机生成的，写死会校验失败。**这种系统就老老实实点首页**，由它自己发起跳转，浏览器里有 CASTGC 时同样免密码。

**以下系统没有可以直接拼的静态 CAS `service`**（2026-09-20 实测，点首页不会直接跳 CAS）：

| 系统 | 实际登录方式 |
| --- | --- |
| 图书馆「我的图书馆」 | 走超星 `unified-auth.chaoxing.com` 统一登录，再由学校侧认证 |
| 邮件系统 | `mail.scau.edu.cn` 自己的登录页 |
| 就业创业信息网 | 站内自己的登录入口 |
| 旧版教务 | 实测当时返回 `503 Service Temporarily Unavailable`，可能只对校内网开放 |

这些系统要么从融合门户里进（门户已登录后跳转通常免密），要么直接点「打开入口」按它们自己的流程登录。**不确定能不能免登录时，最稳的方式就是先进融合门户，再从门户里点进去。**

### 2. 一次登录，为什么后面都免登录？

CAS 的完整流程是这样（以登录融合门户为例）：

```
① 你点「去统一认证登录」
   → 打开 cas.scau.edu.cn/lyuapServer/login?service=https://portal.scau.edu.cn/shiro-cas

② 你在 cas.scau.edu.cn 页面输入学号 + 密码
   → 密码只交给 cas.scau.edu.cn，别的域名看不到

③ CAS 验证通过，在 cas.scau.edu.cn 域名下写会话 cookie（CASTGC，HttpOnly）
   → 然后 302 跳回 service，并在 URL 上带一张一次性票据：?ticket=ST-xxxx

④ portal.scau.edu.cn 拿到 ticket，去 CAS 后台验证
   → 验证通过后，portal 在自己域名下写自己的登录态，页面正常打开

⑤ 之后你再点教务系统
   → 浏览器带着这张 CAS cookie 访问教务系统 → 教务系统把你引导到 CAS
   → CAS 发现你已有有效会话，不再要密码，直接发新 ticket 放行
```

关键点：**「免登录」靠的是浏览器里那张 `cas.scau.edu.cn` 的 cookie（CASTGC），不是你的站点保存了密码。** 只要这张 cookie 还有效（通常是浏览器会话内，或按学校配置的时长），同一浏览器访问任何接入 CAS 的系统都会自动放行。

### 3. 为什么不能把登录框做到本站里？

直接说结论：**技术上做不到，而且绝对不要做。**

1. **Cookie 跨域，读不到也写不了。** `CASTGC` 属于 `cas.scau.edu.cn`，并且是 `HttpOnly`，JavaScript 读不到；浏览器也不会因为你的站点 POST 了密码，就把 cookie 写到学校域名下。
2. **service 有白名单。** CAS 只给登记过的系统发 ticket。个人站不在名单里，就算拿到了密码、拿到了 ticket，也换不到任何一个校内系统的登录态。
3. **每个系统的登录态是各自的。** portal、教务、办事大厅各自在自己的域名下写自己的 session，你的站无法代替它们写。
4. **安全上就是钓鱼站。** 校园密码经过第三方服务器，一旦被记录或泄露，后果是账号被盗、选课被改、个人信息外泄。学校真正的统一认证只会在 `cas.scau.edu.cn` 域名下收密码。

**所以本站的正确做法是：** 只做跳转 + 状态提示——把用户送到学校自己的 `cas.scau.edu.cn`，密码只在学校域名下输入；登录后浏览器自然获得通行证，其它接了统一认证的系统自动放行。本站从头到尾不接收、不保存任何账号信息。

### 4. 想让本站「知道」用户登录了没有？

普通静态站有两个办法：

- **手动标记（本项目现在用的）**：登录完回来点一下「我已登录」，状态存在浏览器 localStorage 里（key 是 `scau-nav-sso`），只用于界面提示，不含账号信息。
- **真正的自动检测**：需要你的站点本身被学校统一认证登记为可信 `service`（拿到 client_id / 回调地址），也就是要向学校信息化部门申请接入 CAS/OIDC。个人导航站一般拿不到这个资格。在那之前「自动判断登录态」是做不到的——浏览器不会让一个外部站点读取 `cas.scau.edu.cn` 的 cookie。

> ⚠️ 一句话：**本站永远不该出现「请输入校园账号密码」的输入框。** 看到这种站，直接关掉。

### 5. 怎么给一个新系统加「免登录进入」按钮？

只需要在 `data.js` 里给这个系统加一行 `casService`：

```js
{
  id: 'jwnew',
  name: '教务管理系统（新版）',
  url: 'https://jwzf.scau.edu.cn/',
  casService: 'https://jwzf.scau.edu.cn/sso/lyiotlogin',  // ← 加了它，卡片上就会出现「免登录进入」
  // ...其余字段照旧
}
```

`casService` 的值就是上面表格里那个 `service` 参数。不确定时，最稳的做法是**直接点系统首页**，让系统自己跳转；能不能免登录，取决于浏览器里 CASTGC 是否还有效，而不是你的站做了什么。

---
## 四、微信小程序跳转：到底怎么回事

### 为什么不能直接放链接？

小程序**没有公开的 `https://` 网址**。它的"地址"是 `AppID` + 页面路径（如 `pages/index/index`），只能在微信客户端里被打开。所以普通网页里写 `<a href="小程序">` 是无效的。

现在有三种可行做法，按难度从低到高：

| 方案 | 效果 | 需要什么 | 个人站能做吗 |
| --- | --- | --- | --- |
| **A 小程序码 / 长按识别** | 用户扫码或长按图片进入 | 只需要一张图片 | ✅ 能，零配置 |
| **B URL Link / URL Scheme** | 点链接自动唤起小程序 | **小程序方**给密钥（AppID+AppSecret）→ 服务端调用微信接口 | ⚠️ 前端本站已接好，卡在密钥 |
| **C `wx-open-launch-weapp` 开放标签** | 网页内点按钮直接开小程序 | **已认证服务号** + JS-SDK 签名 + 备案域名 | ❌ 个人基本做不了 |

**当前状态：A 方案和「复制名称」现在就能用；B 方案的前端已经写好（`data/url-links.js`），只要三个小程序的运营方肯给链接/密钥，填进去就能一键直达。**

---

### 方案 A：小程序码（本项目已内置，推荐）

1. 手机微信里打开目标小程序 → 右上角「···」→「分享」→ **保存小程序码到相册**（或者让对方给你一张小程序码图）。
2. 图片放到 `assets/miniprogram/`，例如 `assets/miniprogram/jiaowu.png`。
3. 在 `data.js` 的 `miniprograms` 里填好：

```js
{
  id: 'mp-jiaowu',
  name: '华农教务',
  desc: '查成绩、看课表',
  qrcode: 'assets/miniprogram/jiaowu.png',  // ← 填这一行
  path: 'pages/index/index',                 // 可选
  username: '',                              // 可选，方案 C 才用
  appid: '',                                 // 可选
  verified: true                             // 你确认过就写 true，去掉"待确认"角标
}
```

4. 刷新页面，卡片上就会出现「小程序码」按钮：
   - **电脑端**：用手机微信「扫一扫」扫屏幕上显示的码。
   - **手机端**：把网页发到微信里打开，**长按**小程序码 → 「识别图中二维码」。
5. 没有图片时，卡片上的「复制名称」按钮也很好用：用户复制名字后去微信搜索框粘贴即可。

> 小提示：微信内打开普通网页时，**长按识别**是唯一不需要任何配置的跳转方式，这也是很多导航站的实际做法。

---

### 方案 B：URL Link（点链接唤起小程序）— 本项目已接入

微信官方接口 `POST /wxa/generate_urllink` 会返回一条形如 `https://wxaurl.cn/xxxx` 的短链，手机点它会唤起微信并直接进入对应小程序。相比老的 URL Scheme（`weixin://dl/business/…`），URL Link 是**普通 https 链接**，网页、短信、二维码里都能放，所以本项目用这个。

| 接口 | 返回 | 特点 |
| --- | --- | --- |
| `POST /wxa/generate_urllink` | `https://wxaurl.cn/xxx` | **本项目采用**。普通网址形式，微信内外都能点 |
| `POST /wxa/generatescheme` | `weixin://dl/business/?t=xxx` | 老方案，**只在手机浏览器里有效**，PC 无效 |

**前端（已完成，不需要你写代码）**

- 链接表在 `data/url-links.js`，键就是 `data.js` 里小程序的 `id`：

  ```js
  window.SCAU_URL_LINKS = {
    'mp-zijing-chuxing': 'https://wxaurl.cn/AbCdEfGhIjK',
    'mp-huanxi-youni':   { url: 'https://wxaurl.cn/XyZ1234567', expire: '2026-10-20' }
  };
  ```

- 填了链接 → 卡片自动出现 **「📲 打开小程序」**，并多一个「复制链接」按钮（电脑端能复制了发到手机）。
- 没填 → 卡片老实显示「未配直达链接」，走「复制名称 → 微信搜索」和「小程序码」两条老路。
- 板块标题旁边有个 `直达链接：x / 3 已配置` 的小徽章，一眼看得出配了几条。

**后端（`server/generate-url-link.js`，需要小程序方给你密钥）**

```bash
cp server/url-links.config.example.json server/url-links.config.json
# 在 config 里填 appid / secret / path
node server/generate-url-link.js                 # 全部生成
node server/generate-url-link.js mp-zijing-chuxing   # 只生成一个
node server/generate-url-link.js --dry-run       # 只看结果不写文件
```

脚本内部就是两步（`AppSecret` 只在服务端用，**永远不要写进网页**）：

```js
// 1) 换 access_token（用稳定版接口，多实例不会互踢）
POST https://api.weixin.qq.com/cgi-bin/stable_token
  { grant_type: 'client_credential', appid, secret }

// 2) 生成 URL Link
POST https://api.weixin.qq.com/wxa/generate_urllink?access_token=xxx
  { path: 'pages/index/index', query: '', expire_type: 1,
    expire_time: <30 天后的时间戳>, env_version: 'release' }
```

> `server/url-links.config.json` 和 `server/.url-links.cache.json` 已经在 `.gitignore` 里，别提交、别外发。

**必须知道的限制（这几条决定了 B 方案能不能真的用起来）**

1. 🔴 **密钥只能来自小程序自己。** `generate_urllink` 的 `access_token` 必须用**目标小程序自己的 AppID + AppSecret** 换取。我们不是紫荆出行 / 欢洗有你 / 紫荆e卡的管理员，所以：
   - ✅ 能做的：请这三个小程序的**运营方**（学校信息中心、后勤、相关公司）生成链接，或让他们把 AppID/AppSecret 给你（一般不会）；
   - ❌ 不能做的：拿自己别的小程序、公众号，甚至华农统一认证的账号去"代生成"——接口不认。
   - 另有第三方平台代调用通道（权限集 id `88`），但同样需要**小程序运营方授权**给你。
2. 🔴 **个人主体小程序没有这个接口。** 微信明确写了「目前仅针对**国内非个人主体**的小程序开放」，报错码 `40002` / `85407` 就是这个原因。
3. ⚠️ **链接有有效期，最长 30 天。** 过期后页面上的按钮会失效，所以要做成**定时任务**：每天/每周跑一次 `server/generate-url-link.js`（Windows 计划任务、Linux cron、GitHub Actions 都行），跑完重新部署 `data/url-links.js`。
4. ⚠️ **只在手机上有效。** 手机点开能唤起微信；电脑浏览器点会落到微信的中间页（提示用手机打开），这是微信的规定，不是代码问题。
5. ⚠️ **次数限制**：生成端每个小程序每天 50 万次、打开端 300 万次 —— 校园站完全够用，但要保证 `access_token` **被缓存**（脚本用 `stable_token`，且只在需要时跑，不会乱刷）。
6. ⚠️ **只对已发布（`release`）的小程序有效**；体验版要改 `env_version`。

**拿不到链接怎么办？** 就用方案 A（小程序码）或「复制名称」，这也是目前这个站点的默认状态 —— 全站不需要任何密钥就能跑起来。
### 方案 C：网页内直接点按钮跳转（`wx-open-launch-weapp`）

效果最好，门槛最高，且**必须满足全部条件**，缺一个都不行：

- ✅ 有一个**已认证的微信服务号**（订阅号不行，个人主体也拿不到服务号认证资质）
- ✅ 网页域名**已备案**，并在公众平台配置为「**JS 接口安全域名**」
- ✅ 页面**必须从微信内置浏览器打开**（手机微信里点链接进来的页面），PC 微信/其他浏览器一律无效
- ✅ 引入微信 JS-SDK **1.6.0 及以上**
- ✅ 后端能算出签名（`jsapi_ticket` → `sha1`）

**流程：**

```
后端：access_token → jsapi_ticket → sha1 签名
前端：引入 jweixin-1.6.0.js → wx.config(...) → 写 <wx-open-launch-weapp> 标签
```

**第 1 步：后端算签名（Node.js 示例）**

```js
import crypto from 'node:crypto';

async function getJsapiTicket(accessToken) {
  const r = await fetch(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`);
  const j = await r.json();
  if (j.errcode !== 0) throw new Error(JSON.stringify(j));
  return j.ticket;   // 同样要缓存 7000 秒
}

function sign({ ticket, nonceStr, timestamp, url }) {
  // url = 当前页面完整地址，不含 # 及其后面的部分；# 之后的内容要截掉
  const raw = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url.split('#')[0]}`;
  return crypto.createHash('sha1').update(raw).digest('hex');
}

// 暴露一个接口给前端：GET /wx-signature?url=当前页面url
app.get('/wx-signature', async (req, res) => {
  const url = req.query.url;
  const ticket = await getJsapiTicket(await getAccessToken(APPID, SECRET));
  const nonceStr = crypto.randomBytes(8).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000);
  res.json({
    appId: APPID,                 // 注意：这里是服务号的 AppID
    timestamp, nonceStr,
    signature: sign({ ticket, nonceStr, timestamp, url })
  });
});
```

**第 2 步：前端（HTML + JS）**

```html
<script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>

<!-- username 填小程序原始 ID：gh_ 开头；path 是页面路径 -->
<wx-open-launch-weapp
  id="launch-btn"
  username="gh_xxxxxxxxxxxx"
  path="pages/index/index.html">
  <script type="text/wxtag-template">
    <style>.btn{display:block;width:100%;padding:12px;background:#00693e;color:#fff;border:0;border-radius:10px;font-size:16px}</style>
    <button class="btn">打开小程序</button>
  </script>
</wx-open-launch-weapp>

<script>
fetch('/wx-signature?url=' + encodeURIComponent(location.href.split('#')[0]))
  .then(r => r.json())
  .then(cfg => {
    wx.config({
      debug: false,
      appId: cfg.appId,
      timestamp: cfg.timestamp,
      nonceStr: cfg.nonceStr,
      signature: cfg.signature,
      jsApiList: [],                       // 可以为空，但字段必须有
      openTagList: ['wx-open-launch-weapp'] // ← 关键
    });
    wx.ready(() => console.log('开放标签可用'));
    wx.error(err => console.error('签名失败', err));
  });

const btn = document.getElementById('launch-btn');
btn.addEventListener('launch', e => console.log('已打开小程序', e.detail));
btn.addEventListener('error', e => console.error('打开失败', e.detail));
</script>
```

**常见报错对照：**

| 现象 | 原因 |
| --- | --- |
| 标签不渲染、一片空白 | 不在微信内置浏览器里；或域名没配进「JS 接口安全域名」 |
| `invalid signature` | 签名的 `url` 用了 `#` 后面的内容；或 `jsapi_ticket` 缓存过期 |
| `openTagList` 无效 | 用的不是已认证**服务号**的 AppID，或 JS-SDK 版本低于 1.6.0 |
| `username` 不合法 | 填成 AppID 了，这里要的是**原始 ID**，`gh_` 开头 |
| 点击没反应 | 小程序未发布 / 该小程序未授权该服务号关联 |

> 以上接口细节以微信官方文档为准（微信开放社区 / 微信公众平台文档），微信接口会调整，接入前建议再核一遍官方说明。

---

### 已收录的三个小程序（id 对照表）

| 显示名称 | `data.js` 里的 id | 用途 | 直达链接 |
| --- | --- | --- | --- |
| 紫荆出行 | `mp-zijing-chuxing` | 校园出行：校巴/班车、用车与预约 | ⬜ 待运营方提供 |
| 欢洗有你 | `mp-huanxi-youni` | 宿舍洗衣房扫码洗衣、支付与进度查询 | ⬜ 待运营方提供 |
| 紫荆e卡 | `mp-zijing-ecard` | 校园卡余额、充值、消费记录 | ⬜ 待运营方提供 |

> 三张卡片的 `desc` 是按常见功能写的，`verified: false` 所以会显示「待确认」角标 —— 你确认过实际功能后，把它们改成 `verified: true` 即可去掉角标。

拿到链接后，只要往 `data/url-links.js` 里加一行：

```js
window.SCAU_URL_LINKS = {
  'mp-zijing-chuxing': 'https://wxaurl.cn/运营方给你的短链',
};
```

刷新页面，这张卡片就变成「📲 打开小程序」了。

---

## 五、已核实的官方入口（2026-09-20 核对）

| 名称 | 地址 | 备注 |
| --- | --- | --- |
| 融合门户 | https://portal.scau.edu.cn/ | 统一身份认证总入口 |
| 办事大厅 | https://service.scau.edu.cn/ | 一网通办 |
| 教务管理系统（新版） | https://jwzf.scau.edu.cn/ | 选课/成绩/课表 |
| 本科生院（教务处） | https://jwc.scau.edu.cn/ | 通知与规定 |
| 旧版教务系统 | http://jwxtxs.scau.edu.cn/default2.aspx | 历史业务 |
| 毕业论文系统 | http://bkbylw.scau.edu.cn/index.aspx | 论文提交/查重 |
| 图书馆 | https://lib.scau.edu.cn/ | 借阅/数据库/座位 |
| 邮件系统 | https://mail.scau.edu.cn | 学校邮箱 |
| 研究生院 | https://yjsy.scau.edu.cn/ | 研究生教务 |
| 研究生在线课程 | https://gsscau.yuketang.cn/pro/portal/home/ | 学堂在线 |
| 财务处 | https://cwc.scau.edu.cn/ | 缴费 |
| 就业创业信息网 | https://jyzx.scau.edu.cn/ | 招聘/就业手续 |
| 招生办公室 | https://zsb.scau.edu.cn/ | 招生录取 |
| 校友会 | https://scauxyh.scau.edu.cn/ | 校友服务 |
| WebVPN | https://vpn.scau.edu.cn/ | 校外访问校内系统 |
| 学校主页 | https://www.scau.edu.cn/ | 官方资讯 |

> 教务类系统一般**只允许校内网访问**。在校外先连 WebVPN，再打开教务系统通常就能进。

---

## 六、校徽与素材来源

- 顶栏校徽取自华南农业大学官网模板目录（`www.scau.edu.cn` 的 `logo.svg` / `logo_green.svg`），
  本地副本分别是 `assets/logo-scau.svg`（白色版，深色底用）和 `assets/logo-scau-green.svg`（绿色版，浅色底用），
  页面用 CSS 按主题自动切换，因此深浅色模式下都清晰。
- 校徽、校名属于华南农业大学的标识，**本站是个人做的学生向导航，不是学校官方站点**，
  引用仅用于"这是华农的入口"这层指向；如学校方面有异议，替换或删除 `assets/` 里的两个 SVG 即可，页面不会坏。
- 页面配色沿用华农绿（`#00693e`）搭配紫荆粉，取自校园常见的紫荆花，没有使用任何第三方图库素材。

---

## 七、声明

本站为个人整理的学生向导航工具，**非华南农业大学官方站点**。链接可用性、办事流程、开放时间等请以学校官方发布为准。若学校相关部门认为条目需要调整，请以官方口径为准。




