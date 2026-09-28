'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fm = require('../scripts/lib/frontmatter.cjs');

const fixture = `---
title: Sample project
slug: sample-project
date: '2026-01-01'
milestones:
  - id: existing-milestone
    date: '2026-01-01'
    title: Defined the experiment
    summary: Established a synthetic test case.
    kind: decision
    rationale: Exercise the workflow without personal evidence.
---

## What this is
Synthetic test content, not a real project or a running website.
`;
const added = {id: 'new-one', date: '2026-02-03', kind: 'learning', title: 'Colon: "quotes" & ünïcode', summary: 'Line one\nline two', rationale: '#not a comment', evidence: 'yes'};
const cases = {
  fixture,
  crlf: fixture.replace(/\n/g, '\r\n'),
  bom: '﻿' + fixture,
  noBody: '---\ntitle: T\nslug: t\ndate: \'2026-01-01\'\n---\n',
  noTrailingNewline: '---\ntitle: T\n---\nbody',
  emptyMilestones: '---\ntitle: T\nslug: t\nmilestones: []\n---\n\nBody\n',
  commentsOnly: '---\n# just a comment\n---\nBody\n',
  yamlTag: '---yaml\ntitle: T\n---\nBody\n',
  noFrontMatter: 'Just a body\n',
  empty: '',
};
const transform = raw => { const p = fm.parse(raw); return fm.stringify(p.content, {...p.data, milestones: [...(p.data.milestones || []), added]}); };

test('fixture proposal output is stable (golden)', () => {
  const out = transform(fixture);
  assert.match(out, /^---\ntitle: Sample project\nslug: sample-project\ndate: '2026-01-01'\nmilestones:\n/);
  assert.match(out, /  - id: new-one\n    date: '2026-02-03'\n/);
  assert.ok(out.endsWith('---\n\n## What this is\nSynthetic test content, not a real project or a running website.\n'));
  assert.deepEqual(fm.parse(out).data.milestones.at(-1), added);
});

test('rejects non-YAML front matter languages', () => {
  assert.throws(() => fm.parse('---json\n{}\n---\n'), /Unsupported/);
});

let matter = null;
try { matter = require('gray-matter'); } catch {}
test('byte-identical to gray-matter 4.0.3 for parse and stringify', {skip: matter ? false : 'gray-matter dev dependency not installed'}, () => {
  for (const [name, raw] of Object.entries(cases)) {
    const theirs = matter(raw), ours = fm.parse(raw);
    assert.deepEqual(ours.data, theirs.data, name + ': data');
    assert.equal(ours.content, theirs.content, name + ': content');
    const theirOut = matter.stringify(theirs.content, {...theirs.data, milestones: [...(theirs.data.milestones || []), added]});
    assert.equal(transform(raw), theirOut, name + ': stringify');
  }
});
