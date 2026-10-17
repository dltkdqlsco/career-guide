const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup,id='3-0';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({target:'target role and portfolio conditions',posting:'actual duties, required SQL, preferred operations; source and date',experience:'my SQL query, tests, docs; no production operations',priorities:'my proposed priorities, not company scoring',selection:'requirement -> actual project action -> code/test evidence -> display order',gaps:'operations UNMATCHED; gather records and learn separately',review:'confirmed'});
test('portfolio analysis requires six records and review but does not require AI usage',()=>{
 assert.equal(w.validate(id,{...filled(),custom:''}),'');for(const key of ['target','posting','experience','priorities','selection','gaps'])assert.notEqual(w.validate(id,{...filled(),[key]:' '}),'');for(const review of ['',undefined,true])assert.notEqual(w.validate(id,{...filled(),review}),'');
});
test('portfolio request uses supplied target, posting and actual experience without recycling AI answers or conclusions',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({priorities:'excluded rank',selection:'excluded selection',gaps:'excluded gap',original:'excluded answer',custom:'excluded manual'},id),'');
 const data=filled(),text=w.compose({...data,priorities:'excluded rank',selection:'excluded selection',gaps:'excluded gap',original:'excluded answer'},id);for(const key of ['target','posting','experience'])assert.ok(text.includes(data[key]));assert.doesNotMatch(text,/excluded|80%/);
 const missing=w.compose({target:'exploring roles',posting:'SOURCE NOT YET CONFIRMED',experience:'NO OPERATIONS EXPERIENCE'},id);assert.ok(missing.includes('SOURCE NOT YET CONFIRMED'));assert.ok(missing.includes('NO OPERATIONS EXPERIENCE'));
});
test('portfolio new records, prior notes, raw answers and manual/blank requests survive cleaning and backups',()=>{
 const data={...filled(),original:'raw AI opinion',custom:''};data.selection='\ud55c\uae00 \ud83d\ude00\n</textarea><script>test</script>';assert.deepEqual(w.clean({[id]:data})[id],data);assert.equal(w.output(data,id),'');
 const state=empty();state.worksheets[id]=data;state.notes[id]='legacy portfolio note';state.done[id]=true;state.last='#course/portfolio/0/write';assert.deepEqual(b.parse(b.serialize(state)).data,state);
 data.custom='manual request';assert.equal(w.output(data,id),'manual request');const text=w.exportText(id,data);for(const value of [data.selection,data.original,data.custom,data.gaps])assert.ok(text.includes(value));assert.equal(w.exportText(id,{}),'');
});
test('portfolio selected restore protects essay checks and company records; missing review clears only completion',()=>{
 const current=empty(),incoming=empty();current.worksheets={'2-9':{finalText:'protected final',checkFacts:'confirmed'},'1-8':{experience:'protected actual experience'},[id]:{selection:'current matching'}};current.notes[id]='old note';incoming.worksheets[id]={...filled(),review:''};incoming.done[id]=true;incoming.notes[id]='restored note';
 const parsed=b.parse(b.serialize(incoming));assert.equal(parsed.data.done[id],false);assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.worksheets[id].selection,filled().selection);
 const next=b.merge(current,parsed.data,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets[id],parsed.data.worksheets[id]);for(const key of ['2-9','1-8'])assert.deepEqual(next.worksheets[key],current.worksheets[key]);assert.equal(next.notes[id],'restored note');assert.equal(current.worksheets[id].selection,'current matching');
 for(const sheet of [{posting:42},{selection:[]},{review:true},{custom:[]},{unknown:'x'}]){incoming.worksheets[id]=sheet;assert.throws(()=>b.serialize(incoming));}
});
test('portfolio first step becomes available without opening later portfolio lessons or indexing private records',()=>{
 assert.equal(w.has(id),true);assert.equal(COURSES.find(c=>c.id==='portfolio').steps[0].kind,'write');assert.equal(StepFinder.search({readyOnly:true}).length,45);assert.equal(w.has('4-0'),true);assert.equal(StepFinder.availability('4-0'),'ready');
 const state=empty();state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].selection='private-portfolio-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-portfolio-token'},state).length,0);
});
