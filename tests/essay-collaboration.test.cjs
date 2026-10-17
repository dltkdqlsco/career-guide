const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/curriculum.js');require('../dist/career-data.js');require('../dist/workbook.js');require('../dist/backup-core.js');require('../dist/finder.js');
const w=Workbook,b=RecordBackup,id='2-6';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({question:'collaboration question / role / limit',context:'my full-change proposal; teammate raised deadline and existing-work concern',criteria:'schedule and scope jointly compared using response samples',actions:'listen, compare, revise my proposal, agree minimum scope, implement my API and document',results:'joint integration checked; extra fields DEFERRED; trust UNMEASURED; record and learning',draft:'common goal, concerns, criteria, my adjustment, joint outcome and learning',review:'confirmed'});
test('collaboration requires six records and explicit review, without mandatory AI usage',()=>{
 const data=filled();assert.equal(w.validate(id,{...data,custom:''}),'');
 for(const key of ['question','context','criteria','actions','results','draft'])assert.notEqual(w.validate(id,{...data,[key]:' '}),'');
 for(const review of ['',undefined,true,'yes'])assert.notEqual(w.validate(id,{...data,review}),'');
});
test('collaboration prompt uses provided context and results without automatically recycling draft or AI response',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({original:'excluded answer',draft:'excluded draft',custom:'excluded manual'},id),'');
 const data=filled(),text=w.compose({...data,original:'excluded answer',draft:'excluded draft',custom:'excluded manual'},id);
 for(const key of ['question','context','criteria','actions','results'])assert.ok(text.includes(data[key]));
 assert.doesNotMatch(text,/excluded|80%/);assert.ok(text.includes('extra fields DEFERRED'));assert.ok(text.includes('trust UNMEASURED'));
 const missing=w.compose({question:'q',context:'production impact UNVERIFIED; check available logs',criteria:'NO DIRECT EXPERIENCE; find actual learning records'},id);assert.ok(missing.includes('UNVERIFIED'));assert.ok(missing.includes('NO DIRECT EXPERIENCE'));assert.ok(w.compose({question:'q',results:'PARTIAL FAILURE; still unresolved in production'},id).includes('PARTIAL FAILURE'));
});
test('collaboration worksheet roundtrips unicode, explicit blank requests, raw response and pre-existing free note',()=>{
 const data={...filled(),original:'raw response',custom:''};data.draft='\ud55c\uae00 \ud83d\ude00\n</textarea><script>test</script>';assert.deepEqual(w.clean({[id]:data})[id],data);assert.equal(w.output(data,id),'');
 const state=empty();state.worksheets[id]=data;state.notes[id]='legacy free note';state.done[id]=true;state.last='#course/essay/6/write';assert.deepEqual(b.parse(b.serialize(state)).data,state);
 data.custom='manual request';assert.equal(w.output(data,id),'manual request');const text=w.exportText(id,data);for(const value of [data.draft,data.original,data.custom])assert.ok(text.includes(value));assert.equal(w.exportText(id,{}),'');
});
test('collaboration selective restore preserves other lessons and incomplete backup completion is cleared',()=>{
 const current=empty(),incoming=empty();current.worksheets={'1-9':{motivation:'preparation'},'2-2':{star:'protected action',custom:''},[id]:{draft:'current draft'}};current.notes[id]='current note';incoming.worksheets[id]={...filled(),review:''};incoming.notes[id]='incoming note';incoming.done[id]=true;
 const parsed=b.parse(b.serialize(incoming));assert.equal(parsed.data.done[id],false);assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.worksheets[id].draft,filled().draft);
 const next=b.merge(current,parsed.data,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets[id],parsed.data.worksheets[id]);for(const key of ['1-9','2-2'])assert.deepEqual(next.worksheets[key],current.worksheets[key]);assert.equal(next.notes[id],'incoming note');assert.equal(current.worksheets[id].draft,'current draft');
 for(const sheet of [{draft:42},{review:true},{custom:[]},{unknown:'x'}]){incoming.worksheets[id]=sheet;assert.throws(()=>b.serialize(incoming));}
});
test('collaboration remains available alongside goal achievement while personal drafts remain outside search',()=>{
 assert.equal(w.has(id),true);assert.equal(COURSES.find(c=>c.id==='essay').steps[6].kind,'write');assert.equal(StepFinder.availability(id),'ready');assert.equal(StepFinder.search({readyOnly:true}).length,45);assert.equal(w.has('4-0'),true);
 const state=empty();state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].draft='private-actions-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-actions-token'},state).length,0);
});
