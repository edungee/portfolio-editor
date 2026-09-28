'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), os=require('node:os'), path=require('node:path');
const {execFileSync}=require('node:child_process');
const {sha}=require('../scripts/review.cjs');
const {inspect,prepare,push,BRANCH_PREFIX,LEGACY_BRANCH_PREFIXES}=require('../scripts/delivery.cjs');
function setup(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'delivery-test-'));
 const git=(cwd,...a)=>execFileSync('git',['-C',cwd,...a],{encoding:'utf8',stdio:'pipe'}).trim();
 const repo=path.join(root,'repo'), remote=path.join(root,'remote.git'), state=path.join(root,'state'), run=path.join(state,'runs','one'), preview=path.join(run,'site-preview');
 fs.mkdirSync(path.join(repo,'content/projects'),{recursive:true});fs.writeFileSync(path.join(repo,'content/projects/sample.md'),'before\n');
 git(repo,'init','-b','main');git(repo,'config','user.name','Fixture');git(repo,'config','user.email','fixture@example.invalid');git(repo,'add','.');git(repo,'commit','-m','Baseline');
 git(root,'clone','--bare',repo,remote);
 const global=path.join(root,'gitconfig');fs.writeFileSync(global,`[url "${remote}"]\n insteadOf = git@github.com:fixture/test.git\n[user]\n name = Fixture\n email = fixture@example.invalid\n[commit]\n gpgsign = false\n`);
 const prev=process.env.GIT_CONFIG_GLOBAL;process.env.GIT_CONFIG_GLOBAL=global;t.after(()=>{if(prev===undefined)delete process.env.GIT_CONFIG_GLOBAL;else process.env.GIT_CONFIG_GLOBAL=prev;fs.rmSync(root,{recursive:true,force:true});});
 fs.mkdirSync(path.join(run,'proposed'),{recursive:true});fs.mkdirSync(path.join(preview,'content/projects'),{recursive:true});
 for(const f of [path.join(run,'proposed/sample.md'),path.join(preview,'content/projects/sample.md')])fs.writeFileSync(f,'after\n');
 const report={baselineCommit:git(repo,'rev-parse','HEAD'),proposedHashes:{sample:sha('after\n')},proposals:[{project:'sample'}]};
 const config={repository:repo,stateDirectory:state,projects:['sample'],delivery:{mode:'draft-pr',repository:'fixture/test',baseBranch:'main'}};
 const contentId=sha(JSON.stringify({baseline:report.baselineCommit,files:report.proposedHashes}));
 const save=(f,d)=>fs.writeFileSync(f,JSON.stringify(d));
 const c=path.join(root,'config.json'),r=path.join(run,'report.json');save(c,config);save(r,report);save(path.join(run,'preview.json'),{directory:preview,status:'verified',baselineCommit:report.baselineCommit,contentId,checkedAt:new Date().toISOString()});
 return {root,repo,remote,run,preview,c,r,git,config,report,save};
}
test('delivery rejects disabled mode, edited proposals and expired previews',t=>{
 const x=setup(t);inspect(x.c,x.r);x.config.delivery.mode='off';x.save(x.c,x.config);assert.throws(()=>inspect(x.c,x.r),/not enabled/);x.config.delivery.mode='draft-pr';x.save(x.c,x.config);
 fs.writeFileSync(path.join(x.run,'proposed/sample.md'),'tampered');assert.throws(()=>inspect(x.c,x.r),/changed after preview/);fs.writeFileSync(path.join(x.run,'proposed/sample.md'),'after\n');
 const p=path.join(x.run,'preview.json'),d=JSON.parse(fs.readFileSync(p));d.checkedAt='2000-01-01T00:00:00Z';x.save(p,d);assert.throws(()=>inspect(x.c,x.r),/expired/);
});
test('delivery rejects a default branch that moved after review',t=>{
 const x=setup(t);fs.writeFileSync(path.join(x.repo,'new.txt'),'new');x.git(x.repo,'add','.');x.git(x.repo,'commit','-m','Move base');x.git(x.repo,'push',x.remote,'main');assert.throws(()=>prepare(x.c,x.r),/Default branch moved/);
});
test('delivery pushes only reviewed files, resumes idempotently and refuses remote edits',t=>{
 const x=setup(t);fs.writeFileSync(path.join(x.run,'secret.txt'),'PRIVATE');const d=push(x.c,x.r);assert.equal(push(x.c,x.r).commit,d.commit);assert.equal(x.git(d.checkout,'diff','--name-only',d.baseline,'HEAD'),'content/projects/sample.md');assert.equal(x.git(x.repo,'status','--porcelain'),'');
 fs.writeFileSync(path.join(x.repo,'outsider.txt'),'outside');x.git(x.repo,'add','.');x.git(x.repo,'commit','-m','Someone else');x.git(x.repo,'push',x.remote,'HEAD:refs/heads/'+d.branch,'--force');assert.throws(()=>push(x.c,x.r),/Remote branch changed/);
});
test('delivery uses a host-neutral branch and resumes a legacy-named preparation',t=>{
 const x=setup(t);const d=prepare(x.c,x.r);assert.ok(d.branch.startsWith(BRANCH_PREFIX));assert.doesNotMatch(d.branch,/codex/);assert.deepEqual(LEGACY_BRANCH_PREFIXES,['codex/portfolio-editor-']);
 const record=path.join(x.run,'delivery.json');const legacy={...JSON.parse(fs.readFileSync(record,'utf8')),branch:'codex/portfolio-editor-'+d.contentId.slice(0,16)};fs.writeFileSync(record,JSON.stringify(legacy));
 assert.equal(push(x.c,x.r).branch,legacy.branch);assert.equal(x.git(x.repo,'ls-remote',x.remote,'refs/heads/'+legacy.branch).split(/\s/)[0],d.commit);
});
