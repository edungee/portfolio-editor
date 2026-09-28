#!/usr/bin/env node
'use strict';
// Git preparation only. The host creates/updates the draft PR using its authenticated connector.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {sha} = require('./review.cjs');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const check = (ok, message) => { if (!ok) throw new Error(message); };
// Managed head-branch prefix. Earlier releases used 'codex/portfolio-editor-'; hosts must still recognise it.
const BRANCH_PREFIX = 'portfolio-editor/';
const LEGACY_BRANCH_PREFIXES = ['codex/portfolio-editor-'];
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], {encoding:'utf8', stdio:['ignore','pipe','pipe']}).trim();
function inspect(configPath, reportPath) {
 const config = read(configPath), report = read(reportPath), runDir = fs.realpathSync(path.dirname(reportPath));
 check(config.delivery?.mode === 'draft-pr', 'Draft PR delivery is not enabled');
 check(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(config.delivery.repository), 'Invalid GitHub repository');
 check(/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(config.delivery.baseBranch), 'Invalid base branch');
 check(report.proposals?.length > 0, 'No changes to deliver');
 const stateDir = fs.realpathSync(config.stateDirectory);
 check(runDir.startsWith(stateDir + path.sep), 'Report must be in private state');
 const preview = read(path.join(runDir,'preview.json'));
 check(preview.status === 'verified', 'Verified preview required');
 const contentId = sha(JSON.stringify({baseline:report.baselineCommit,files:report.proposedHashes}));
 check(preview.contentId === contentId && preview.baselineCommit === report.baselineCommit, 'Preview snapshot mismatch');
 check(Date.now()-Date.parse(preview.checkedAt) >= 0 && Date.now()-Date.parse(preview.checkedAt) < 30*60*1000, 'Preview verification expired');
 const files = Object.keys(report.proposedHashes || {}).sort();
 check(files.length > 0 && files.every(s => /^[a-z0-9-]+$/.test(s) && config.projects.includes(s)), 'Invalid proposal paths');
 check(JSON.stringify([...new Set(report.proposals.map(p=>p.project))].sort()) === JSON.stringify(files), 'Proposal set mismatch');
 for (const slug of files) {
  const source = path.join(runDir,'proposed',slug+'.md');
  check(fs.lstatSync(source).isFile() && !fs.lstatSync(source).isSymbolicLink(), 'Proposal must be a regular file');
  check(sha(fs.readFileSync(source)) === report.proposedHashes[slug], 'Proposal changed after preview');
  check(sha(fs.readFileSync(path.join(preview.directory,'content/projects',slug+'.md'))) === report.proposedHashes[slug], 'Served proposal differs');
 }
 return {config, report, runDir, preview, files, contentId};
}
function prepare(configPath, reportPath) {
 const x=inspect(configPath,reportPath), {config,report,runDir,files,contentId}=x;
 const remote='git@github.com:'+config.delivery.repository+'.git';
 const base=config.delivery.baseBranch;
 const live=git(config.repository,'ls-remote',remote,'refs/heads/'+base).split(/\s/)[0];
 check(live===report.baselineCommit, 'Default branch moved; regenerate proposal and preview');
 const branch=BRANCH_PREFIX+contentId.slice(0,16);
 const checkout=path.join(runDir,'delivery-repo');
 const record=path.join(runDir,'delivery.json');
 if(fs.existsSync(checkout)) {
  check(fs.existsSync(record), 'Interrupted preparation; inspect existing delivery checkout');
  const old=read(record);
  check(old.contentId===contentId && git(checkout,'rev-parse','HEAD')===old.commit, 'Delivery checkout changed');
  check(!git(checkout,'status','--porcelain'), 'Delivery checkout is dirty');
  return old;
 }
 git(runDir,'clone','--no-hardlinks','--no-checkout',config.repository,checkout);
 git(checkout,'remote','set-url','origin',remote);
 git(checkout,'checkout','-b',branch,report.baselineCommit);
 for(const slug of files)fs.copyFileSync(path.join(runDir,'proposed',slug+'.md'),path.join(checkout,'content/projects',slug+'.md'));
 git(checkout,'add','--',...files.map(s=>'content/projects/'+s+'.md'));
 const actual=git(checkout,'diff','--cached','--name-only').split('\n').sort();
 check(JSON.stringify(actual)===JSON.stringify(files.map(s=>'content/projects/'+s+'.md')), 'Unexpected or empty patch');
 git(checkout,'diff','--cached','--check');
 git(checkout,'commit','-m','Update portfolio milestones');
 const result={repository:config.delivery.repository,base,branch,baseline:report.baselineCommit,commit:git(checkout,'rev-parse','HEAD'),contentId,checkout,status:'prepared'};
 fs.writeFileSync(record,JSON.stringify(result,null,2)+'\n',{mode:0o600});
 return result;
}
function push(configPath,reportPath) {
 const x=inspect(configPath,reportPath), d=prepare(configPath,reportPath);
 const remote=git(d.checkout,'config','--get','remote.origin.url');
 check(remote==='git@github.com:'+d.repository+'.git','Unexpected remote');
 const parent=git(d.checkout,'rev-parse','HEAD^');
 check(parent===d.baseline,'Unexpected delivery history');
 const names=git(d.checkout,'diff','--name-only',d.baseline,'HEAD').split('\n').sort();
 check(JSON.stringify(names)===JSON.stringify(x.files.map(s=>'content/projects/'+s+'.md')),'Unexpected committed files');
 for(const slug of x.files) {
  const blob=execFileSync('git',['-C',d.checkout,'show','HEAD:content/projects/'+slug+'.md']);
  check(sha(blob)===x.report.proposedHashes[slug],'Committed proposal mismatch');
 }
 const existing=git(d.checkout,'ls-remote',remote,'refs/heads/'+d.branch).split(/\s/)[0];
 check(!existing || existing===d.commit,'Remote branch changed; never overwrite it');
 if(!existing)git(d.checkout,'push','origin','HEAD:refs/heads/'+d.branch);
 check(git(d.checkout,'ls-remote',remote,'refs/heads/'+d.branch).split(/\s/)[0]===d.commit,'Push not verified');
 d.status='pushed';fs.writeFileSync(path.join(x.runDir,'delivery.json'),JSON.stringify(d,null,2)+'\n',{mode:0o600});return d;
}
function locked(fn,c,r) {
 const lock=path.join(read(c).stateDirectory,'delivery.lock');
 const fd=fs.openSync(lock,'wx',0o600);fs.writeFileSync(fd,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));
 try{return fn(c,r);}finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
module.exports={BRANCH_PREFIX,LEGACY_BRANCH_PREFIXES,inspect,prepare:(c,r)=>locked(prepare,c,r),push:(c,r)=>locked(push,c,r)};
if(require.main===module){try{const [mode,c,r]=process.argv.slice(2);check(['inspect','prepare','push'].includes(mode)&&c&&r,'Usage: delivery.cjs inspect|prepare|push CONFIG REPORT');const result=mode==='inspect'?{contentId:inspect(c,r).contentId}:mode==='prepare'?locked(prepare,c,r):locked(push,c,r);console.log(JSON.stringify(result,null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
