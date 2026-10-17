const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/curriculum.js');require('../dist/career-data.js');require('../dist/workbook.js');require('../dist/backup-core.js');require('../dist/finder.js');
const w=Workbook,b=RecordBackup,id='2-9',checks=CareerLessons.lessons[id].checklist;
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({question:'q / role / actual submission limit',manuscript:'before checking',evidence:'verified code and posting; actual form limit and deadline',fixes:'replaced generic learning; checked record and form',finalText:'final text only',review:'confirmed',...Object.fromEntries(checks.map(([key])=>[key,'confirmed']))});
test('final review requires five text records, every explicit check and final confirmation',()=>{
 assert.equal(checks.length,12);assert.equal(w.validate(id,{...filled(),custom:''}),'');
 for(const key of ['question','manuscript','evidence','fixes','finalText'])assert.notEqual(w.validate(id,{...filled(),[key]:' '}),'');
 for(const [key] of checks)for(const value of ['',undefined,true,'yes','pending'])assert.notEqual(w.validate(id,{...filled(),[key]:value}),'');
 for(const review of ['',undefined,true])assert.notEqual(w.validate(id,{...filled(),review}),'');
});
test('final review prompt uses supplied manuscript and records but does not claim to inspect final text or check status',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({finalText:'excluded final',original:'excluded AI',custom:'excluded manual',...Object.fromEntries(checks.map(([key])=>[key,'confirmed']))},id),'');
 const data=filled(),text=w.compose({...data,finalText:'excluded final',original:'excluded AI',custom:'excluded manual'},id);
 for(const key of ['question','manuscript','evidence','fixes'])assert.ok(text.includes(data[key]));assert.doesNotMatch(text,/excluded/);
});
test('final records and checklist roundtrip with legacy notes, manual blank request and Unicode',()=>{
 const data={...filled(),original:'raw AI opinion',custom:''};data.finalText='\ud55c\uae00 \ud83d\ude00\n</textarea><script>test</script>';assert.deepEqual(w.clean({[id]:data})[id],data);assert.equal(w.output(data,id),'');
 const state=empty();state.worksheets[id]=data;state.notes[id]='legacy final note';state.done[id]=true;state.last='#course/essay/9/write';assert.deepEqual(b.parse(b.serialize(state)).data,state);
 const text=w.exportText(id,data);assert.ok(text.includes(data.finalText));assert.ok(text.includes(data.manuscript));assert.ok(text.includes(data.original));assert.equal((text.match(/\[x\]/g)||[]).length,12);assert.doesNotMatch(text,/confirmed/);
});
test('export includes unchecked and checked items honestly without turning an unchecked item into completion',()=>{
 const data={...filled(),[checks[0][0]]:''},text=w.exportText(id,data);assert.equal((text.match(/\[x\]/g)||[]).length,11);assert.equal((text.match(/\[ \]/g)||[]).length,1);assert.equal(w.exportText(id,{}),'');
});
test('backup clears completion with any missing check but preserves text and neighboring essays on selected restore',()=>{
 const current=empty(),incoming=empty();current.worksheets={'2-8':{before:'old source',revised:'protected revision'},[id]:{finalText:'current final'}};current.notes[id]='old note';incoming.worksheets[id]={...filled(),[checks[0][0]]:''};incoming.done[id]=true;incoming.notes[id]='restored note';
 const parsed=b.parse(b.serialize(incoming));assert.equal(parsed.data.done[id],false);assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.worksheets[id].finalText,'final text only');
 const next=b.merge(current,parsed.data,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets['2-8'],current.worksheets['2-8']);assert.deepEqual(next.worksheets[id],parsed.data.worksheets[id]);assert.equal(next.notes[id],'restored note');assert.equal(current.worksheets[id].finalText,'current final');
 for(const sheet of [{finalText:42},{checkFacts:true},{custom:[]},{unknown:'x'}]){incoming.worksheets[id]=sheet;assert.throws(()=>b.serialize(incoming));}
});
test('all essay lessons are available while checklist-only state is not written progress or searchable personal text',()=>{
 assert.equal(StepFinder.search({readyOnly:true}).length,45);for(const step of COURSES.find(c=>c.id==='essay').steps)assert.equal(w.has(step.id),true);assert.equal(StepFinder.availability('4-0'),'ready');for(const key of ['0-3','0-4','0-5'])assert.equal(StepFinder.availability(key),'ready');
 const state=empty();state.worksheets[id]={review:'confirmed',...Object.fromEntries(checks.map(([key])=>[key,'confirmed']))};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].finalText='private-final-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-final-token'},state).length,0);
});
