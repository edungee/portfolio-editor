'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
function fixture(repo){
 fs.mkdirSync(path.join(repo,'content/projects'),{recursive:true});fs.mkdirSync(path.join(repo,'public'));
 fs.writeFileSync(path.join(repo,'package.json'),'{}\n');
 fs.writeFileSync(path.join(repo,'.gitignore'),'node_modules/\n.next/\n');
 fs.writeFileSync(path.join(repo,'content/projects/sample-project.md'),`---
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
`);
 const git=args=>execFileSync('git',['-C',repo,...args],{stdio:'pipe'});
 git(['init','-q']);git(['add','.']);git(['-c','user.name=Test Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','commit','-qm','Create synthetic fixture']);
 fs.symlinkSync(path.resolve(__dirname,'../node_modules'),path.join(repo,'node_modules'),'dir');return fs.realpathSync(repo);
}
module.exports={fixture};
