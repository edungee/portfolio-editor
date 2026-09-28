'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {build,collect,checkSkill}=require('../scripts/package.cjs');
test('upload package contains the runtime skill and nothing private or dev-only',()=>{
 const files=collect();
 for(const f of ['SKILL.md','LICENSE','references/modes.md','scripts/pilot.cjs','scripts/lib/frontmatter.cjs','scripts/vendor/js-yaml.min.js','scripts/vendor/js-yaml.LICENSE'])assert.ok(files.includes(f),f);
 assert.ok(files.every(f=>!/^(tests|node_modules|dist|\.github)\//.test(f)&&f!=='package-lock.json'&&f!=='scripts/package.cjs'));
 assert.equal(checkSkill().name,'portfolio-editor');
});
test('package build is deterministic and a valid zip',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pkg-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const a=build(path.join(dir,'a.zip')),b=build(path.join(dir,'b.zip'));
 assert.deepEqual(fs.readFileSync(a.output),fs.readFileSync(b.output));
 const buf=fs.readFileSync(a.output);assert.equal(buf.readUInt32LE(buf.length-22),0x06054b50);assert.equal(buf.readUInt16LE(buf.length-12),a.files);
});
