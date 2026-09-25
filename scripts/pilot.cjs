#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {render,sha} = require('./review.cjs');
const hash = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function check(ok, message) { if (!ok) throw new Error(message); }
function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function write(file, data) {
  const temp = file + '.tmp-' + crypto.randomUUID();
  fs.writeFileSync(temp, JSON.stringify(data, null, 2) + '\n', {mode:0o600});
  fs.renameSync(temp, file);
}
function date(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
function outside(dir, repo) { return dir !== repo && !dir.startsWith(repo + path.sep); }
function snapshot(repo) {
  const matter = require('gray-matter');
  const projects = {};
  for (const filename of fs.readdirSync(path.join(repo, 'content/projects')).filter(f => /\.md$/.test(f))) {
    const raw = fs.readFileSync(path.join(repo,'content/projects',filename),'utf8');
    const data = matter(raw).data;
    check(data.slug === filename.slice(0,-3), 'Project slug mismatch: ' + filename);
    check(date(data.date), 'Invalid project date: ' + filename);
    const ids = new Set();
    for (const m of data.milestones || []) {
      check(typeof m.id === 'string' && /^[a-z0-9-]+$/.test(m.id) && !ids.has(m.id), 'Invalid or duplicate milestone ID: '+filename);
      check(date(m.date), 'Invalid milestone date: '+filename);
      for (const k of ['title','summary','kind','rationale']) check(typeof m[k] === 'string' && m[k].trim(), 'Missing milestone '+k);
      ids.add(m.id);
    }
    projects[data.slug] = {data, raw, revision:hash(raw)};
  }
  return projects;
}
function run(configFile, batchFile, now = new Date().toISOString()) {
  const config = read(configFile), batch = read(batchFile);
  check(config.version === 1 && batch.version === 1, 'Unsupported schema version');
  const repo = fs.realpathSync(config.repository);
  check(path.isAbsolute(config.stateDirectory), 'State directory must be absolute');
  check(outside(path.resolve(config.stateDirectory), repo), 'Private state must be outside repository');
  fs.mkdirSync(config.stateDirectory,{recursive:true,mode:0o700});
  const dir = fs.realpathSync(config.stateDirectory);
  check(outside(dir,repo), 'Private state symlink points inside repository');
  for (let ancestor = dir; ; ancestor = path.dirname(ancestor)) {
    check(!fs.existsSync(path.join(ancestor,'.git')), 'Private state cannot be inside a Git repository');
    if (path.dirname(ancestor) === ancestor) break;
  }
  const lock = path.join(dir,'run.lock');
  const fd = fs.openSync(lock,'wx',0o600);
  fs.writeFileSync(fd, JSON.stringify({pid:process.pid,startedAt:now}));
  try {
    check(config.mode === 'private-dry-run', 'This pilot only supports private-dry-run');
    const projects = snapshot(repo);
    const stateFile = path.join(dir,'state.json');
    const state = fs.existsSync(stateFile) ? read(stateFile) : {version:1,checkpoints:{},decisions:{}};
    check(state.version === 1,'Unsupported state schema');
    check(Array.isArray(batch.sources) && Array.isArray(batch.candidates), 'Invalid batch');
    const allowed = new Map(config.sources.map(s=>[s.id,s]));
    check(allowed.size === config.sources.length,'Duplicate registered source');
    const sources = new Map();
    for (const s of batch.sources) {
      check(allowed.has(s.id) && !sources.has(s.id), 'Unknown or duplicate source: '+s.id);
      check(['ok','partial','error'].includes(s.status),'Invalid source status');
      check(typeof s.note === 'string','Source coverage note required');
      if (s.status === 'ok') check(s.complete === true && typeof s.revision === 'string' && s.revision && typeof s.evidence === 'string' && s.evidence.trim(),'Successful source needs complete evidence and revision');
      sources.set(s.id,s);
    }
    const coverage = config.sources.map(s => sources.get(s.id) || {id:s.id,status:'error',note:'Source omitted from this run',complete:false});
    const decisions = [], seen = new Set();
    for (const c of batch.candidates) {
      check(typeof c.id === 'string' && /^[a-z0-9-]+$/.test(c.id) && !seen.has(c.id),'Invalid or duplicate candidate ID'); seen.add(c.id);
      check(config.projects.includes(c.project) && projects[c.project], 'Project outside pilot scope');
      check(Array.isArray(c.sourceIds) && c.sourceIds.length && c.sourceIds.every(id => allowed.has(id) && allowed.get(id).project === c.project), 'Invalid candidate sources');
      check(['include','ignore','defer'].includes(c.decision) && typeof c.reason === 'string' && c.reason.trim(), 'Editorial decision and reason required');
      check(typeof c.claim === 'string' && c.claim.trim(), 'Claim required');
      const p = projects[c.project];
      let decision = c.decision, reason = c.reason;
      const supporting = c.sourceIds.map(id=>sources.get(id));
      if (supporting.some(s=>!s || s.status !== 'ok' || s.complete !== true)) { decision='defer'; reason='Incomplete source coverage; '+reason; }
      else if (c.existingMilestoneId && (p.data.milestones||[]).some(m=>m.id===c.existingMilestoneId)) { decision='ignore'; reason='Already represented by milestone '+c.existingMilestoneId; }
      else if (decision === 'include') {
        check(date(c.eventDate) && c.eventDate <= now.slice(0,10), 'Include requires a real, non-future event date');
        check(['decision','implementation','learning','release','publication'].includes(c.kind),'Invalid evidence kind');
        check(typeof c.evidenceQuote === 'string' && c.evidenceQuote.trim() && supporting.some(s=>s.evidence.includes(c.evidenceQuote)), 'Evidence quote must occur in fetched source');
        check(typeof c.milestoneId === 'string' && /^[a-z0-9-]+$/.test(c.milestoneId), 'Stable milestone ID required');
        if ((p.data.milestones||[]).some(m=>m.id===c.milestoneId)) { decision='ignore';reason='Milestone ID already present'; }
        else if (['release','publication'].includes(c.kind) && c.verifiedPublicArtifact !== true) {decision='defer';reason='Release/publication needs separately verified public evidence';}
        else if (c.publicationCleared !== true) {decision='defer';reason='Public disclosure has not been cleared';}
        else {
          for (const field of ['title','summary','rationale','evidence']) check(typeof c.publicCopy?.[field] === 'string' && c.publicCopy[field].trim(), 'Public copy incomplete');
          const copy = JSON.stringify(c.publicCopy);
          check(!/(notion\.(so|com)|chatgpt\.com|\/Users\/|sk-[A-Za-z0-9]|-----BEGIN|@[a-z0-9.-]+\.[a-z]{2,})/i.test(copy), 'Private locator or secret-like text in public copy');
        }
      }
      const fingerprint = hash({candidate:c,sourceRevisions:supporting.map(s=>s?.revision||s?.status||'missing'),portfolio:p.revision,policy:config.policyVersion});
      const previous = state.decisions[c.id];
      const changed = previous?.fingerprint !== fingerprint;
      decisions.push({id:c.id,project:c.project,claim:c.claim,milestoneId:c.milestoneId,decision,reason,changed,fingerprint});
      state.decisions[c.id] = {fingerprint,decision,reason};
    }
    for (const s of coverage) if (s.status === 'ok' && s.complete) state.checkpoints[s.id] = {revision:s.revision,observedAt:now};
    const runId = now.replace(/[:.]/g,'-') + '-' + crypto.randomUUID().slice(0,8);
    const report = {version:1,runId,mode:config.mode,observedAt:now,baselineCommit:execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),baselineFiles:Object.fromEntries(Object.entries(projects).map(([slug,p])=>[slug,sha(p.raw)])),coverage:coverage.map(({evidence,...s})=>s),decisions,
      status:coverage.some(s=>s.status!=='ok')?'partial':'complete',
      proposals:batch.candidates.filter(c=>decisions.some(d=>d.id===c.id && d.decision==='include')).map(c=>({project:c.project,milestone:{id:c.milestoneId,date:c.eventDate,kind:c.kind,title:c.publicCopy.title,summary:c.publicCopy.summary,rationale:c.publicCopy.rationale,evidence:c.publicCopy.evidence}}))};
    const gapSignature = hash(report.coverage.filter(s=>s.status!=='ok').map(s=>({id:s.id,status:s.status,note:s.note})));
    report.notify = decisions.some(d=>d.changed && d.decision!=='ignore') || (report.status==='partial' && state.gapSignature!==gapSignature);
    state.gapSignature = gapSignature;
    const runDir = path.join(dir,'runs',runId); fs.mkdirSync(runDir,{recursive:true,mode:0o700});
    const matter = require('gray-matter');
    const proposedDir = path.join(runDir,'proposed');
    if (report.proposals.length) fs.mkdirSync(proposedDir,{mode:0o700});
    const grouped = new Map();
    for (const proposal of report.proposals) {
      const list = grouped.get(proposal.project) || [];
      check(!list.some(m=>m.id===proposal.milestone.id), 'Two claims propose the same milestone');
      list.push(proposal.milestone); grouped.set(proposal.project,list);
    }
    report.proposedFiles = [];
    report.proposedHashes = {};
    fs.mkdirSync(path.join(runDir,'before'),{mode:0o700});
    for (const [slug, milestones] of grouped) {
      const parsed = matter(projects[slug].raw);
      const proposedData = {...parsed.data, milestones:[...(parsed.data.milestones||[]),...milestones]};
      const target = path.join(proposedDir,slug+'.md');
      fs.writeFileSync(target,matter.stringify(parsed.content,proposedData),{mode:0o600});
      report.proposedFiles.push(target);
      report.proposedHashes[slug] = sha(fs.readFileSync(target));
      fs.writeFileSync(path.join(runDir,'before',slug+'.md'),projects[slug].raw,{mode:0o600});
    }
    write(path.join(runDir,'input.json'),batch);
    render(report,runDir);
    write(path.join(runDir,'report.json'),report);
    write(path.join(dir,'latest.json'),report);
    state.lastRun = runId; write(stateFile,state);
    return {reportPath:path.join(runDir,'report.json'),status:report.status,notify:report.notify,proposals:report.proposals.length,decisions:decisions.map(({id,decision,changed})=>({id,decision,changed}))};
  } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
}
module.exports = {run,snapshot};
if(require.main===module) {
  try { check(process.argv.length===4,'Usage: node pilot.cjs /absolute/config.json /absolute/batch.json'); console.log(JSON.stringify(run(process.argv[2],process.argv[3]),null,2)); }
  catch(e) { console.error(e.message); process.exitCode=1; }
}
