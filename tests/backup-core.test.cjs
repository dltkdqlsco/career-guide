const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={};
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');
global.Workbook=window.Workbook;
require('../dist/assets/js/backup-core.js');
const b=window.RecordBackup;
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const wrap=data=>JSON.stringify({format:b.format,version:b.version,exportedAt:'2026-10-15T00:00:00Z',data});

test('JSON backup roundtrip retains notes, all fields, empty custom, progress and exact tab',()=>{
  const data=empty();
  data.notes={'0-0':'한글 😀\n<script>not executable</script>','4-0':'면접 메모'};
  data.worksheets={'0-1':{target:'직무',custom:''},'0-2':{original:'원문',truth:false,role:true,voice:false}};
  data.done={'0-0':true,'0-1':false};data.last='#course/ai/1/write';
  assert.deepEqual(b.parse(b.serialize(data)).data,data);
});
test('backup envelope rejects other JSON, unsupported versions, bad dates and missing maps',()=>{
  assert.throws(()=>b.parse('{}'));
  assert.throws(()=>b.parse('# 나의 메모'));
  assert.throws(()=>b.parse(wrap(empty()).replace('"version":1','"version":99')),/버전/);
  assert.throws(()=>b.parse(wrap(empty()).replace('2026-10-15T00:00:00Z','not a date')),/날짜/);
  const data=empty();delete data.notes;assert.throws(()=>b.parse(wrap(data)),/메모/);
  assert.throws(()=>b.parse('[]'));
  assert.deepEqual(b.parse('\uFEFF'+wrap(empty())).data,empty());
});
test('unsafe keys, unknown steps and bad field types never reach merge',()=>{
  for(const group of ['notes','done','worksheets']){
    for(const key of ['__proto__','constructor','unknown-step']){
      const data=empty();Object.defineProperty(data[group],key,{value:'bad',enumerable:true});
      assert.throws(()=>b.parse(wrap(data)));
    }
  }
  for(const value of [null,[],42,{},true]){
    const data=empty();data.notes['0-1']=value;assert.throws(()=>b.parse(wrap(data)));
  }
  const data=empty();data.worksheets['0-1']={custom:42};assert.throws(()=>b.parse(wrap(data)));
  data.worksheets={'0-2':{truth:'true'}};assert.throws(()=>b.parse(wrap(data)));
  data.worksheets={'0-1':{target:'valid',secret:'unknown'}};assert.throws(()=>b.parse(wrap(data)));
  data.worksheets={};data.done['0-0']='true';assert.throws(()=>b.parse(wrap(data)));
  assert.equal({}.polluted,undefined);
});
test('route validation allows real steps and tabs, not scripts or arbitrary routes',()=>{
  for(const route of ['#course/ai/0','#course/ai/1/write','#course/essay/0/example'])assert.equal(b.validRoute(route),true);
  for(const route of ['javascript:alert(1)','#course/ai/99','#course/ai/-1','#course/ai/00','#course/ai/1/bad','#course/ai/1/write/extra','#backup',null])assert.equal(b.validRoute(route),false);
  const data=empty();data.last='https://example.com';assert.throws(()=>b.parse(wrap(data)),/위치/);
});
test('oversized files fail before JSON parsing',()=>{
  assert.throws(()=>b.parse('a'.repeat(b.maxBytes+1)),/10MB/);
  const data=empty();data.notes['0-0']='가'.repeat(Math.ceil(b.maxBytes/3));
  assert.throws(()=>b.serialize(data),/10MB/);
});
test('invalid completion is downgraded without discarding text',()=>{
  const data=empty();data.worksheets['0-1']={target:'미완성 직무',custom:'내 글'};data.done['0-1']=true;
  const parsed=b.parse(wrap(data));
  assert.equal(parsed.data.done['0-1'],false);
  assert.deepEqual(parsed.warnings,['0-1']);
  assert.equal(parsed.data.worksheets['0-1'].custom,'내 글');
});
test('valid completed worksheets survive import',()=>{
  const data=empty();
  data.worksheets['0-1']=Object.fromEntries(Workbook.promptFields.map(([key])=>[key,'작성']));
  data.worksheets['0-2']=Object.fromEntries(Workbook.revisionFields.map(([key])=>[key,'검토']));
  for(const [key] of Workbook.checks)data.worksheets['0-2'][key]=true;
  data.done={'0-1':true,'0-2':true};
  assert.deepEqual(b.parse(wrap(data)).warnings,[]);
  assert.deepEqual(b.parse(wrap(data)).data,data);
});
test('safe merge adds new steps but keeps every conflict and untouched step by default',()=>{
  const current=empty(),incoming=empty();
  current.notes={'0-0':'현재 글','1-0':'기업 메모'};current.done['0-0']=false;
  incoming.notes={'0-0':'이전 글','2-0':'새 자소서 메모'};incoming.done['0-0']=true;
  incoming.last='#course/essay/0/write';
  const original=JSON.stringify(current),backup=JSON.stringify(incoming);
  const plan=b.merge(current,incoming);
  assert.equal(plan.next.notes['0-0'],'현재 글');
  assert.equal(plan.next.done['0-0'],false);
  assert.equal(plan.next.notes['1-0'],'기업 메모');
  assert.equal(plan.next.notes['2-0'],'새 자소서 메모');
  assert.deepEqual(plan.applied,['2-0']);assert.equal(plan.next.last,null);
  assert.equal(JSON.stringify(current),original);assert.equal(JSON.stringify(incoming),backup);
});
test('explicit replacement is atomic for a selected step and preserves all other steps',()=>{
  const current=empty(),incoming=empty();
  current.notes={'0-1':'현재 메모','0-2':'수정 기록'};current.worksheets['0-1']={target:'개발자',custom:'수정본'};current.done['0-1']=true;
  incoming.notes['0-1']='백업의 메모';incoming.done['0-1']=false;
  const plan=b.merge(current,incoming,{'0-1':'incoming'});
  assert.equal(plan.next.notes['0-1'],'백업의 메모');
  assert.equal(plan.next.worksheets['0-1'],undefined);
  assert.equal(plan.next.done['0-1'],false);
  assert.equal(plan.next.notes['0-2'],'수정 기록');
});
test('merging an identical backup is a no-op regardless of object key order',()=>{
  const current=empty(),incoming=empty();
  current.worksheets['0-1']={target:'직무',custom:'글'};
  incoming.worksheets['0-1']={custom:'글',target:'직무'};
  const plan=b.merge(current,incoming);
  assert.equal(plan.rows[0].status,'same');assert.equal(plan.changed,false);
});
test('intentional empty text and incomplete flags are not treated as missing records',()=>{
  const current=empty(),incoming=empty();
  current.notes['0-0']='';current.done['0-1']=false;
  incoming.notes['0-0']='백업 글';incoming.done['0-1']=true;
  const plan=b.merge(current,incoming);
  assert.deepEqual(plan.rows.map(row=>row.status),['conflict','conflict']);
  assert.equal(plan.changed,false);
  const other=empty();other.worksheets['0-1']={custom:''};
  assert.equal(b.merge(empty(),other).next.worksheets['0-1'].custom,'');
});
test('last location is only restored when explicitly selected',()=>{
  const current=empty(),incoming=empty();
  current.last='#course/company/0';incoming.last='#course/ai/2/write';
  assert.equal(b.merge(current,incoming).next.last,current.last);
  assert.equal(b.merge(current,incoming,{},true).next.last,incoming.last);
  assert.equal(b.merge(current,empty(),{},true).next.last,current.last);
});
test('company forms roundtrip with old notes and normalize only incomplete completion flags',()=>{
  const data=empty();data.notes={'1-0':'기존 기업 메모'};
  for(const id of ['1-0','1-1','1-2']){
    data.worksheets[id]=Object.fromEntries(Workbook.fields(id).map(([key])=>[key,'작성한 기업 자료']));data.done[id]=true;
  }
  data.last='#course/company/2/example';assert.deepEqual(b.parse(b.serialize(data)).data,data);
  data.worksheets['1-2'].custom='';const restored=b.parse(b.serialize(data));
  assert.deepEqual(restored.warnings,['1-2']);assert.equal(restored.data.done['1-0'],true);assert.equal(restored.data.done['1-1'],true);
  assert.equal(restored.data.worksheets['1-2'].custom,'');assert.equal(restored.data.notes['1-0'],'기존 기업 메모');
  const old=empty();old.notes['1-0']='양식 없이 쓴 이전 메모';assert.deepEqual(b.parse(wrap(old)).data,old);
});
test('company backups reject unknown fields, wrong types and unknown external worksheet fields',()=>{
  for(const sheets of [{'1-0':{question:42}},{'1-1':{custom:'지원하지 않는 필드'}},{'1-2':{custom:false}},{'0-3':{unknown:'invalid field'}}]){
    const data=empty();data.worksheets=sheets;assert.throws(()=>b.parse(wrap(data)));
  }
});
