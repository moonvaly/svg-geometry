# SVG 几何动画 → 视频渲染方案

## 架构总览

```
Puppeteer (Headless Chrome)          FFmpeg
┌──────────────────────┐         ┌──────────────┐
│ 打开 HTML 页面        │   PNG   │ PNG序列→MP4  │
│ 逐帧截图 SVG 元素     │ ──────► │ H.264 编码    │
│ frame_0000.png …      │         │ CRF 18 高质量 │
└──────────────────────┘         └──────────────┘
```

两步流水线：Puppeteer 截图 → FFmpeg 合成视频。

## 环境依赖

| 工具 | 用途 | 版本 |
|------|------|------|
| Node.js | 运行渲染脚本 | ≥ v18 |
| Puppeteer | Headless Chrome 截图 | v24.x，已安装在项目中 |
| FFmpeg | PNG 序列合成 MP4 | v8.0，通过 Homebrew 安装 |

验证命令：

```bash
node --version
npx puppeteer --version   # 或检查 node_modules/puppeteer
ffmpeg -version
```

Puppeteer 自带捆绑 Chromium（`~/.cache/puppeteer/`），无需额外安装浏览器。

## 目录结构

```
svg_geometry/
├── index.html              ← 题目列表入口页
├── problems/
│   ├── p1.html             ← 题目1：正方形ABCD旋转
│   ├── p2.html             ← 题目2：矩形CDGH中OB最小值
│   └── p3.html             ← 题目3：菱形ABCD中AG最小值
├── scripts/
│   └── render.mjs          ← 视频渲染脚本
├── videos/
│   ├── p1-正方形ABCD旋转.mp4
│   ├── p2-矩形CDGH中OB最小值.mp4
│   └── p3-菱形ABCD中AG最小值.mp4
└── RENDER.md               ← 本文档
```

## 使用方式

### 渲染所有题目视频

```bash
node scripts/render.mjs
```

输出到 `videos/` 目录，控制台会显示每道题的渲染进度。

### 渲染单个题目

修改 `scripts/render.mjs` 中的 `problems` 数组，只保留需要渲染的条目，然后运行：

```bash
node scripts/render.mjs
```

## 核心技术细节

### 1. 每道题暴露帧控制 API

在每个 HTML 的 IIFE 内添加了一行：

```js
window.setProgress = (val) => { param = parseFloat(val); update(); };
```

- p1 参数 `n`：角度 0°→360°
- p2 参数 `t`：DG 距离 0→6√3（≈10.392）
- p3 参数 `ae`：AE 长度 0→4

外部脚本通过 `page.evaluate()` 调用此函数控制每一帧的状态，无需修改内部动画逻辑。

### 2. 渲染循环

```js
for (let i = 0; i < problem.frames; i++) {
  const progress = start + (end - start) * i / (frames - 1);
  await page.evaluate((val) => window.setProgress(val), progress);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(r))); // 等待渲染
  await svg.screenshot({ path: `frame_${i}.png` });
}
```

关键点：
- 使用 `requestAnimationFrame` yield 确保 Chromium 完成帧渲染再截图
- 截图直接捕获 `<svg>` 元素，避免 UI 干扰

### 3. 隐藏 UI 元素

截图前通过 `page.evaluate()` 隐藏非SVG内容：

```js
hide('h1'); hide('.problem'); hide('.controls');
hide('.legend'); hide('.top-bar');
svg.style.background = '#0d1117'; // 匹配深色主题背景
```

### 4. FFmpeg 编码参数

```bash
ffmpeg -framerate 30 -i frame_%04d.png \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -y output.mp4
```

- `-crf 18`：视觉无损质量
- `-pix_fmt yuv420p`：最大兼容性
- `-preset medium`：编码速度/文件大小平衡

## 配置项

渲染脚本顶部的 `problems` 数组定义了每道题的参数：

| 字段 | 说明 |
|------|------|
| `file` | HTML 文件路径 |
| `output` | 输出的视频文件名 |
| `frames` | 总帧数 |
| `fps` | 视频帧率 |
| `start` | 参数起始值 |
| `end` | 参数结束值 |

默认配置：360 帧 @ 30fps → 每段视频 12 秒。

## 扩展新题目

添加新题目的视频渲染只需两步：

1. 在新 HTML 文件的 IIFE 中添加：
   ```js
   window.setProgress = (val) => { /* 设置对应参数并调用 update() */ };
   ```

2. 在 `scripts/render.mjs` 的 `problems` 数组中添加配置项：
   ```js
   {
     file: 'problems/p4.html',
     output: 'p4-题目名称.mp4',
     frames: 360,
     fps: 30,
     start: 0,
     end: /* 参数最大值 */,
   }
   ```

## 性能

每帧截图约 50-80ms，三道题共 1080 帧，总耗时约 30 秒（含 FFmpeg 编码时间）。
FFmpeg 编码速度约 11-14× 实时（即 12 秒的视频约 1 秒编码完成）。
