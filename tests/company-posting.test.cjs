const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup,id=w.postingId;
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>Object.fromEntries(w.requiredFields(id).map(([key])=>[key,`실제 공고 ${key}\n한글 😀`]));
test('posting completion requires source and original as well as separate requirements, not reference material',()=>{
  const data=filled();assert.equal(w.requiredFields(id).length,9);assert.equal(w.validate(id,data),'');
  for(const [key] of w.requiredFields(id))assert.match(w.validate(id,{...data,[key]:' '}),/먼저 작성/);
  assert.equal(w.validate(id,{...data,preferred:'공고에 미기재 / 상세 공고 확인 필요'}),'');
  assert.match(w.validate(id,{...data,references:'경력직 공고'}),/적용 한계/);
  assert.match(w.validate(id,{...data,referenceLimits:'경력 수준 차이'}),/참고한 공고의 내용/);
  assert.equal(w.validate(id,{...data,references:'경쟁사 경력직 공고',referenceLimits:'다른 법인·경력 수준. 조사 질문으로만 참고'}),'');
});
test('editing requirement classifications never changes the saved original, reference or earlier analysis',()=>{
  const raw={[id]:{...filled(),references:'참고 SQL 필수',referenceLimits:'경쟁사 조건'},'1-4':{original:'AI 원문',custom:'수동 요청'},'1-5':{cards:[{claim:'기존 검증'}]}};
  const clean=w.clean(raw);clean[id].qualifications='내가 분류한 필수';clean[id].technologies='내가 확인한 기술';
  assert.equal(clean[id].original,raw[id].original);assert.equal(clean[id].references,'참고 SQL 필수');assert.equal(clean['1-4'].custom,'수동 요청');assert.equal(raw[id].qualifications,'실제 공고 qualifications\n한글 😀');
  assert.equal(w.compose(clean[id],id),'');assert.equal(w.isPrompt(id),false);
});
test('posting export separates primary requirements from reference scope and preserves raw multiline text',()=>{
  assert.equal(w.exportText(id,{}),'');const data={...filled(),references:'경쟁사 경력직 SQL 3년',referenceLimits:'지원 요건으로 옮기지 않음'};
  const text=w.exportText(id,data);assert.match(text,/\[필수 자격·필요 역량\]/);assert.match(text,/\[우대 사항\]/);assert.match(text,/\[참고 공고 · 선택\]/);assert.match(text,/\[참고 공고의 차이·적용 한계\]/);
  for(const value of Object.values(data))assert.ok(text.includes(value));
});
test('posting backups preserve all fields and legacy notes through selective restore without touching previous steps',()=>{
  const current=empty(),incoming=empty();current.worksheets={[id]:{original:'현재 공고'},'1-4':{custom:'내 지침'},'1-5':{cards:[{claim:'기존 주장',verdict:'unverified'}]}};current.notes[id]='현재 메모';
  incoming.worksheets[id]={...filled(),references:'참고 R',referenceLimits:'다른 회사'};incoming.notes[id]='복원 메모';incoming.done[id]=true;
  const parsed=b.parse(b.serialize(incoming));assert.deepEqual(parsed.warnings,[]);assert.deepEqual(parsed.data,incoming);
  const next=b.merge(current,incoming,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets[id],incoming.worksheets[id]);assert.deepEqual(next.worksheets['1-5'],current.worksheets['1-5']);assert.equal(next.worksheets['1-4'].custom,'내 지침');assert.equal(next.notes[id],'복원 메모');assert.equal(current.worksheets[id].original,'현재 공고');
  assert.deepEqual(b.parse(b.serialize(empty())).data,empty());
});
test('posting backup rejects unknown fields and nonstring data; unpaired reference clears completion',()=>{
  for(const sheet of [{original:42},{references:[]},{referenceLimits:false},{custom:'지원 안 함'},{cards:[]},JSON.parse('{"__proto__":"bad"}')]){const data=empty();data.worksheets[id]=sheet;assert.throws(()=>b.serialize(data));}
  const data=empty();data.worksheets[id]={...filled(),references:'한계 없이 쓴 참고 공고'};data.done[id]=true;const parsed=b.parse(b.serialize(data));assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.done[id],false);assert.equal(parsed.data.worksheets[id].references,'한계 없이 쓴 참고 공고');
});
test('posting clean accepts only string fields and exports no invented employment conditions',()=>{
  const data=w.clean({[id]:{source:'지원 공고 원문',original:'<script> 한글 😀',application:42,qualifications:false,custom:'제외'}});
  assert.deepEqual(data,{[id]:{source:'지원 공고 원문',original:'<script> 한글 😀'}});const text=w.exportText(id,data[id]);assert.doesNotMatch(text,/정규직|SQL|마감|신입/);assert.match(text,/<script> 한글 😀/);
});
test('posting progress derives from text without searching private posting excerpts',()=>{
  const data=empty();assert.equal(StepFinder.availability(id),'ready');assert.equal(StepFinder.availability('4-0'),'ready');data.worksheets[id]={};assert.equal(StepFinder.progress(id,data),'not-started');data.worksheets[id].original='목차에없는비공개공고';assert.equal(StepFinder.progress(id,data),'in-progress');assert.equal(StepFinder.search({query:'목차에없는비공개공고'},data).length,0);
});
