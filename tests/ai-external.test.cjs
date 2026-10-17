const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup;
const schemas={
 '0-3':['target','materials','instructions','draft','finalText','status'],
 '0-4':['target','data','metrics','chart','interpretation','status'],
 '0-5':['target','materials','protocol','session','feedback','plan']
};
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
for(const [id,keys] of Object.entries(schemas)){
 test(`${id} needs all records and review, supports honest unexecuted preparation and no example autofill`,()=>{
  const lesson=CareerLessons.lessons[id],example=Object.fromEntries(lesson.fields.map(f=>[f[0],f[3]]));example.review='confirmed';
  assert.equal(w.has(id),true);assert.equal(StepFinder.availability(id),'ready');assert.deepEqual(w.requiredFields(id).map(f=>f[0]),[...keys,'review']);
  assert.equal(w.validate(id,example),'');for(const key of [...keys,'review'])assert.notEqual(w.validate(id,{...example,[key]:''}),'');
  assert.match(example.status||example.session,/미실행|아직 하지 않음/);assert.equal(w.compose({},id),'');assert.equal(w.exportText(id,{}),'');
  for(const ref of lesson.refs)assert.equal(w.has(ref),true);
 });
 test(`${id} composes only chosen evidence and protects independent outputs, raw answers and blank/manual requests`,()=>{
  const lesson=CareerLessons.lessons[id],data=Object.fromEntries(keys.map(key=>[key,'private-'+key]));data.original='raw-marker';data.review='confirmed';
  const prompt=w.compose(data,id);for(const key of lesson.inputs)assert.ok(prompt.includes(data[key]));for(const key of keys.filter(key=>!lesson.inputs.includes(key)))assert.ok(!prompt.includes(data[key]));assert.ok(!prompt.includes('raw-marker'));
  for(const custom of ['', 'manual 한글 😀'])assert.equal(w.output({...data,custom},id),custom);
 });
 test(`${id} backup roundtrip preserves legacy notes and completion, and rejects malformed records`,()=>{
  const state=empty();state.notes[id]='legacy 메모 </textarea>';state.worksheets[id]={...Object.fromEntries(keys.map(k=>[k,'내 기록 한글 😀\n'+k])),review:'confirmed',original:'raw answer',custom:''};state.done[id]=true;state.last=`#course/ai/${id.slice(2)}/write`;
  assert.deepEqual(b.parse(b.serialize(state)).data,state);for(const key of [...keys,'original'])assert.ok(w.exportText(id,state.worksheets[id]).includes(state.worksheets[id][key]));
  for(const bad of [{target:42},{review:true},{custom:null},{unknown:'bad'}]){const invalid=empty();invalid.worksheets[id]=bad;assert.throws(()=>b.serialize(invalid));}
  state.worksheets[id].review='';assert.equal(b.parse(b.serialize(state)).data.done[id],false);
 });
}
test('selective restore isolates resumed lessons and retains previous AI, essay, portfolio and interview work',()=>{
 const current=empty(),incoming=empty();for(const id of ['0-3','0-4','0-5']){current.worksheets[id]={target:'current '+id,custom:''};incoming.worksheets[id]={target:'incoming '+id,custom:'incoming request'};current.notes[id]='old note';incoming.notes[id]='new note';}
 for(const [id,data] of Object.entries({'0-1':{target:'prior prompt',custom:''},'0-2':{revised:'prior text',truth:true},'2-9':{finalText:'essay',checkFacts:'confirmed'},'3-9':{handoff:'portfolio'},'4-7':{plan:'video plan',original:'raw'}}))current.worksheets[id]=data;
 const before=JSON.stringify(current),next=b.merge(current,incoming,{'0-4':'incoming'}).next;assert.deepEqual(next.worksheets['0-4'],incoming.worksheets['0-4']);
 for(const id of ['0-3','0-5','0-1','0-2','2-9','3-9','4-7'])assert.deepEqual(next.worksheets[id],current.worksheets[id]);assert.equal(JSON.stringify(current),before);
});
test('all 45 lessons are available and private practice records do not enter finder search',()=>{
 assert.equal(StepFinder.search({readyOnly:true}).length,45);assert.equal(StepFinder.search({course:'ai',readyOnly:true}).length,6);
 const state=empty();for(const id of Object.keys(schemas)){state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].original='unique-private-practice-token';assert.equal(StepFinder.progress(id,state),'in-progress');}assert.equal(StepFinder.search({query:'unique-private-practice-token'},state).length,0);
});
