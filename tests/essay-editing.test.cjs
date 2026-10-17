const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup,id='2-8';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({question:'question, role and 700-char limit',before:'my untouched draft',evidence:'my API action and test logs; speed UNMEASURED',focus:'clarify role, actual diagnosis, sentence flow',changes:'remove exaggerated claim; reject invented metrics',revised:'my verified, readable revision',review:'confirmed'});
test('editing requires six records and explicit review, without mandatory AI usage',()=>{
 assert.equal(w.validate(id,{...filled(),custom:''}),'');
 for(const key of ['question','before','evidence','focus','changes','revised'])assert.notEqual(w.validate(id,{...filled(),[key]:' '}),'');
 for(const review of ['',undefined,true,'yes'])assert.notEqual(w.validate(id,{...filled(),review}),'');
});
test('editing prompt includes source draft and supplied facts, excluding AI response, final revision and decisions',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({original:'excluded answer',revised:'excluded revision',changes:'excluded decisions',custom:'excluded manual'},id),'');
 const data=filled(),text=w.compose({...data,original:'excluded answer',revised:'excluded revision',changes:'excluded decisions',custom:'excluded manual'},id);
 for(const key of ['question','before','evidence','focus'])assert.ok(text.includes(data[key]));assert.doesNotMatch(text,/excluded|80%/);
 assert.ok(w.compose({before:'claim 70%',evidence:'70% unsupported; do not convert to made-up 350ms and 70ms'},id).includes('70% unsupported'));
});
test('editing cleaning, export and backup preserve before/revised/raw AI separately and retain blank manual requests and notes',()=>{
 const data={...filled(),original:'raw AI response',custom:''};data.revised='\ud55c\uae00 \ud83d\ude00\n</textarea><script>test</script>';assert.deepEqual(w.clean({[id]:data})[id],data);assert.equal(w.output(data,id),'');
 const state=empty();state.worksheets[id]=data;state.notes[id]='legacy editing note';state.done[id]=true;state.last='#course/essay/8/write';assert.deepEqual(b.parse(b.serialize(state)).data,state);
 data.custom='manual request';assert.equal(w.output(data,id),'manual request');const text=w.exportText(id,data);for(const value of [data.before,data.revised,data.original,data.custom,data.changes])assert.ok(text.includes(value));assert.equal(w.exportText(id,{}),'');
});
test('editing selected restore preserves authored essays and clears incomplete completion without deleting texts',()=>{
 const current=empty(),incoming=empty();current.worksheets={'2-3':{draft:'protected motivation',custom:''},'2-7':{draft:'protected creativity'},[id]:{before:'current before',revised:'current revision'}};current.notes[id]='current note';incoming.worksheets[id]={...filled(),review:''};incoming.notes[id]='incoming note';incoming.done[id]=true;
 const parsed=b.parse(b.serialize(incoming));assert.equal(parsed.data.done[id],false);assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.worksheets[id].before,filled().before);
 const next=b.merge(current,parsed.data,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets[id],parsed.data.worksheets[id]);for(const key of ['2-3','2-7'])assert.deepEqual(next.worksheets[key],current.worksheets[key]);assert.equal(next.notes[id],'incoming note');assert.equal(current.worksheets[id].before,'current before');
 for(const sheet of [{before:42},{revised:[]},{review:true},{custom:[]},{unknown:'x'}]){incoming.worksheets[id]=sheet;assert.throws(()=>b.serialize(incoming));}
});
test('editing is available as step 22 while final checklist remains pending and private text stays outside search',()=>{
 assert.equal(w.has(id),true);assert.equal(COURSES.find(c=>c.id==='essay').steps[8].kind,'write');assert.equal(StepFinder.availability(id),'ready');assert.equal(StepFinder.search({readyOnly:true}).length,45);assert.equal(w.has('4-0'),true);
 const state=empty();state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].revised='private-revision-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-revision-token'},state).length,0);
});
