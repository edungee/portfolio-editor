#!/usr/bin/env node
'use strict';
// Builds dist/portfolio-editor.zip for hosts that install skills by upload (e.g. Claude.ai, ChatGPT).
// Zero-dependency, deterministic (fixed timestamps, sorted entries). Usage: node scripts/package.cjs [output.zip]
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.resolve(__dirname, '..');
const NAME = 'portfolio-editor'; // must equal SKILL.md `name` and the folder inside the archive
const INCLUDE = ['SKILL.md', 'LICENSE', 'README.md', 'SECURITY.md', 'package.json', 'references', 'examples', 'scripts'];
const EXCLUDE = new Set(['scripts/package.cjs']);

const CRC_TABLE = Array.from({length: 256}, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { let c = 0xffffffff; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

function collect() {
  const files = [];
  const walk = rel => {
    const abs = path.join(ROOT, rel), st = fs.lstatSync(abs);
    if (st.isSymbolicLink()) throw new Error('Refusing to package symlink: ' + rel);
    if (st.isDirectory()) { for (const e of fs.readdirSync(abs)) if (e !== '.DS_Store') walk(path.posix.join(rel, e)); }
    else if (!EXCLUDE.has(rel)) files.push(rel);
  };
  for (const entry of INCLUDE) walk(entry);
  return files.sort();
}

function checkSkill() {
  const text = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf8');
  const {parse} = require('./lib/frontmatter.cjs');
  const {data} = parse(text);
  const fail = m => { throw new Error('SKILL.md frontmatter: ' + m); };
  if (data.name !== NAME) fail('name must be ' + NAME);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(data.name) || data.name.length > 64) fail('invalid name');
  if (typeof data.description !== 'string' || !data.description.trim() || data.description.length > 1024) fail('description must be 1-1024 characters');
  if (data.compatibility !== undefined && (typeof data.compatibility !== 'string' || data.compatibility.length > 500)) fail('compatibility must be at most 500 characters');
  for (const [, link] of text.matchAll(/\]\(([^)#]+)\)/g)) if (!/^https?:/.test(link) && !fs.existsSync(path.join(ROOT, link))) fail('broken link ' + link);
  return data;
}

function zip(entries) {
  const locals = [], centrals = []; let offset = 0;
  const DOS_TIME = 0, DOS_DATE = (2026 - 1980) << 9 | 1 << 5 | 1; // fixed 2026-01-01 00:00 for reproducible builds
  for (const {name, data, mode} of entries) {
    const nameBuf = Buffer.from(name, 'utf8'), deflated = zlib.deflateRawSync(data, {level: 9}), crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(8, 8);
    local.writeUInt16LE(DOS_TIME, 10); local.writeUInt16LE(DOS_DATE, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(deflated.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(0x0314, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10); central.writeUInt16LE(DOS_TIME, 12); central.writeUInt16LE(DOS_DATE, 14); central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(deflated.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(((0o100000 | mode) << 16) >>> 0, 38); central.writeUInt32LE(offset, 42);
    locals.push(local, nameBuf, deflated); centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + deflated.length;
  }
  const cd = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

function build(out = path.join(ROOT, 'dist', NAME + '.zip')) {
  const meta = checkSkill();
  const files = collect();
  const entries = files.map(rel => ({name: NAME + '/' + rel, data: fs.readFileSync(path.join(ROOT, rel)), mode: fs.statSync(path.join(ROOT, rel)).mode & 0o111 ? 0o755 : 0o644}));
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, zip(entries));
  return {output: out, version: meta.metadata?.version, files: files.length, bytes: fs.statSync(out).size};
}

module.exports = {build, collect, checkSkill};
if (require.main === module) {
  try { console.log(JSON.stringify(build(process.argv[2] && path.resolve(process.argv[2])), null, 2)); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
