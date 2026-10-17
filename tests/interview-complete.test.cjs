const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/curriculum.js');require('../dist/career-data.js');require('../dist/workbook.js');require('../dist/backup-core.js');require('../dist/finder.js');
const w=Workbook,b=RecordBackup;
const schemas={
 '4-0':['target','posting','experience','technical','projects','plan'],
 '4-1':['target','question','knowledge','experience','outline','finalText'],
 '4-2':['target','before','evidence','assessment','changes','finalText'],
 '4-3':['target','company','experience','documents','questions','plan'],
 '4-4':['target','question','experience','judgment','outline','finalText'],
 '4-5':['target','before','evidence','assessment','changes','finalText'],
 '4-6':['target','materials','protocol','session','feedback','plan'],
 '4-7':['target','materials','protocol','session','feedback','plan'],
 '4-8':['target','materials','protocol','session','feedback','plan']
};
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=id=>({...Object.fromEntries(schemas[id].map(key=>[key,`actual ${key} \ud55c\uae00 \ud83d\ude00\nmy own record, not an invented interview result`])),review:'confirmed'});
for(const [id,keys] of Object.entries(schemas)){
 test(`${id} needs all six records and final review but no external AI or service result`,()=>{
  assert.deepEqual(w.requiredFields(id).map(f=>f[0]),[...keys,'review']);assert.equal(w.validate(id,{...filled(id),custom:''}),'');
  for(const key of keys)assert.notEqual(w.validate(id,{...filled(id),[key]:' \n '}),'');for(const review of ['',undefined,true])assert.notEqual(w.validate(id,{...filled(id),review}),'');
  assert.equal(w.compose({},id),'');assert.equal(w.exportText(id,{}),'');
  if(id>='4-6'){const example=Object.fromEntries(CareerLessons.lessons[id].fields.map(f=>[f[0],f[3]]));example.review='confirmed';assert.match(example.session,/아직 하지 않음/);assert.match(example.feedback,/미수신/);assert.equal(w.validate(id,example),'');assert.ok(w.compose(example,id).includes(example.session));}
 });
 test(`${id} requests preserve supplied facts and exclude independent final notes and raw AI answers`,()=>{
  const lesson=CareerLessons.lessons[id],data=filled(id),excluded=keys.filter(k=>!lesson.inputs.includes(k));
  for(const key of excluded)data[key]=`EXCLUDED-${key}`;data.original='EXCLUDED-AI';const text=w.compose(data,id);for(const key of lesson.inputs)assert.ok(text.includes(data[key]),key);assert.doesNotMatch(text,/EXCLUDED-/);
  assert.equal(w.compose({...Object.fromEntries(excluded.map(k=>[k,'private independent final'])),original:'AI response'},id),'');for(const custom of ['manual request',''])assert.equal(w.output({...data,custom},id),custom);
 });
 test(`${id} roundtrips Unicode, raw/manual/empty text, notes, completion and tab; malformed backup data is rejected`,()=>{
  const state=empty(),data={...filled(id),original:'raw </textarea><script>answer</script>',custom:''};state.worksheets[id]=data;state.notes[id]='legacy interview note';state.done[id]=true;state.last=`#course/interview/${id.split('-')[1]}/write`;
  assert.deepEqual(b.parse(b.serialize(state)).data,state);assert.deepEqual(w.clean({[id]:data})[id],data);const text=w.exportText(id,data);for(const key of [...keys,'original'])assert.ok(text.includes(data[key]),key);
  state.worksheets[id].review='';const parsed=b.parse(b.serialize(state));assert.equal(parsed.data.done[id],false);assert.ok(parsed.warnings.includes(id));
  for(const bad of [{[keys[0]]:42},{[keys[1]]:[]},{review:true},{custom:null},{unknown:'value'}]){state.worksheets[id]=bad;assert.throws(()=>b.serialize(state));}
 });
}
test('all nine interview steps and their references are ready alongside the three resumed external AI lessons',()=>{
 const course=COURSES.find(c=>c.id==='interview');assert.equal(course.steps.length,9);assert.equal(StepFinder.search({readyOnly:true}).length,45);assert.equal(StepFinder.search({course:'interview',readyOnly:true}).length,9);
 for(const step of course.steps){assert.equal(step.kind,'write');assert.equal(w.has(step.id),true);const lesson=CareerLessons.lessons[step.id];for(const ref of lesson.refs)assert.equal(w.has(ref),true);const state=empty();state.worksheets[step.id]={review:'confirmed'};assert.equal(StepFinder.progress(step.id,state),'not-started');state.worksheets[step.id].original='private-interview-token';assert.equal(StepFinder.progress(step.id,state),'in-progress');assert.equal(StepFinder.search({query:'private-interview-token'},state).length,0);}
 for(const id of ['0-3','0-4','0-5'])assert.equal(StepFinder.availability(id),'ready');for(const id of ['4-6','4-7','4-8'])assert.ok(CareerLessons.lessons[id].practiceTool);
 const state=empty();for(const id of Object.keys(schemas))state.notes[id]='old interview note only';assert.deepEqual(b.parse(b.serialize(state)).data,state);
});
test('selective interview restore preserves other interview answers, mock plans, portfolio outputs and essay final checks',()=>{
 const current=empty(),incoming=empty();for(const id of Object.keys(schemas)){current.worksheets[id]={...filled(id),custom:''};incoming.worksheets[id]={...filled(id),custom:'incoming request'};current.notes[id]='protected note';incoming.notes[id]='incoming note';}
 current.worksheets['2-9']={finalText:'protected essay',checkFacts:'confirmed'};current.worksheets['3-9']={handoff:'protected portfolio draft',status:'not published',custom:''};
 const before=JSON.stringify(current),parsed=b.parse(b.serialize(incoming)),next=b.merge(current,parsed.data,{'4-2':'incoming','4-8':'incoming'}).next;
 for(const id of ['4-2','4-8'])assert.deepEqual(next.worksheets[id],incoming.worksheets[id]);for(const id of ['4-0','4-1','4-3','4-4','4-5','4-6','4-7','2-9','3-9'])assert.deepEqual(next.worksheets[id],current.worksheets[id]);assert.equal(JSON.stringify(current),before);
});
