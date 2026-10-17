const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/curriculum.js');require('../dist/career-data.js');require('../dist/workbook.js');require('../dist/backup-core.js');require('../dist/finder.js');
const w=Workbook,b=RecordBackup;
const schemas={
 '3-3':['target','overview','features','roles','evidence','finalText'],
 '3-4':['target','context','options','implementation','evidence','finalText'],
 '3-5':['target','incident','investigation','action','measurement','finalText'],
 '3-6':['target','facts','keep','problem','try','finalText'],
 '3-7':['target','materials','criteria','comparison','choice','plan'],
 '3-8':['target','materials','storyboard','visuals','handoff','status'],
 '3-9':['target','materials','structure','checks','handoff','status']
};
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=id=>({...Object.fromEntries(schemas[id].map(key=>[key,`actual ${key} \ud55c\uae00 \ud83d\ude00\nrecord, not a fabricated achievement`])),review:'confirmed'});
for(const [id,keys] of Object.entries(schemas)){
 test(`${id} completion needs all evidence records and final review while preserving optional AI/manual usage`,()=>{
  assert.deepEqual(w.requiredFields(id).map(f=>f[0]),[...keys,'review']);assert.equal(w.validate(id,{...filled(id),custom:''}),'');
  for(const key of keys)assert.notEqual(w.validate(id,{...filled(id),[key]:' \n '}),'');
  for(const review of ['',undefined,true])assert.notEqual(w.validate(id,{...filled(id),review}),'');
  assert.equal(w.compose({},id),'');assert.equal(w.exportText(id,{}),'');
 });
 test(`${id} prompts use only supplied inputs and do not recycle final records or AI responses`,()=>{
  const lesson=CareerLessons.lessons[id],data=filled(id);const excluded=keys.filter(k=>!lesson.inputs.includes(k));
  for(const key of excluded)data[key]=`EXCLUDED-${key}`;data.original='EXCLUDED-AI';
  const text=w.compose(data,id);for(const key of lesson.inputs)assert.ok(text.includes(data[key]),key);assert.doesNotMatch(text,/EXCLUDED-/);
  assert.equal(w.compose({...Object.fromEntries(excluded.map(k=>[k,'private final record'])),original:'AI response'},id),'');
  for(const custom of ['manual request',''])assert.equal(w.output({...data,custom},id),custom);
 });
 test(`${id} backups retain unicode, raw/manual/empty text and notes; malformed fields fail and invalid completion is cleared`,()=>{
  const state=empty(),data={...filled(id),original:'raw </textarea><script>source</script>',custom:''};state.worksheets[id]=data;state.notes[id]='legacy note';state.done[id]=true;state.last=`#course/portfolio/${id.split('-')[1]}/write`;
  assert.deepEqual(b.parse(b.serialize(state)).data,state);assert.deepEqual(w.clean({[id]:data})[id],data);
  const text=w.exportText(id,data);for(const key of [...keys,'original'])assert.ok(text.includes(data[key]),key);
  state.worksheets[id].review='';const parsed=b.parse(b.serialize(state));assert.equal(parsed.data.done[id],false);assert.ok(parsed.warnings.includes(id));
  for(const bad of [{[keys[0]]:42},{[keys[1]]:[]},{review:true},{custom:null},{unknown:'value'}]){state.worksheets[id]=bad;assert.throws(()=>b.serialize(state));}
 });
}
test('portfolio all ten stages are ready with resolvable references; interview is ready and previously held content is now available',()=>{
 const portfolio=COURSES.find(c=>c.id==='portfolio');assert.equal(portfolio.steps.length,10);assert.equal(StepFinder.search({readyOnly:true}).length,45);
 for(const step of portfolio.steps){assert.equal(step.kind,'write');assert.equal(w.has(step.id),true);assert.equal(StepFinder.availability(step.id),'ready');const lesson=CareerLessons.lessons[step.id];for(const ref of lesson.refs)assert.equal(w.has(ref),true);const state=empty();state.worksheets[step.id]={review:'confirmed'};assert.equal(StepFinder.progress(step.id,state),'not-started');state.worksheets[step.id].original='private-complete-portfolio-token';assert.equal(StepFinder.progress(step.id,state),'in-progress');assert.equal(StepFinder.search({query:'private-complete-portfolio-token'},state).length,0);}
 assert.equal(w.has('4-0'),true);for(const id of ['0-3','0-4','0-5'])assert.equal(StepFinder.availability(id),'ready');
 for(const id of ['3-8','3-9']){assert.ok(CareerLessons.lessons[id].preparationOnly);assert.equal(CareerLessons.lessons[id].finalTextKey,'handoff');}
});
test('selective portfolio restoration protects other stages, essay final checks and intentionally blank requests',()=>{
 const current=empty(),incoming=empty();for(const id of Object.keys(schemas)){current.worksheets[id]={...filled(id),custom:''};incoming.worksheets[id]={...filled(id),custom:'incoming request'};current.notes[id]='protected note';incoming.notes[id]='changed note';}
 current.worksheets['2-9']={finalText:'protected essay',checkFacts:'confirmed'};current.worksheets['3-1']={finalText:'protected catchphrase',custom:''};
 const before=JSON.stringify(current),parsed=b.parse(b.serialize(incoming)),next=b.merge(current,parsed.data,{'3-5':'incoming','3-9':'incoming'}).next;
 for(const id of ['3-5','3-9'])assert.deepEqual(next.worksheets[id],incoming.worksheets[id]);for(const id of ['3-3','3-4','3-6','3-7','3-8','2-9','3-1'])assert.deepEqual(next.worksheets[id],current.worksheets[id]);assert.equal(JSON.stringify(current),before);
});
