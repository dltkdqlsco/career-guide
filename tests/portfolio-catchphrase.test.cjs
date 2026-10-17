const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/curriculum.js');require('../dist/career-data.js');require('../dist/workbook.js');require('../dist/backup-core.js');require('../dist/finder.js');
const w=Workbook,b=RecordBackup,id='3-1';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({target:'junior backend / portfolio headline / 30-50 chars',evidence:'my SQL fix and regression tests; development only; code and logs',focus:'careful checking = reproduce, compare, retest; not employer scoring',candidates:'technology headline / problem-solving headline / engineering-values headline; reasons and evidence',decision:'choose values headline: describes real checking behavior; exclude production guarantees',finalText:'Reproducing query cases and documenting checks as a backend developer',review:'confirmed'});
test('portfolio catchphrase requires six records and review but does not require AI usage',()=>{
 assert.equal(w.validate(id,{...filled(),custom:''}),'');for(const key of ['target','evidence','focus','candidates','decision','finalText'])assert.notEqual(w.validate(id,{...filled(),[key]:' '}),'');for(const review of ['',undefined,true])assert.notEqual(w.validate(id,{...filled(),review}),'');
});
test('catchphrase request uses supplied target, evidence and working style without recycling AI answers or conclusions',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({candidates:'excluded rank',decision:'excluded decision',finalText:'excluded gap',original:'excluded answer',custom:'excluded manual'},id),'');
 const data=filled(),text=w.compose({...data,candidates:'excluded rank',decision:'excluded decision',finalText:'excluded gap',original:'excluded answer'},id);for(const key of ['target','evidence','focus'])assert.ok(text.includes(data[key]));assert.doesNotMatch(text,/excluded|80%/);
 const missing=w.compose({target:'exploring roles',evidence:'SOURCE NOT YET CONFIRMED',focus:'NO OPERATIONS EXPERIENCE'},id);assert.ok(missing.includes('SOURCE NOT YET CONFIRMED'));assert.ok(missing.includes('NO OPERATIONS EXPERIENCE'));
});
test('catchphrase records, prior notes, raw answers and manual/blank requests survive cleaning and backups',()=>{
 const data={...filled(),original:'raw AI opinion',custom:''};data.decision='\ud55c\uae00 \ud83d\ude00\n</textarea><script>test</script>';assert.deepEqual(w.clean({[id]:data})[id],data);assert.equal(w.output(data,id),'');
 const state=empty();state.worksheets[id]=data;state.notes[id]='legacy portfolio note';state.done[id]=true;state.last='#course/portfolio/1/write';assert.deepEqual(b.parse(b.serialize(state)).data,state);
 data.custom='manual request';assert.equal(w.output(data,id),'manual request');const text=w.exportText(id,data);for(const value of [data.decision,data.original,data.custom,data.finalText])assert.ok(text.includes(value));assert.equal(w.exportText(id,{}),'');
});
test('catchphrase selected restore protects essay checks and company records; missing review clears only completion',()=>{
 const current=empty(),incoming=empty();current.worksheets={'2-9':{finalText:'protected final',checkFacts:'confirmed'},'1-8':{experience:'protected working style'},[id]:{decision:'current matching'}};current.notes[id]='old note';incoming.worksheets[id]={...filled(),review:''};incoming.done[id]=true;incoming.notes[id]='restored note';
 const parsed=b.parse(b.serialize(incoming));assert.equal(parsed.data.done[id],false);assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.worksheets[id].decision,filled().decision);
 const next=b.merge(current,parsed.data,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets[id],parsed.data.worksheets[id]);for(const key of ['2-9','1-8'])assert.deepEqual(next.worksheets[key],current.worksheets[key]);assert.equal(next.notes[id],'restored note');assert.equal(current.worksheets[id].decision,'current matching');
 for(const sheet of [{evidence:42},{decision:[]},{review:true},{custom:[]},{unknown:'x'}]){incoming.worksheets[id]=sheet;assert.throws(()=>b.serialize(incoming));}
});
test('portfolio second step becomes available without opening later portfolio lessons or indexing private records',()=>{
 assert.equal(CareerLessons.lessons[id].finalTextKey,'finalText');assert.equal(w.has('3-0'),true);assert.equal(w.has(id),true);assert.equal(COURSES.find(c=>c.id==='portfolio').steps[1].kind,'write');assert.equal(StepFinder.search({readyOnly:true}).length,45);assert.equal(w.has('4-0'),true);assert.equal(StepFinder.availability('4-0'),'ready');
 const state=empty();state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].decision='private-portfolio-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-portfolio-token'},state).length,0);
});
