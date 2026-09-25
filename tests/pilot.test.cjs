const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {run}=require('../scripts/pilot.cjs');
const {fixture}=require('../scripts/fixture.cjs');
function setup(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-pilot-test-'));
 const repo=fixture(path.join(root,'site'));
 const config={version:1,mode:'private-dry-run',repository:repo,stateDirectory:path.join(root,'state'),policyVersion:'v1',projects:['sample-project'],sources:[{id:'git',project:'sample-project'}]};
 const batch={version:1,sources:[{id:'git',status:'ok',complete:true,revision:'1',note:'Fixture only',evidence:'The experiment found confusing plan labels.'}],candidates:[{id:'test-learning',project:'sample-project',sourceIds:['git'],claim:'A test finding',decision:'include',reason:'Meaningful learning',eventDate:'2026-09-20',kind:'learning',evidenceQuote:'confusing plan labels',milestoneId:'test-learning',publicationCleared:true,publicCopy:{title:'Test finding',summary:'Found confusing labels.',rationale:'Improve comprehension.',evidence:'A controlled fixture, not real work.'}}]};
 const c=path.join(root,'config.json'),b=path.join(root,'batch.json');
 const save=()=>{fs.writeFileSync(c,JSON.stringify(config));fs.writeFileSync(b,JSON.stringify(batch));};
 return {root,repo,config,batch,save,exec:()=>{save();return run(c,b,'2026-09-24T12:00:00.000Z');},cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
function scenario(name,fn){test(name,()=>{const x=setup();try{fn(x);}finally{x.cleanup();}});}
scenario('unchanged evidence yields one proposal and no repeat notification',x=>{assert.equal(x.exec().notify,true);const r=x.exec();assert.equal(r.proposals,1);assert.equal(r.notify,false);});
scenario('existing milestone prevents duplicate',x=>{x.batch.candidates[0].existingMilestoneId='existing-milestone';assert.equal(x.exec().proposals,0);});
scenario('partial source defers and cannot advance checkpoint',x=>{x.exec();x.batch.sources[0].status='partial';x.batch.sources[0].complete=false;x.batch.sources[0].revision='2';assert.equal(x.exec().proposals,0);assert.equal(JSON.parse(fs.readFileSync(path.join(x.config.stateDirectory,'state.json'))).checkpoints.git.revision,'1');assert.equal(x.exec().notify,false);});
scenario('missing source is a coverage failure',x=>{x.batch.sources=[];assert.equal(x.exec().status,'partial');});
scenario('fabricated quote rejected',x=>{x.batch.candidates[0].evidenceQuote='does not occur';assert.throws(()=>x.exec(),/quote/);});
scenario('invalid calendar date rejected',x=>{x.batch.candidates[0].eventDate='2026-02-30';assert.throws(()=>x.exec(),/date/);});
scenario('private Notion links rejected from public copy',x=>{x.batch.candidates[0].publicCopy.evidence='https://app.notion.com/p/private';assert.throws(()=>x.exec(),/Private/);});
scenario('publication needs independent verification',x=>{x.batch.candidates[0].kind='publication';assert.equal(x.exec().proposals,0);});
scenario('unapproved disclosure deferred',x=>{x.batch.candidates[0].publicationCleared=false;assert.equal(x.exec().proposals,0);});
scenario('unknown source rejected',x=>{x.batch.sources[0].id='other';assert.throws(()=>x.exec(),/source/);});
scenario('private state inside repository rejected',x=>{x.config.stateDirectory=path.join(x.repo,'private-data');assert.throws(()=>x.exec(),/outside/);});
scenario('overlapping writer rejected without deleting its lock',x=>{fs.mkdirSync(x.config.stateDirectory);const lock=path.join(x.config.stateDirectory,'run.lock');fs.writeFileSync(lock,'active');assert.throws(()=>x.exec(),/EEXIST/);assert.equal(fs.readFileSync(lock,'utf8'),'active');});
scenario('malformed batch releases lock and leaves checkpoint unchanged',x=>{x.exec();const before=fs.readFileSync(path.join(x.config.stateDirectory,'state.json'),'utf8');x.batch.candidates[0].project='../escape';assert.throws(()=>x.exec(),/scope/);assert.equal(fs.existsSync(path.join(x.config.stateDirectory,'run.lock')),false);assert.equal(fs.readFileSync(path.join(x.config.stateDirectory,'state.json'),'utf8'),before);});
const {prepare,verify}=require('../scripts/preview.cjs');
scenario('private review has reasons; public PR summary excludes private reasons',x=>{x.batch.candidates[0].reason='Private source detail';const result=x.exec();const dir=path.dirname(result.reportPath);assert.match(fs.readFileSync(path.join(dir,'REVIEW.md'),'utf8'),/Private source detail/);assert.doesNotMatch(fs.readFileSync(path.join(dir,'PR-SUMMARY.md'),'utf8'),/Private source detail/);});
scenario('preview includes proposed Markdown and excludes private evidence',x=>{const result=x.exec();const preview=prepare(path.join(x.root,'config.json'),result.reportPath);assert.match(fs.readFileSync(path.join(preview.directory,'content/projects/sample-project.md'),'utf8'),/test-learning/);assert.doesNotMatch(fs.readFileSync(path.join(x.repo,'content/projects/sample-project.md'),'utf8'),/test-learning/);assert.equal(fs.existsSync(path.join(preview.directory,'input.json')),false);assert.equal(fs.existsSync(path.join(preview.directory,'.next')),false);assert.ok(preview.routes.includes('/projects/sample-project/history#test-learning'));});
scenario('preview refuses content changed after proposal generation',x=>{const result=x.exec();fs.appendFileSync(path.join(path.dirname(result.reportPath),'proposed/sample-project.md'),'tamper');assert.throws(()=>prepare(path.join(x.root,'config.json'),result.reportPath),/changed after review/);});
test('preview verification checks snapshot identity and clears stale URLs on failure',async()=>{const x=setup();const http=require('node:http');let identity;const server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({contentId:identity}));});try{const result=x.exec();const preview=prepare(path.join(x.root,'config.json'),result.reportPath);identity=preview.contentId;await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;assert.equal((await verify(path.join(x.root,'config.json'),result.reportPath,url)).status,'verified');identity='wrong';await assert.rejects(verify(path.join(x.root,'config.json'),result.reportPath,url),/different snapshot/);const stored=JSON.parse(fs.readFileSync(path.join(path.dirname(result.reportPath),'preview.json')));assert.equal(stored.status,'failed');assert.equal(stored.url,undefined);}finally{await new Promise(resolve=>server.close(resolve));x.cleanup();}});
