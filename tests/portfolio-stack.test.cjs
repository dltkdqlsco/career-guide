const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup,id='3-2';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({target:'junior backend / SQL required / prioritize core and supporting tech',inventory:'SQL documented independent query fix; Java guided API; Git guided branches; Docker teammate only',criteria:'1 tutorial, 2 guided, 3 independent with docs, 4 lead, 5 review/mentor; unknown != beginner; importance separate',assessment:'SQL core importance5 proficiency3 with code/tests; Java core4/2; Git supporting3/2; Docker UNKNOWN',presentation:'Legend: stars importance, blocks proficiency; SQL 5/5 and 3/5 intermediate with evidence; Docker excluded',gaps:'No direct Docker evidence; gather actual tasks before rating; no production or performance claim',review:'confirmed'});
test('portfolio stack requires six records and review but does not require AI usage',()=>{
 assert.equal(w.validate(id,{...filled(),custom:''}),'');for(const key of ['target','inventory','criteria','assessment','presentation','gaps'])assert.notEqual(w.validate(id,{...filled(),[key]:' '}),'');for(const review of ['',undefined,true])assert.notEqual(w.validate(id,{...filled(),review}),'');
});
test('stack request uses supplied target, inventory and evaluation criteria without recycling AI answers or conclusions',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({assessment:'excluded rank',presentation:'excluded presentation',gaps:'excluded gap',original:'excluded answer',custom:'excluded manual'},id),'');
 const data=filled(),text=w.compose({...data,assessment:'excluded rank',presentation:'excluded presentation',gaps:'excluded gap',original:'excluded answer'},id);for(const key of ['target','inventory','criteria'])assert.ok(text.includes(data[key]));assert.doesNotMatch(text,/excluded|80%/);
 const missing=w.compose({target:'exploring roles',inventory:'SOURCE NOT YET CONFIRMED',criteria:'NO OPERATIONS EXPERIENCE'},id);assert.ok(missing.includes('SOURCE NOT YET CONFIRMED'));assert.ok(missing.includes('NO OPERATIONS EXPERIENCE'));
});
test('stack records, prior notes, raw answers and manual/blank requests survive cleaning and backups',()=>{
 const data={...filled(),original:'raw AI opinion',custom:''};data.presentation='\ud55c\uae00 \ud83d\ude00\n</textarea><script>test</script>';assert.deepEqual(w.clean({[id]:data})[id],data);assert.equal(w.output(data,id),'');
 const state=empty();state.worksheets[id]=data;state.notes[id]='legacy portfolio note';state.done[id]=true;state.last='#course/portfolio/2/write';assert.deepEqual(b.parse(b.serialize(state)).data,state);
 data.custom='manual request';assert.equal(w.output(data,id),'manual request');const text=w.exportText(id,data);for(const value of [data.presentation,data.original,data.custom,data.gaps])assert.ok(text.includes(value));assert.equal(w.exportText(id,{}),'');
});
test('stack selected restore protects essay checks and company records; missing review clears only completion',()=>{
 const current=empty(),incoming=empty();current.worksheets={'2-9':{finalText:'protected final',checkFacts:'confirmed'},'1-8':{experience:'protected working style'},[id]:{presentation:'current matching'}};current.notes[id]='old note';incoming.worksheets[id]={...filled(),review:''};incoming.done[id]=true;incoming.notes[id]='restored note';
 const parsed=b.parse(b.serialize(incoming));assert.equal(parsed.data.done[id],false);assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.worksheets[id].presentation,filled().presentation);
 const next=b.merge(current,parsed.data,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets[id],parsed.data.worksheets[id]);for(const key of ['2-9','1-8'])assert.deepEqual(next.worksheets[key],current.worksheets[key]);assert.equal(next.notes[id],'restored note');assert.equal(current.worksheets[id].presentation,'current matching');
 for(const sheet of [{inventory:42},{presentation:[]},{review:true},{custom:[]},{unknown:'x'}]){incoming.worksheets[id]=sheet;assert.throws(()=>b.serialize(incoming));}
});
test('portfolio third step becomes available without opening later portfolio lessons or indexing private records',()=>{
 assert.equal(CareerLessons.lessons[id].finalTextKey,'presentation');assert.equal(w.has('3-0'),true);assert.equal(w.has(id),true);assert.equal(COURSES.find(c=>c.id==='portfolio').steps[2].kind,'write');assert.equal(StepFinder.search({readyOnly:true}).length,45);assert.equal(w.has('4-0'),true);assert.equal(StepFinder.availability('4-0'),'ready');
 const state=empty();state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].presentation='private-portfolio-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-portfolio-token'},state).length,0);
});
