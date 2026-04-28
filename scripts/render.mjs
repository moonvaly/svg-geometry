import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const videosDir = path.join(root, 'videos');

fs.mkdirSync(videosDir, { recursive: true });

// ── Problem configurations ──────────────────────────────────
const problems = [
  {
    file: 'problems/p1.html',
    output: 'p1-正方形ABCD旋转.mp4',
    frames: 360,       // 360 frames × 30fps = 12s
    fps: 30,
    start: 0,
    end: 360,
  },
  {
    file: 'problems/p2.html',
    output: 'p2-矩形CDGH中OB最小值.mp4',
    frames: 360,
    fps: 30,
    start: 0,
    end: 6 * Math.sqrt(3),   // tMax ≈ 10.392
  },
  {
    file: 'problems/p3.html',
    output: 'p3-菱形ABCD中AG最小值.mp4',
    frames: 360,
    fps: 30,
    start: 0,
    end: 4,
  },
];

// ── Render ──────────────────────────────────────────────────
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

for (const problem of problems) {
  const filePath = path.join(root, problem.file);
  console.log(`\n🎬 Rendering: ${problem.output}`);
  console.log(`   File: ${problem.file}`);
  console.log(`   Frames: ${problem.frames} @ ${problem.fps}fps`);

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 700 });

  await page.goto('file://' + filePath, { waitUntil: 'networkidle0' });

  // Wait for the SVG to be present and rendered
  await page.waitForSelector('svg');

  // Hide UI chrome, keep only the SVG
  await page.evaluate(() => {
    const hide = (sel) => {
      const el = document.querySelector(sel);
      if (el) el.style.setProperty('display', 'none', 'important');
    };
    hide('h1');
    hide('.problem');
    hide('.controls');
    hide('.legend');
    hide('.top-bar');
    // Adjust body to center the SVG
    document.body.style.setProperty('justify-content', 'center', 'important');
    document.body.style.setProperty('padding', '0', 'important');
    document.body.style.setProperty('margin', '0', 'important');
    document.body.style.setProperty('overflow', 'hidden', 'important');
    // Give SVG a background
    const svg = document.querySelector('svg');
    if (svg) {
      svg.style.setProperty('background', '#0d1117', 'important');
      svg.style.setProperty('border-radius', '0', 'important');
      svg.style.setProperty('display', 'block', 'important');
    }
  });

  // Temp directory for frame PNGs
  const framesDir = fs.mkdtempSync(path.join(videosDir, 'tmp-'));
  console.log(`   Frames dir: ${framesDir}`);

  const svg = await page.$('svg');
  if (!svg) {
    console.error(`   ❌ SVG not found in ${problem.file}`);
    await page.close();
    continue;
  }

  for (let i = 0; i < problem.frames; i++) {
    const progress = problem.start +
      (problem.end - problem.start) * i / Math.max(problem.frames - 1, 1);

    await page.evaluate((val) => {
      if (typeof window.setProgress === 'function') {
        window.setProgress(val);
      }
    }, progress);

    // Yield to next animation frame to ensure paint
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));

    await svg.screenshot({
      path: path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`),
    });

    if (i % 60 === 0) {
      console.log(`   Progress: ${i}/${problem.frames} (${Math.round(i / problem.frames * 100)}%)`);
    }
  }

  console.log(`   Progress: ${problem.frames}/${problem.frames} (100%)`);

  // ── FFmpeg: PNG sequence → MP4 ──
  const outputPath = path.join(videosDir, problem.output);
  console.log(`   Encoding video...`);

  execSync(
    `ffmpeg -framerate ${problem.fps} -i "${framesDir}/frame_%04d.png" ` +
    `-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p ` +
    `-y "${outputPath}"`,
    { stdio: ['ignore', 'inherit', 'inherit'] }
  );

  // Cleanup
  fs.rmSync(framesDir, { recursive: true, force: true });
  await page.close();

  const stats = fs.statSync(outputPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
  console.log(`   ✅ ${problem.output} (${sizeMB} MB)`);
}

await browser.close();
console.log('\n✨ All videos rendered!');
