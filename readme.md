# SVG 几何动画题库

几何极值问题的 SVG 动画演示集合。每道题是一个独立 HTML 页面，包含交互式 SVG 动画，支持播放/暂停、滑块控制、键盘操作。

## 题目列表

| # | 题目 | 核心结论 |
|---|------|----------|
| 1 | 正方形ABCD旋转 | E 点轨迹为圆，圆心为正方形中心，半径 √2/2 |
| 2 | 矩形CDGH中OB最小值 | OB_min = 4（DG = 5√3 时取到） |
| 3 | 菱形ABCD中AG最小值 | AG_min = √7 − √3 ≈ 0.914 |

## 使用

直接在浏览器打开 `index.html`，点击题目卡片进入对应动画页面。

### 控件

- **播放/暂停** — 自动演示动画过程
- **重置** — 回到初始状态
- **滑块** — 手动控制参数
- **键盘** — `Space` 播放/暂停，`←` `→` 步进

## 技术栈

- 纯前端，无构建工具或依赖
- 单页 HTML + 内嵌 SVG + 原生 JavaScript
- `requestAnimationFrame` 驱动动画循环

## 视频渲染

支持将每道题的动画导出为 MP4 视频：

```bash
node scripts/render.mjs
```

使用 Puppeteer (Headless Chrome) 逐帧截图 + FFmpeg 合成，详见 [RENDER.md](./RENDER.md)。

## 项目结构

```
├── index.html           ← 题目列表入口页
├── problems/
│   ├── p1.html          ← 正方形ABCD旋转
│   ├── p2.html          ← 矩形CDGH中OB最小值
│   └── p3.html          ← 菱形ABCD中AG最小值
├── scripts/
│   └── render.mjs       ← 视频渲染脚本
├── videos/              ← 渲染输出目录
├── RENDER.md            ← 视频渲染技术文档
└── readme.md            ← 本文件
```
