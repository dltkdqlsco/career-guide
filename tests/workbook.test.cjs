const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window={};require('../dist/career-data.js');require('../dist/workbook.js');
const w=window.Workbook;
test('empty inputs produce no invented background or achievements',()=>{
  assert.equal(w.compose({}),'');
  const result=w.compose({target:'디자이너',rules:'추측 금지'});
  assert.match(result,/디자이너/);assert.match(result,/추측 금지/);
  assert.doesNotMatch(result,/백엔드|Spring|700|나의 배경/);
});
test('manual final draft is preserved when its source fields change',()=>{
  const data={target:'기존 직무',custom:'제가 직접 고친 글\n두 번째 줄'};
  data.target='다른 직무';
  assert.equal(w.output(data),'제가 직접 고친 글\n두 번째 줄');
  delete data.custom;assert.match(w.output(data),/다른 직무/);
});
test('intentionally emptied final text is not replaced silently',()=>{
  assert.equal(w.output({target:'개발자',custom:''}),'');
});
test('new forms survive storage roundtrip and old note-only storage migrates',()=>{
  assert.deepEqual(w.clean(undefined),{});
  const raw={'0-1':{target:'기획자',custom:'내 문장'},'0-2':{original:'원문',truth:true,role:false,voice:true}};
  assert.deepEqual(w.clean(JSON.parse(JSON.stringify(raw))),raw);
  assert.deepEqual(w.clean({'0-1':{target:42,custom:null}}),{'0-1':{}});
});
test('completion requires real input and a nonempty prompt',()=>{
  assert.match(w.validate('0-1',{}),/목표 직무/);
  const data=Object.fromEntries(w.promptFields.map(([key])=>[key,'작성한 내용']));
  assert.equal(w.validate('0-1',data),'');data.custom='';
  assert.match(w.validate('0-1',data),/비어/);
});
test('revision completion requires all three reviews',()=>{
  const data=Object.fromEntries(w.revisionFields.map(([key])=>[key,'확인한 내용']));
  assert.match(w.validate('0-2',data),/3개/);
  for(const [key] of w.checks)data[key]=true;
  assert.equal(w.validate('0-2',data),'');
});
test('exports retain raw input, custom-only drafts, unicode and linebreaks',()=>{
  const text='한글 😀 <script>\n& "인용"';
  assert.ok(w.exportText('0-1',{custom:text}).includes(text));
  assert.ok(w.exportText('0-2',{original:text,revised:'수정본'}).includes(text));
  assert.match(w.exportText('0-2',{revised:'수정본',truth:true}),/\[x\]/);
  assert.equal(w.exportText('0-2',{}),'');
});
test('AI first three and company first ten lessons are ready while later content stays pending',()=>{
  for(const id of ['0-0','0-1','0-2','1-0','1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','1-9'])assert.equal(w.has(id),true);
  for(const id of ['0-3','0-4','0-5'])assert.equal(w.has(id),true);
});
test('company prompts compose only supplied values and preserve manual or intentionally empty final text',()=>{
  assert.equal(w.compose({},'1-2'),'');
  const data={target:'내 목표 기업 / 운영',question:'내 질문',custom:'직접 고친 기업 지침'};
  assert.equal(w.output(data,'1-2'),data.custom);
  data.custom='';assert.equal(w.output(data,'1-2'),'');
  delete data.custom;
  const result=w.output(data,'1-2');
  assert.match(result,/내 목표 기업 \/ 운영/);assert.match(result,/분석 목적·질문/);
  assert.doesNotMatch(result,/다온|SQL|내 경험과 근거|성과 수치/);
  assert.equal(w.compose(data,'1-0'),'');
});
test('company forms survive cleanup and require all fields before completion',()=>{
  const raw={};
  for(const id of ['1-0','1-1','1-2']){
    raw[id]=Object.fromEntries(w.fields(id).map(([key])=>[key,'내 정보\n한글 😀']));
    assert.equal(w.validate(id,raw[id]),'');
    const [key]=w.fields(id)[0];assert.match(w.validate(id,{...raw[id],[key]:' '}),/먼저 작성/);
  }
  raw['1-2'].custom='';assert.match(w.validate('1-2',raw['1-2']),/비어/);
  assert.deepEqual(w.clean(JSON.parse(JSON.stringify(raw))),raw);
  assert.match(w.exportText('1-0',raw['1-0']),/사실과 미확인 내용/);
  assert.ok(w.exportText('1-1',raw['1-1']).includes('내 정보\n한글 😀'));
});

test('AI prompt separates reusable information and current instructions using only supplied text',()=>{
 const data={target:'대상-marker',background:'배경-marker',task:'작업-marker',evidence:'경험-marker\n제공자료-marker',format:'형식-marker',rules:'규칙-marker',custom:'제외-marker',original:'제외-answer'};
 const text=w.compose(data);
 for(const key of ['target','background','task','evidence','format','rules'])assert.equal(text.split(data[key]).length-1,1);
 const headings=['#나의 정보','#해결하고자 하는 문제','#출력 방법','#마무리'];
 for(let i=0;i<headings.length;i++){assert.ok(text.includes(headings[i]));if(i)assert.ok(text.indexOf(headings[i])>text.indexOf(headings[i-1]));}
 assert.doesNotMatch(text,/제외-|Java|700자|다온테크/);
 const partial=w.compose({background:'내 배경'});assert.match(partial,/#나의 정보/);assert.doesNotMatch(partial,/#해결하고자|#출력 방법|#마무리/);
 assert.equal(w.compose({custom:'수동',original:'답변'}),'');assert.equal(w.output(data),'제외-marker');
});

test('completion feedback identifies the next missing field without a long list',()=>{
 for(const id of ['0-1','0-3','1-0','1-4','2-0','3-0','4-8']){
  const fields=w.requiredFields(id).filter(([key])=>key!=='review'),message=w.validate(id,{});assert.ok(message.includes(fields[0][1]));assert.match(message,/외 \d+개 항목/);assert.ok(message.length<120);assert.ok(!message.includes(fields[1][1]));
 }
 const card=w.validateVerificationCard({});assert.match(card,/외 \d+개 항목/);assert.ok(card.length<120);
 const collection=w.validate(w.collectionId,{cards:[{}]});assert.match(collection,/자료 1:/);assert.match(collection,/외 \d+개 항목/);assert.ok(collection.length<120);
});
test('essay final text requirements and checklist confirmation have separate completion feedback',()=>{
 const id='2-9',lesson=window.CareerLessons.lessons[id],data=Object.fromEntries(w.requiredFields(id).filter(([key])=>key!=='review'&&!lesson.checklist.some(([check])=>check===key)).map(([key])=>[key,'검토한 본문']));
 assert.match(w.validate(id,data),/체크리스트/);for(const [key] of lesson.checklist)data[key]='confirmed';assert.match(w.validate(id,data),/최종 확인/);data.review='confirmed';assert.equal(w.validate(id,data),'');
});
