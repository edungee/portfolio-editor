#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const {sha,save,render}=require('./review.cjs');
function check(ok,message){if(!ok)throw new Error(message);}
function load(configPath,reportPath){
 const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
 const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
 const runDir=fs.realpathSync(path.dirname(reportPath));
 const state=fs.realpathSync(config.stateDirectory);
 check(runDir.startsWith(path.join(state,'runs')+path.sep),'Report must be in private run history');
 check(/^[a-f0-9]{40}$/.test(report.baselineCommit),'Report lacks pinned baseline; rerun collection');
 return {config,report,runDir};
}
function prepare(configPath,reportPath){
 const {config,report,runDir}=load(configPath,reportPath);
 const repo=fs.realpathSync(config.repository);
 const previewRoot=path.join(runDir,'site-preview');
 check(!fs.existsSync(previewRoot),'Preview already prepared; reuse it or create a new run');
 // Require a committed baseline: never silently copy unrelated working-tree changes.
 check(execFileSync('git',['-C',repo,'status','--porcelain','--untracked-files=no'],{encoding:'utf8'}).trim()==='', 'Tracked local edits present; use a clean checkout');
 for(const [slug,revision] of Object.entries(report.baselineFiles)){
  check(/^[a-z0-9-]+$/.test(slug),'Invalid project slug');
  const raw=execFileSync('git',['-C',repo,'show',`${report.baselineCommit}:content/projects/${slug}.md`]);
  check(sha(raw)===revision,'Baseline differs from collected content: '+slug);
 }
 for(const p of report.proposals){
  check(/^[a-z0-9-]+$/.test(p.project),'Invalid proposal path');
  const proposed=path.join(runDir,'proposed',p.project+'.md');
  check(sha(fs.readFileSync(proposed))===report.proposedHashes[p.project],'Proposal changed after review: '+p.project);
 }
 fs.mkdirSync(previewRoot,{mode:0o700});
 const archive=path.join(runDir,'baseline.tar');
 try{
  execFileSync('git',['-C',repo,'archive','--format=tar','--output',archive,report.baselineCommit]);
  execFileSync('tar',['-xf',archive,'-C',previewRoot]);
 }finally{if(fs.existsSync(archive))fs.unlinkSync(archive);}
 // Only the site snapshot and vetted content enter the server root, never input/report/state.
 for(const slug of new Set(report.proposals.map(p=>p.project)))fs.copyFileSync(path.join(runDir,'proposed',slug+'.md'),path.join(previewRoot,'content/projects',slug+'.md'));
 fs.symlinkSync(path.join(repo,'node_modules'),path.join(previewRoot,'node_modules'),'dir');
 const routes=['/','/projects',...new Set(report.proposals.flatMap(p=>[`/projects/${p.project}`,`/projects/${p.project}/history#${p.milestone.id}`]))];
 const contentId=sha(JSON.stringify({baseline:report.baselineCommit,files:report.proposedHashes}));
 fs.mkdirSync(path.join(previewRoot,'public'),{recursive:true});
 save(path.join(previewRoot,'public','portfolio-preview-manifest.json'),{contentId});
 const manifest={status:'prepared',directory:previewRoot,contentId,routes,baselineCommit:report.baselineCommit};
 save(path.join(runDir,'preview.json'),manifest);render(report,runDir);
 return manifest;
}
async function verify(configPath,reportPath,url){
 const {report,runDir}=load(configPath,reportPath);
 const file=path.join(runDir,'preview.json'),preview=JSON.parse(fs.readFileSync(file,'utf8'));
 try{
  const origin=new URL(url);
  check(origin.pathname==='/' && !origin.search && !origin.hash && !origin.username && !origin.password,'Use a bare preview origin');
  check((origin.protocol==='http:' && ['127.0.0.1','localhost'].includes(origin.hostname)) || (origin.protocol==='https:' && /^[a-z0-9-]+\.trycloudflare\.com$/.test(origin.hostname)), 'Only local or temporary Cloudflare preview origins supported');
  const fetchPage=async route=>{const response=await fetch(origin.origin+route,{redirect:'error',signal:AbortSignal.timeout(60000)});check(response.ok,'Preview HTTP '+response.status+' at '+route);return response;};
  const manifest=await (await fetchPage('/portfolio-preview-manifest.json')).json();
  check(manifest.contentId===preview.contentId,'Preview serves a different snapshot');
  for(const route of preview.routes)await fetchPage(route.split('#')[0]);
  Object.assign(preview,{status:'verified',url:origin.origin,checkedAt:new Date().toISOString()});delete preview.error;
 }catch(e){Object.assign(preview,{status:'failed',error:e.message,checkedAt:new Date().toISOString()});delete preview.url;save(file,preview);render(report,runDir);throw e;}
 save(file,preview);render(report,runDir);return preview;
}
module.exports={prepare,verify};
if(require.main===module){(async()=>{const [mode,config,report,url]=process.argv.slice(2);check(['prepare','verify'].includes(mode)&&config&&report,'Usage: preview.cjs prepare|verify CONFIG REPORT [URL]');console.log(JSON.stringify(mode==='prepare'?prepare(config,report):await verify(config,report,url),null,2));})().catch(e=>{console.error(e.message);process.exitCode=1;});}
