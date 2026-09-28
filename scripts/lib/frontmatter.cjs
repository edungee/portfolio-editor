'use strict';
// Minimal YAML front-matter parse/stringify with no npm install step.
// Mirrors the gray-matter 4.0.3 behaviour this skill previously relied on
// (default '---' delimiters, YAML only); tests/frontmatter.test.cjs checks parity.
const yaml = require('../vendor/js-yaml.min.js');

const OPEN = '---';
const CLOSE = '\n---';
const newline = s => (s.slice(-1) !== '\n' ? s + '\n' : s);
const stripBom = s => (s.charCodeAt(0) === 0xfeff ? s.slice(1) : s);

function parse(input) {
  const str0 = stripBom(String(input));
  if (str0 === '' || !str0.startsWith(OPEN) || str0.charAt(OPEN.length) === '-') return {data: {}, content: str0};
  let str = str0.slice(OPEN.length);
  const eol = str.search(/\r?\n/);
  const language = str.slice(0, eol);
  if (language.trim() && language.trim().toLowerCase() !== 'yaml') throw new Error('Unsupported front-matter language: ' + language.trim());
  if (language) str = str.slice(language.length);
  let closeIndex = str.indexOf(CLOSE);
  if (closeIndex === -1) closeIndex = str.length;
  const block = str.slice(0, closeIndex);
  const data = block.replace(/^\s*#[^\n]+/gm, '').trim() === '' ? {} : yaml.safeLoad(block);
  let content = '';
  if (closeIndex !== str.length) {
    content = str.slice(closeIndex + CLOSE.length);
    if (content[0] === '\r') content = content.slice(1);
    if (content[0] === '\n') content = content.slice(1);
  }
  return {data: data && typeof data === 'object' && !Array.isArray(data) ? data : {}, content};
}

// Equivalent to gray-matter's matter.stringify(content, data).
function stringify(content, data) {
  const body = parse(content); // a body that itself starts with front matter merges, as gray-matter did
  const merged = Object.assign({}, body.data, data);
  const dumped = yaml.safeDump(merged).trim();
  const head = dumped !== '{}' ? newline(OPEN) + newline(dumped) + newline(OPEN) : '';
  return head + newline(body.content);
}

module.exports = {parse, stringify};
