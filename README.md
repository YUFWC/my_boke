# 落叶归根 · 个人站

纯静态站点，零构建步骤。24 个文件，2.4 MB。

## 目录结构

```
blog/
├── public/                 ← 部署目录（拖这个文件夹）
│   ├── index.html          主页（Hero + 轮播 + 个人能力介绍）
│   ├── HomPage.html        介绍（引言横幅 + 心灵随笔 + 侧栏）
│   ├── MyWorks.html        作品（8 张图 + 灯箱）
│   ├── MyContact.html      联系（乡愁 + 微信/QQ 二维码）
│   ├── 404.html            找不到页面
│   ├── css/style.css       全部样式（含深色模式）
│   ├── js/main.js          轮播 / 灯箱 / 主题切换 / 入场动画
│   ├── img/                图片资源
│   ├── _headers            缓存与安全响应头
│   └── _redirects          根路径重写
├── wrangler.jsonc          Workers 部署配置（走 Pages 时用不到）
└── README.md               本文件
```

---

## 方式一：Pages 拖拽上传（最快，约 30 秒）

不需要装任何工具。

1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → 左侧 **Workers 和 Pages**
2. **创建应用程序** → **Get started** → **拖放文件**
3. 项目名填 `crazy-blog`
4. 把 **`public` 文件夹**拖进去（不是 `blog`，`blog` 里的配置文件不需要上传）
5. 点 **部署站点**

地址：`https://crazy-blog.pages.dev`

> ⚠️ 拖拽限制 1000 个文件、单文件 25 MiB。我们只有 24 个文件。
> ⚠️ 拖拽方式**不能**后期转成 Git 集成，想 push 自动部署得新建项目。

---

## 方式二：Pages + Wrangler

```bash
npx wrangler login                     # 打开浏览器授权

cd "路径/blog"
npx wrangler pages project create      # 首次，项目名填 crazy-blog，分支回车用 main
npx wrangler pages deploy public       # 部署
```

以后更新只要重跑最后一行。上限 20000 个文件。

先发到预览环境验证：

```bash
npx wrangler pages deploy public --branch=preview
```

会得到 `preview.crazy-blog.pages.dev`，确认没问题再部署生产。

---

## 方式三：Workers 静态资源（官方推荐）

配置已经写好在 `wrangler.jsonc` 里了。

```bash
cd "路径/blog"
npx wrangler login
npx wrangler deploy
```

地址：`https://crazy-blog.<你的子域>.workers.dev`

**这种方式的好处**：以后想把 AI 聊天界面的 API 合并进来（同源、免跨域、一次部署），直接加 `src/index.ts`，在 `wrangler.jsonc` 里加一行 `"main": "src/index.ts"` 就行。静态文件优先匹配，`/v1/*` 这类路径自然落到 Worker 脚本上。

### 配置说明（这两项是有意设置的，别删）

```jsonc
"assets": {
  "directory": "./public",
  "html_handling": "none",          // 直接按文件名服务，不做 .html 重定向
  "not_found_handling": "404-page"  // 找不到就返回 404.html
}
```

`html_handling` 默认值是 `auto-trailing-slash`，会把 `/HomPage.html` **307 重定向**到 `/HomPage`。这样每次翻页都多一次往返，而且和本地 `python -m http.server` 的行为不一致。改成 `none` 后直接返回 200。

代价是根路径 `/` 不再自动解析到 `index.html`，所以 `public/_redirects` 里加了一条 200 改写把它补回来：

```
/  /index.html  200
```

---

## 绑定自己的域名

1. 进入项目 → **自定义域** → **设置自定义域**
2. 填域名，比如 `blog.你的域名.com`
3. Cloudflare 自动加 DNS 记录并签发证书

⚠️ **注意区别**：

| 域名 DNS 在哪 | Pages | Workers |
|---|---|---|
| 已托管在 Cloudflare | ✅ 可以绑 | ✅ 可以绑 |
| 在别处（阿里云/腾讯云等） | ✅ 可以（CNAME 接入） | ❌ **绑不了** |

Workers **不支持** nameserver 不在 Cloudflare 的自定义域名，这是它唯一的硬伤。如果你的域名在别家又不想迁 NS，就只能用 Pages。

---

## 大陆访问要注意

`*.pages.dev` 和 `*.workers.dev` 这两个默认域名在大陆**访问不稳定**，经常打不开。

**必须绑自己的自定义域名。** 但即使绑了：

- 免费版走海外节点，大陆延迟通常 200–400ms
- 想走国内节点需要域名**完成 ICP 备案**，且需企业版套餐

如果主要给大陆用户看，更实际的是把静态站放国内对象存储 + CDN，Cloudflare 只做 API 层。

---

## 更新内容

```bash
# 方式一：重新拖拽 public 文件夹
# 方式二：npx wrangler pages deploy public
# 方式三：npx wrangler deploy
```

**缓存策略**（`public/_headers` 里配好的，已在本地实测生效）：

| 路径 | Cache-Control | 效果 |
|---|---|---|
| `/*.html`、`/` | `max-age=0, must-revalidate` | 改了立刻生效 |
| `/css/*`、`/js/*` | `max-age=86400` | 最多 1 天后全量生效 |
| `/img/*` | `max-age=2592000` | 最多 30 天后全量生效 |

> **换了图片但文件名没变**的话，老访客最多 30 天看不到新图。建议直接换文件名（`banner.jpg` → `banner-2.jpg`），立刻生效。

---

## 本地预览

```bash
cd "路径/blog/public"
python -m http.server 8899
```

打开 `http://127.0.0.1:8899`。

用 Wrangler 起本地服务（行为和线上一致，含 `_headers` 和 404 处理）：

```bash
cd "路径/blog"
npx wrangler dev
```

---

## 常见问题

**深色模式默认值？**
右上角切换按钮，选择存在浏览器 localStorage。首次访问跟随系统。

**轮播怎么加图片？**
在 `index.html` 里复制一段 `.slider__slide`，换 `src` 即可。圆点和自动播放在两张以上才启用。

```html
<div class="slider__slide">
  <img src="img/新图片.jpg" alt="描述" loading="lazy">
</div>
```

**作品页怎么加图？**
复制一段 `<figure class="work">`，改 `data-zoom` 和 `img src`，`figcaption` 里的序号顺手改一下。

**想换主题色？**
`public/css/style.css` 顶部 `:root` 里的 `--accent` 是主色，深色模式对应 `[data-theme="dark"]` 里的同名变量。改一处全站生效。

**旧模板素材去哪了？**
在 `../legacy-assets/`（32 个文件，1.57 MB）。都是旧版雪碧图和装饰图，新版全部用 CSS 实现，确认不需要可以直接删。
