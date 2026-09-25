'use strict';
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');
const {fixture}=require('./fixture.cjs');const {run}=require('./pilot.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'portfolio-editor-demo-'));
const repo=fixture(path.join(root,'site'));
const config={version:1,mode:'private-dry-run',repository:repo,stateDirectory:path.join(root,'private-state'),policyVersion:'demo-v1',projects:['sample-project'],sources:[{id:'sample-notes',project:'sample-project',kind:'fixture',locator:'synthetic example'}]};
const batch={version:1,sources:[{id:'sample-notes',status:'ok',complete:true,revision:'demo-v1',note:'Synthetic evidence only',evidence:'The test participant found the plan labels confusing.'}],candidates:[{id:'label-learning',project:'sample-project',sourceIds:['sample-notes'],claim:'Plan labels need clarification.',decision:'include',reason:'A synthetic learning for the demo.',kind:'learning',eventDate:'2026-01-02',milestoneId:'label-learning',evidenceQuote:'plan labels confusing',publicationCleared:true,publicCopy:{title:'Identified confusing labels',summary:'A synthetic test identified unclear plan labels.',rationale:'Demonstrate a meaningful learning milestone.',evidence:'Synthetic fixture; no real user research was conducted.'}}]};
const c=path.join(root,'config.json'),b=path.join(root,'batch.json');fs.writeFileSync(c,JSON.stringify(config));fs.writeFileSync(b,JSON.stringify(batch));
console.log(JSON.stringify({notice:'Synthetic demo only; no network calls or publishing.',first:run(c,b),replay:run(c,b)},null,2));
