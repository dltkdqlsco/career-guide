const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup;
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const card=(label='내 자료')=>Object.fromEntries(w.sourceFields.map(([key])=>[key,`${label} ${key}\n한글 😀`]));

test('empty and partial research cards do not count as a finished collection',()=>{
  assert.equal(w.exportText('1-3',{cards:[{}]}),'');
  assert.match(w.validate('1-3',{}),/한 개 이상/);
  assert.match(w.validate('1-3',{cards:[card(),{target:'두 번째'}]}),/자료 2/);
  assert.equal(w.validate('1-3',{cards:[card(),card('두 번째')]}),'');
});
test('cleaning retains all source records and old manually edited prompts without aliasing',()=>{
  const raw={'1-3':{cards:[card(),card('둘째')]},'1-2':{custom:''},'0-1':{custom:'내 수정본'}};
  const clean=w.clean(raw);assert.deepEqual(clean,raw);
  clean['1-3'].cards[0].target='변경';assert.notEqual(raw['1-3'].cards[0].target,'변경');
  assert.deepEqual(w.clean({'1-3':{cards:[null,{target:42,source:'자료',extra:'제외'}]}}),{'1-3':{cards:[{source:'자료'}]}});
});
test('JSON backup roundtrip includes every source card, legacy notes and the exact tab',()=>{
  const data=empty();data.worksheets['1-3']={cards:[card(),card('두 번째')]};data.notes['1-3']='기존 자유 메모';data.done['1-3']=true;data.last='#course/company/3/write';
  const restored=b.parse(b.serialize(data));assert.deepEqual(restored.data,data);assert.deepEqual(restored.warnings,[]);
  assert.deepEqual(b.parse(b.serialize(empty())).data,empty());
  assert.equal(b.counts(data).worksheets,1);
});
test('backup validation rejects malformed nested source cards and prototype keys',()=>{
  for(const value of [null,'문자열',{},Array(21).fill({}),[null],[[]],[{source:42}],[{unknown:'x'}],[JSON.parse('{"__proto__":{"x":1}}')]]){
    const data=empty();data.worksheets['1-3']={cards:value};assert.throws(()=>b.serialize(data));
  }
  const data=empty();data.worksheets['1-3']={custom:'허용 안 됨'};assert.throws(()=>b.serialize(data));
});
test('source-card key order is irrelevant while array order and content still produce conflicts',()=>{
  const a=empty(),z=empty();a.worksheets['1-3']={cards:[card(),card('다른 자료')]};
  z.worksheets['1-3']={cards:a.worksheets['1-3'].cards.map(item=>Object.fromEntries(Object.entries(item).reverse()))};
  assert.equal(b.inspect(a,z)[0].status,'same');z.worksheets['1-3'].cards.reverse();assert.equal(b.inspect(a,z)[0].status,'conflict');
});
test('selective restore replaces all cards for the chosen step and preserves unrelated writing',()=>{
  const current=empty(),incoming=empty();current.worksheets={'1-3':{cards:[card('현재')]},'1-2':{custom:'보존'}};current.notes['1-3']='현재 메모';
  incoming.worksheets['1-3']={cards:[card('백업1'),card('백업2')]};incoming.notes['1-3']='백업 메모';
  assert.deepEqual(b.merge(current,incoming).next,current);
  const next=b.merge(current,incoming,{'1-3':'incoming'}).next;
  assert.deepEqual(next.worksheets['1-3'],incoming.worksheets['1-3']);assert.equal(next.worksheets['1-2'].custom,'보존');assert.equal(next.notes['1-3'],'백업 메모');
  next.worksheets['1-3'].cards[0].target='독립 사본';assert.notEqual(incoming.worksheets['1-3'].cards[0].target,'독립 사본');
});
test('incomplete imported source cards lose only their completion marker',()=>{
  const data=empty();data.worksheets['1-3']={cards:[{target:'조사 중'}]};data.done['1-3']=true;data.notes['1-3']='메모 유지';
  const result=b.parse(b.serialize(data));assert.deepEqual(result.warnings,['1-3']);assert.equal(result.data.done['1-3'],false);assert.equal(result.data.notes['1-3'],'메모 유지');assert.equal(result.data.worksheets['1-3'].cards[0].target,'조사 중');
});
test('search progress finds nested writing without indexing personal source-card content',()=>{
  const state=empty();state.worksheets['1-3']={cards:[{}]};assert.equal(StepFinder.progress('1-3',state),'not-started');
  state.worksheets['1-3'].cards[0].questions='비공개검색내용';assert.equal(StepFinder.progress('1-3',state),'in-progress');
  assert.equal(StepFinder.search({query:'비공개검색내용'},state).length,0);
  assert.equal(StepFinder.search({course:'company',status:'in-progress'},state)[0].href,'#course/company/3/write');
  assert.equal(StepFinder.availability('1-3'),'ready');assert.equal(StepFinder.availability('4-0'),'ready');
});
test('text export keeps source-card boundaries, exact multiline text and incomplete records',()=>{
  const payload='자료 </textarea><script>제어 아님</script>\n두 번째 줄';
  const text=w.exportText('1-3',{cards:[{evidence:payload},{target:'둘째'}]});
  assert.ok(text.includes(payload));assert.match(text,/\[자료 1\]/);assert.match(text,/\[자료 2\]/);assert.doesNotMatch(text,/다온테크|가상 사업보고서/);
});
