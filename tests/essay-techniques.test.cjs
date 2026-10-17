const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/curriculum.js');require('../dist/career-data.js');require('../dist/workbook.js');require('../dist/backup-core.js');require('../dist/finder.js');
const w=Workbook,b=RecordBackup,id='2-2';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({question:'question and actual experience',star:'personal actions and observed result',kpi:'not measured; regression test record',fab:'evidence and contribution plan',outline:'STAR first; omit future plan for this question',review:'confirmed'});
test('techniques require five records and explicit review, without mandatory AI usage',()=>{
 const data=filled();assert.equal(w.validate(id,{...data,custom:''}),'');
 for(const key of ['question','star','kpi','fab','outline'])assert.notEqual(w.validate(id,{...data,[key]:' '}),'');
 for(const review of ['',undefined,true,'yes'])assert.notEqual(w.validate(id,{...data,review}),'');
});
test('techniques prompt uses only supplied source records, excluding AI answer, final outline and manual output',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({original:'excluded answer',outline:'excluded outline',custom:'excluded manual'},id),'');
 const data=filled(),text=w.compose({...data,original:'excluded answer',outline:'excluded outline',custom:'excluded manual'},id);
 for(const key of ['question','star','kpi','fab'])assert.ok(text.includes(data[key]));
 assert.doesNotMatch(text,/excluded|250ms|200ms|80%/);
 const unmeasured=w.compose({question:'q',kpi:'UNMEASURED; tests passed'},id);assert.ok(unmeasured.includes('UNMEASURED; tests passed'));
 const measured=w.compose({question:'q',kpi:'same fixture; mean 250ms -> 200ms; 100 requests; local logs'},id);assert.ok(measured.includes('mean 250ms -> 200ms'));
});
test('techniques preserve old schema, manual/blank requests, raw answers and unicode on export and roundtrip',()=>{
 const data={...filled(),original:'raw response',custom:''};assert.deepEqual(w.clean({[id]:data})[id],data);assert.equal(w.output(data,id),'');
 data.custom='manual request';data.star='\ud55c\uae00 \ud83d\ude00\n</textarea><script>test</script>';assert.equal(w.output(data,id),'manual request');
 const state=empty();state.worksheets[id]=data;state.notes[id]='free note';state.done[id]=true;state.last='#course/essay/2/write';assert.deepEqual(b.parse(b.serialize(state)).data,state);
 const text=w.exportText(id,data);for(const value of [data.star,data.original,data.custom,data.outline])assert.ok(text.includes(value));assert.equal(w.exportText(id,{}),'');
});
test('techniques selective restore preserves neighboring lessons and invalid completion loses only its done mark',()=>{
 const current=empty(),incoming=empty();current.worksheets={'2-0':{question:'original question'},'2-1':{candidates:'protected candidates',custom:''},[id]:{star:'current actions'}};current.notes['2-3']='future free note';incoming.worksheets[id]={...filled(),review:''};incoming.done[id]=true;
 const parsed=b.parse(b.serialize(incoming));assert.equal(parsed.data.done[id],false);assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.worksheets[id].star,filled().star);
 const next=b.merge(current,parsed.data,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets[id],parsed.data.worksheets[id]);for(const key of ['2-0','2-1'])assert.deepEqual(next.worksheets[key],current.worksheets[key]);assert.equal(next.notes['2-3'],'future free note');assert.equal(current.worksheets[id].star,'current actions');
 for(const sheet of [{star:42},{review:true},{custom:[]},{unknown:'x'}]){incoming.worksheets[id]=sheet;assert.throws(()=>b.serialize(incoming));}
});
test('techniques remain available alongside motivation; private records do not enter curriculum search',()=>{
 assert.equal(w.has(id),true);assert.equal(COURSES.find(c=>c.id==='essay').steps[2].kind,'write');assert.equal(StepFinder.availability(id),'ready');assert.equal(StepFinder.search({readyOnly:true}).length,45);assert.equal(w.has('4-0'),true);
 const state=empty();state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].star='private-action-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-action-token'},state).length,0);
});
