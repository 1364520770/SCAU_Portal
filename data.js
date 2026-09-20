/* ============================================================
 * 华农入口导航 · 数据文件
 * ------------------------------------------------------------
 * 想加/改一个网站？只改这个文件就够了，不用动 HTML/CSS/JS。
 *
 * 字段说明：
 *   id       唯一标识（英文，别重复）
 *   name     显示名称
 *   cat      所属分类 id，见下面 categories
 *   url      链接地址
 *   desc     一句话说明（搜索也会搜这里）
 *   keywords 补充搜索关键词（拼音缩写、俗称等）
 *   tags     标签，可选：需登录 / 仅校内网 / 校园网或VPN / 手机友好 / 常用
 *   hot      true 会出现在首屏"高频入口"里
 *   status   "ok" 已核实 | "todo" 待核实（会在卡片上显示提醒）
 * ============================================================ */

window.SCAU_DATA = {
  // 数据最后核实日期
  updated: '2026-09-20',

  /* ============================================================
   * 统一身份认证（SSO）
   * ------------------------------------------------------------
   * 华农的统一认证平台是联奕的 lyuapServer，走 CAS 协议：
   *   https://cas.scau.edu.cn/lyuapServer/login?service=<目标系统地址>
   * 登录后浏览器会在 cas.scau.edu.cn 上留下会话 cookie（CASTGC），
   * 所有登记过的系统就会自动放行 —— 这就是"免登录"的全部原理。
   *
   * 本站永远不接收账号密码，只负责把用户送到学校自己的登录页。
   * ============================================================ */
  sso: {
    loginUrl: 'https://cas.scau.edu.cn/lyuapServer/login',
    // 登录完成后默认落到融合门户
    portalService: 'https://portal.scau.edu.cn/shiro-cas',
    // 各系统自己的 service 值（已实测）
    services: {
      portal: 'https://portal.scau.edu.cn/shiro-cas',
      ehall: 'https://service.scau.edu.cn/sso',
      jwnew: 'https://jwzf.scau.edu.cn/sso/lyiotlogin',
      lib: 'https://unified-auth.chaoxing.com/login_auth/v2/cas/scau/index',
      electric: 'http://cz.scau.edu.cn/caslogin/login',
      // WebVPN 首页自身会跳到 CAS，service 是固定的（2026-09-20 实测）
      vpn: 'https://vpn.scau.edu.cn:443/passport/v1/auth/cas'
    }
  },

  categories: [
    { id: 'study',  name: '教务与学习', icon: '🎓', desc: '选课、成绩、课表、论文、图书馆' },
    { id: 'life',   name: '校园服务',   icon: '🏫', desc: '缴费、就业、招生、校友' },
    { id: 'access', name: '校外与资讯', icon: '🌐', desc: '不在校园网时的绕行方案与官方资讯' }
  ],

  sites: [
    /* ---------------- 教务与学习 ---------------- */
    {
      id: 'portal', name: '融合门户', cat: 'study', hot: true,
      url: 'https://portal.scau.edu.cn/',
      casService: 'https://portal.scau.edu.cn/shiro-cas',
      desc: '统一身份认证总入口，成绩、课表、邮件、缴费等都在这里跳转',
      keywords: 'ronghe menhu sso 统一认证 一网通 登录 门户',
      tags: ['常用', '需登录'], status: 'ok'
    },
    {
      id: 'ehall', name: '办事大厅（一网通办）', cat: 'study',
      url: 'https://service.scau.edu.cn/',
      casService: 'https://service.scau.edu.cn/sso',
      desc: '线上办事：各类证明申请、审批流转、学生事务办理',
      keywords: 'banshi dating 一网通办 服务大厅 证明 申请 审批',
      tags: ['需登录'], status: 'ok'
    },
    {
      id: 'jwnew', name: '教务管理系统（新版）', cat: 'study', hot: true,
      url: 'https://jwzf.scau.edu.cn/',
      casService: 'https://jwzf.scau.edu.cn/sso/lyiotlogin',
      desc: '选课、查成绩、看课表、学籍信息、考试安排',
      keywords: 'jiaowu jwxt zhengfang 选课 成绩 课表 学籍 考试 jwzf',
      tags: ['常用', '需登录'], status: 'ok'
    },
    {
      id: 'jwc', name: '本科生院（教务处）', cat: 'study',
      url: 'https://jwc.scau.edu.cn/',
      desc: '教学通知、学籍与选课规定、四六级、成绩单办理说明',
      keywords: 'jwc jiaowuchu 教务处 本科生院 通知 四六级 学籍',
      tags: [], status: 'ok'
    },
    {
      id: 'jwold', name: '旧版教务系统', cat: 'study',
      url: 'http://jwxtxs.scau.edu.cn/default2.aspx',
      desc: '老版正方教务入口，部分历史业务仍在使用',
      keywords: 'jiu jiaowu jwxtxs 正方 老系统',
      tags: ['需登录'], status: 'ok'
    },
    {
      id: 'thesis', name: '毕业论文（设计）系统', cat: 'study',
      url: 'http://bkbylw.scau.edu.cn/index.aspx',
      desc: '本科毕业论文选题、提交、查重与答辩流程',
      keywords: 'biyelunwen thesis 论文 查重 答辩 bkbylw',
      tags: ['需登录'], status: 'ok'
    },
    {
      id: 'lib', name: '图书馆', cat: 'study',
      url: 'https://lib.scau.edu.cn/',
      casService: 'https://unified-auth.chaoxing.com/login_auth/v2/cas/scau/index',
      desc: '借阅查询与续借、电子数据库、座位与研讨间预约',
      keywords: 'tushuguan library 借书 续借 知网 数据库 座位预约',
      tags: ['需登录'], status: 'ok'
    },
    {
      id: 'mail', name: '邮件系统', cat: 'study',
      url: 'https://mail.scau.edu.cn',
      desc: '学校邮箱，收发校内通知与教师邮件',
      keywords: 'youxiang mail email 邮箱 学生邮箱',
      tags: ['需登录'], status: 'ok'
    },
    {
      id: 'yjsy', name: '研究生院', cat: 'study',
      url: 'https://yjsy.scau.edu.cn/',
      desc: '研究生教务管理、培养方案、学位与学籍通知',
      keywords: 'yanjiusheng yjsy 研究生 学位 培养',
      tags: [], status: 'ok'
    },
    {
      id: 'yjsy-mooc', name: '研究生在线课程平台', cat: 'study',
      url: 'https://gsscau.yuketang.cn/pro/portal/home/',
      desc: '学堂在线研究生慕课与线上课程学习',
      keywords: 'yanjiusheng mooc yuketang 学堂在线 慕课 网课',
      tags: ['需登录', '手机友好'], status: 'ok'
    },

    /* ---------------- 校园服务 ---------------- */
    {
      id: 'cwc', name: '财务处（网上缴费）', cat: 'life',
      url: 'https://cwc.scau.edu.cn/',
      desc: '学费住宿费缴纳入口、缴费通知与报销指南',
      keywords: 'caiwu cwc 缴费 学费 住宿费 财务',
      tags: ['需登录'], status: 'ok'
    },
    {
      id: 'electric', name: '智能电表充值平台', cat: 'life',
      url: 'http://cz.scau.edu.cn/mobile/index.html',
      casService: 'http://cz.scau.edu.cn/caslogin/login',
      desc: '宿舍智能电表查询与充值，支持统一认证或微信扫码登录',
      keywords: 'zhineng dianbiao cz dianfei 电费 电表 电量 充值 宿舍缴费',
      tags: ['需登录', '手机友好'], status: 'ok'
    },
    {
      id: 'job', name: '就业创业信息网', cat: 'life',
      url: 'https://jyzx.scau.edu.cn/',
      desc: '招聘信息、宣讲会、双选会、就业手续与三方协议',
      keywords: 'jiuye jyzx 就业 招聘 宣讲会 实习 三方',
      tags: ['需登录', '手机友好'], status: 'ok'
    },
    {
      id: 'zsb', name: '招生办公室', cat: 'life',
      url: 'https://zsb.scau.edu.cn/',
      desc: '本科招生政策、专业介绍、历年分数线与录取查询',
      keywords: 'zhaosheng zsb 招生 分数线 录取 专业',
      tags: [], status: 'ok'
    },
    {
      id: 'alumni', name: '校友会', cat: 'life',
      url: 'https://scauxyh.scau.edu.cn/',
      desc: '校友服务、校友活动与校友卡相关事项',
      keywords: 'xiaoyou alumni 校友 校友卡',
      tags: [], status: 'ok'
    },

    /* ---------------- 校外与资讯 ---------------- */
    {
      id: 'vpn', name: 'WebVPN（校外访问）', cat: 'access', hot: true,
      url: 'https://vpn.scau.edu.cn/',
      casService: 'https://vpn.scau.edu.cn:443/passport/v1/auth/cas',
      desc: '不在校园网时，用它访问教务、图书馆数据库等校内系统',
      keywords: 'vpn webvpn 校外 校园网 远程 数据库 在家',
      tags: ['常用', '需登录'], status: 'ok'
    },
    {
      id: 'home', name: '学校主页', cat: 'access',
      url: 'https://www.scau.edu.cn/',
      desc: '学校新闻、通知公告、院系与机构导航',
      keywords: 'zhuye home 官网 新闻 通知 院系',
      tags: [], status: 'ok'
    }
  ],

  /* ============================================================
   * 微信小程序板块
   * ------------------------------------------------------------
   * 目前收录三个：紫荆出行 / 欢洗有你 / 紫荆e卡
   *
   * 字段说明：
   *   id       唯一标识，同时也是 data/url-links.js 里的键，别改
   *   name     卡片标题，也是「复制名称」复制的内容
   *   desc     一句话用途（搜索也会搜这里）
   *   keywords 拼音缩写、俗称，方便搜索
   *   qrcode   小程序码图片路径（方案 A）。留空则卡片显示「怎么进入？」
   *   path     小程序页面路径，如 'pages/index/index'（生成直达链接时用）
   *   query    拉起小程序时带的参数，如 'from=scau-nav'（可选）
   *   username 小程序原始 ID（gh_ 开头），一般用不到
   *   appid    小程序 AppID：生成 URL Link 时必须有小程序官方给的密钥，
   *            实际填写位置在 server/url-links.config.json
   *   verified true = 已确认过这个小程序，false 会显示「待确认」角标
   *
   * ⚠️ 重要：这三个小程序都不是我们开发的。
   *    微信生成 URL Link（B 方案直达链接）必须用「目标小程序自己的」
   *    AppID + AppSecret 换 access_token，
   *    所以链接只能由小程序运营方生成给我们，或者退一步用「小程序码」。
   *    详见 README.md 第四章。
   * ============================================================ */
  miniprograms: [
    {
      id: 'mp-zijing-chuxing',
      name: '紫荆出行',
      desc: '校园出行服务：校巴/班车、用车与相关预约，具体功能以小程序内为准',
      keywords: 'zijing chuxing 紫荆出行 出行 校巴 班车 巴士 单车 通勤 zijing',
      qrcode: '',
      path: '',
      query: '',
      username: '',
      appid: '',
      verified: false
    },
    {
      id: 'mp-huanxi-youni',
      name: '欢洗有你',
      desc: '宿舍洗衣房扫码洗衣、在线支付与进度查询，具体功能以小程序内为准',
      keywords: 'huanxi youni 欢洗有你 洗衣 洗衣机 洗衣房 烘干 扫码 xiyi',
      qrcode: '',
      path: '',
      query: '',
      username: '',
      appid: '',
      verified: false
    },
    {
      id: 'mp-zijing-ecard',
      name: '紫荆e卡',
      desc: '校园卡（一卡通）相关服务：余额、充值、消费记录，具体功能以小程序内为准',
      keywords: 'zijing eka 紫荆e卡 e卡 一卡通 校园卡 饭卡 充值 余额 yikatong',
      qrcode: '',
      path: '',
      query: '',
      username: '',
      appid: '',
      verified: false
    }
  ]
};
