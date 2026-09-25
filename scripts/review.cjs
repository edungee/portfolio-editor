'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const digest=require('node:crypto');
const sha=value=>digest.createHash('sha256').update(value).digest('hex');
function save(file,data){fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{mode:0o600});}
function render(report,runDir){
 const previewFile=path.join(runDir,'preview.json');
 const preview=fs.existsSync(previewFile)?JSON.parse(fs.readFileSync(previewFile,'utf8')):null;
 const accepted=report.decisions.filter(d=>d.decision==='include');
 const lines=['# Portfolio update review','',`Run: ${report.runId}`,`Baseline commit: ${report.baselineCommit}`,`Coverage: ${report.status}`,'',
 report.proposals.length?`**${report.proposals.length} proposed milestone(s) across ${new Set(report.proposals.map(p=>p.project)).size} project(s).**`:'**No proposed content changes. No content PR is needed.**','',
 '## Preview',''];
 if(preview?.status==='verified'){
   lines.push(`[Open combined preview](${preview.url})`,`Checked: ${preview.checkedAt}. Temporary preview; availability depends on the running server${preview.url.includes('trycloudflare')?' and tunnel':''}.`,
   ...(preview.routes||[]).map(route=>`- [${route}](${preview.url}${route})`));
 }else lines.push(preview?.status==='failed'?`Preview unavailable: ${preview.error}`:'Preview has not been verified. Do not present a working link yet.');
 if(preview?.visualReview) lines.push('Visual inspection: '+preview.visualReview);
 if(!report.proposals.length) lines.push('This preview, if started, shows the unchanged baseline—not a proposed update.');
 for(const p of report.proposals){
  const d=accepted.find(d=>d.project===p.project && d.milestoneId===p.milestone.id);
  lines.push('',`## ${p.project} — ${p.milestone.title}`,'',`**Change:** Add ${p.milestone.kind} milestone dated ${p.milestone.date}.`,
    '**Before:** This milestone is absent from the baseline.',`**After:** ${p.milestone.summary}`,`**Why selected:** ${d?.reason||'See candidate decision.'}`,`**Public rationale:** ${p.milestone.rationale}`,`**Public evidence wording:** ${p.milestone.evidence}`,`**File:** content/projects/${p.project}.md`);
 }
 lines.push('','## Deferred and ignored','');
 for(const d of report.decisions.filter(d=>d.decision!=='include')) lines.push(`- **${d.decision} · ${d.project}:** ${d.claim} — ${d.reason}`);
 lines.push('','## Coverage and checks','');
 for(const s of report.coverage)lines.push(`- ${s.id}: ${s.status}. ${s.note}`);
 lines.push('','Structural and editorial gates passed for any included proposals. Site build and human review are separate checks. A verified preview confirms HTTP availability and snapshot identity; it does not prove all visual behavior is correct.','',
 'Private review: do not copy this entire file into a public PR. Use PR-SUMMARY.md for the public-safe summary and review that file before posting.');
 fs.writeFileSync(path.join(runDir,'REVIEW.md'),lines.join('\n')+'\n',{mode:0o600});
 const publicLines=['## Proposed portfolio changes',''];
 if(!report.proposals.length)publicLines.push('No content changes proposed.');
 for(const p of report.proposals)publicLines.push(`- **${p.project}:** ${p.milestone.title} (${p.milestone.date}) — ${p.milestone.summary}`);
 publicLines.push('','## Validation','','Content metadata and evidence gates checked. Site build and editorial review pending.');
 if(preview?.status==='verified' && preview.url.startsWith('https://'))publicLines.push('',`[Temporary preview](${preview.url}) — checked ${preview.checkedAt}; may expire.`);
 fs.writeFileSync(path.join(runDir,'PR-SUMMARY.md'),publicLines.join('\n')+'\n',{mode:0o600});
}
module.exports={render,sha,save};
