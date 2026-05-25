#!/usr/bin/env node
/*
 * Wedding invitation build script.
 * Copies the source files into ./dist with conservative minification:
 *  - HTML: strip comments + collapse inter-tag whitespace
 *    (preserves <style> and <script> bodies verbatim)
 *  - CSS:  strip comments + collapse whitespace
 *  - JS:   copied as-is (regex JS minification breaks easily)
 *  - assets/: copied unchanged
 */

const fs   = require('fs');
const path = require('path');

const SRC  = __dirname;
const DIST = path.join(__dirname, 'dist');

// ─── helpers ────────────────────────────────────────────────────────
const kb = b => (b / 1024).toFixed(1) + ' KB';
const fileSize = p => kb(fs.statSync(p).size);

function dirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSize(p);
    else                     total += fs.statSync(p).size;
  }
  return total;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else                     fs.copyFileSync(s, d);
  }
}

// ─── minifiers (conservative) ───────────────────────────────────────
function minifyCSS(s) {
  return s
    .replace(/\/\*[\s\S]*?\*\//g, '')         // block comments
    .replace(/\s+/g, ' ')                      // collapse whitespace
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')      // tighten around tokens
    .replace(/;}/g, '}')                       // drop last semicolon
    .trim();
}

function minifyHTML(s) {
  // Stash <style> and <script> blocks so we don't mangle their content
  const blocks = [];
  s = s.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, (m) => {
    blocks.push(m);
    return `__BLOCK_${blocks.length - 1}__`;
  });

  s = s
    .replace(/<!--[\s\S]*?-->/g, '')          // HTML comments
    .replace(/>\s+</g, '><')                   // whitespace between tags
    .replace(/[ \t]+/g, ' ')                   // collapse spaces/tabs
    .replace(/\n+/g, '\n')                     // collapse blank lines
    .trim();

  return s.replace(/__BLOCK_(\d+)__/g, (_, i) => blocks[+i]);
}

// ─── build ──────────────────────────────────────────────────────────
const t0 = Date.now();
console.log('\n🌿 Building wedding invitation\n');

// Clean
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST);

// HTML files (minified)
['index.html', 'admin.html'].forEach((f) => {
  const src = path.join(SRC, f);
  if (!fs.existsSync(src)) return;
  const out = path.join(DIST, f);
  const before = fs.statSync(src).size;
  fs.writeFileSync(out, minifyHTML(fs.readFileSync(src, 'utf8')));
  const after  = fs.statSync(out).size;
  console.log(`  ${f.padEnd(20)}  ${kb(before).padStart(8)}  →  ${kb(after).padStart(8)}`);
});

// style.css (minified)
{
  const src = path.join(SRC, 'style.css');
  const out = path.join(DIST, 'style.css');
  const before = fs.statSync(src).size;
  fs.writeFileSync(out, minifyCSS(fs.readFileSync(src, 'utf8')));
  const after = fs.statSync(out).size;
  console.log(`  style.css             ${kb(before).padStart(8)}  →  ${kb(after).padStart(8)}`);
}

// script.js (copied as-is — regex JS minification is unsafe)
{
  const src = path.join(SRC, 'script.js');
  const out = path.join(DIST, 'script.js');
  fs.copyFileSync(src, out);
  console.log(`  script.js             ${fileSize(out).padStart(8)}     (copied)`);
}

// assets/
if (fs.existsSync(path.join(SRC, 'assets'))) {
  copyDir(path.join(SRC, 'assets'), path.join(DIST, 'assets'));
  console.log(`  assets/               ${kb(dirSize(path.join(DIST, 'assets'))).padStart(8)}     (copied)`);
}

// Summary
const total = kb(dirSize(DIST));
const ms    = Date.now() - t0;
console.log(`\n✨ Build complete in ${ms} ms`);
console.log(`   Output:   dist/ (${total})`);
console.log(`   Preview:  npm run preview   →  http://127.0.0.1:5501/\n`);
