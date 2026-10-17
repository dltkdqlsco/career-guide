const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup,id='2-3';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({question:'company / role / question / limit',evidence:'official posting and service / location / checked date',experience:'my action, code, test result; speed unmeasured',motivation:'personal interest matches service and posting',plans:'learn rules; add reviewed tests; future plan only',draft:'my reason, actual action, executable plan',review:'confirmed'});
test('motivation requires six records and explicit review, without mandatory AI usage',()=>{
 const data=filled();assert.equal(w.validate(id,{...data,custom:''}),'');
 for(const key of ['question','evidence','experience','motivation','plans','draft'])assert.notEqual(w.validate(id,{...data,[key]:' '}),'');
 for(const review of ['',undefined,true,'yes'])assert.notEqual(w.validate(id,{...data,review}),'');
});
test('motivation prompt uses provided evidence and plans without automatically recycling draft or AI response',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({original:'excluded answer',draft:'excluded draft',custom:'excluded manual'},id),'');
 const data=filled(),text=w.compose({...data,original:'excluded answer',draft:'excluded draft',custom:'excluded manual'},id);
 for(const key of ['question','evidence','experience','motivation','plans'])assert.ok(text.includes(data[key]));
 assert.doesNotMatch(text,/excluded|80%/);
 const missing=w.compose({question:'q',evidence:'company goals UNVERIFIED; check official site',experience:'NO DIRECT EXPERIENCE; find actual learning records'},id);assert.ok(missing.includes('UNVERIFIED'));assert.ok(missing.includes('NO DIRECT EXPERIENCE'));
});
test('new motivation worksheet roundtrips unicode, explicit blank requests, raw response and pre-existing free note',()=>{
 const data={...filled(),original:'raw response',custom:''};data.draft='\ud55c\uae00 \ud83d\ude00\n</textarea><script>test</script>';assert.deepEqual(w.clean({[id]:data})[id],data);assert.equal(w.output(data,id),'');
 const state=empty();state.worksheets[id]=data;state.notes[id]='legacy free note';state.done[id]=true;state.last='#course/essay/3/write';assert.deepEqual(b.parse(b.serialize(state)).data,state);
 data.custom='manual request';assert.equal(w.output(data,id),'manual request');const text=w.exportText(id,data);for(const value of [data.draft,data.original,data.custom])assert.ok(text.includes(value));assert.equal(w.exportText(id,{}),'');
});
test('motivation selective restore preserves other lessons and incomplete backup completion is cleared',()=>{
 const current=empty(),incoming=empty();current.worksheets={'1-9':{motivation:'preparation'},'2-2':{star:'protected action',custom:''},[id]:{draft:'current draft'}};current.notes[id]='current note';incoming.worksheets[id]={...filled(),review:''};incoming.notes[id]='incoming note';incoming.done[id]=true;
 const parsed=b.parse(b.serialize(incoming));assert.equal(parsed.data.done[id],false);assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.worksheets[id].draft,filled().draft);
 const next=b.merge(current,parsed.data,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets[id],parsed.data.worksheets[id]);for(const key of ['1-9','2-2'])assert.deepEqual(next.worksheets[key],current.worksheets[key]);assert.equal(next.notes[id],'incoming note');assert.equal(current.worksheets[id].draft,'current draft');
 for(const sheet of [{draft:42},{review:true},{custom:[]},{unknown:'x'}]){incoming.worksheets[id]=sheet;assert.throws(()=>b.serialize(incoming));}
});
test('motivation remains available alongside problem solving while personal drafts remain outside search',()=>{
 assert.equal(w.has(id),true);assert.equal(COURSES.find(c=>c.id==='essay').steps[3].kind,'write');assert.equal(StepFinder.availability(id),'ready');assert.equal(StepFinder.search({readyOnly:true}).length,45);assert.equal(w.has('4-0'),true);
 const state=empty();state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].draft='private-motivation-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-motivation-token'},state).length,0);
});
