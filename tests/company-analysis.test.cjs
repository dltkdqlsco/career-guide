const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/curriculum.js');require('../dist/career-data.js');require('../dist/workbook.js');require('../dist/backup-core.js');require('../dist/finder.js');require('../dist/company-analysis.js');
const w=Workbook,b=RecordBackup,id='1-4';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>Object.fromEntries(w.requiredFields(id).map(([key])=>[key,'자료 A 12쪽 / 해석 / 미확인 한글 😀']));
test('analysis prompt uses preparation only, never promotes a received answer or private notes into source evidence',()=>{
  assert.equal(w.compose({},id),'');
  assert.equal(w.compose({original:'AI 답변',overview:'내 해석',application:'개인 경험'},id),'');
  const prompt=w.compose({target:'검토 기업 / 기준일',sources:'실제 원문 A',original:'유출금지답변',swot:'유출금지해석'},id);
  for(const [,label] of w.analysisAreas)assert.ok(prompt.includes(label));
  assert.match(prompt,/실제 원문 A/);assert.match(prompt,/링크를 읽을 수 없으면/);assert.match(prompt,/추가 조사는 제가/);
  assert.doesNotMatch(prompt,/유출금지|다온테크|현대오토에버/);
});
test('analysis manual prompt and original answer survive cleaning and independent edits including intentionally empty drafts',()=>{
  const data={...filled(),custom:'내 수정본',application:'실제 경험'};
  const cleaned=w.clean({[id]:data});cleaned[id].sources='새 자료';
  assert.equal(w.output(cleaned[id],id),'내 수정본');assert.equal(cleaned[id].original,data.original);
  cleaned[id].custom='';assert.equal(w.output(cleaned[id],id),'');assert.equal(data.custom,'내 수정본');
  assert.deepEqual(w.clean({[id]:{original:42,custom:false,unknown:'제외',target:'보존'}}),{[id]:{target:'보존'}});
});
test('analysis completion requires five areas and original but experience connection is optional',()=>{
  const data=filled();assert.equal(w.validate(id,data),'');
  for(const key of ['original',...w.analysisAreas.map(([key])=>key)])assert.match(w.validate(id,{...data,[key]:' '}),/먼저 작성/);
  assert.match(w.validate(id,{...data,custom:''}),/비어/);
  assert.equal(w.validate(id,{...data,market:'미확인 / 산업 보고서 필요'}),'');
});
test('analysis exports and backup roundtrip retain original, five areas, manual prompt and old notes',()=>{
  const data=empty();data.worksheets[id]={...filled(),custom:'수동 수정\n<script> 😀',application:'경험 메모'};data.notes[id]='이전 메모';data.done[id]=true;
  data.worksheets['1-2']={custom:'이전 지침'};data.worksheets['1-3']={cards:[{source:'기존 자료'}]};
  const result=b.parse(b.serialize(data));assert.deepEqual(result.data,data);assert.deepEqual(result.warnings,[]);
  const text=w.exportText(id,data.worksheets[id]);for(const value of Object.values(data.worksheets[id]))assert.ok(text.includes(value));
  assert.equal(w.exportText(id,{}),'');assert.deepEqual(b.parse(b.serialize(empty())).data,empty());
});
test('analysis backup rejects malformed fields and resets invalid completion',()=>{
  for(const sheet of [{overview:42},{custom:false},{unknown:'값'},{cards:[]}]){
    const data=empty();data.worksheets[id]=sheet;assert.throws(()=>b.serialize(data));
  }
  const data=empty();data.worksheets[id]={original:'미완성 답변'};data.done[id]=true;
  const result=b.parse(b.serialize(data));assert.deepEqual(result.warnings,[id]);assert.equal(result.data.done[id],false);assert.equal(result.data.worksheets[id].original,'미완성 답변');
});
test('selective analysis restore preserves unrelated instructions and cards',()=>{
  const current=empty(),incoming=empty();current.worksheets={'1-2':{custom:'내 지침'},'1-3':{cards:[{source:'내 자료'}]},[id]:{original:'현재'}};
  current.notes[id]='현재 메모';incoming.worksheets[id]={...filled(),custom:'복원 지침'};incoming.notes[id]='복원 메모';
  assert.equal(b.inspect(current,incoming)[0].status,'conflict');const next=b.merge(current,incoming,{[id]:'incoming'}).next;
  assert.deepEqual(next.worksheets[id],incoming.worksheets[id]);assert.deepEqual(next.worksheets['1-3'],current.worksheets['1-3']);assert.deepEqual(next.worksheets['1-2'],current.worksheets['1-2']);assert.equal(next.notes[id],'복원 메모');assert.equal(current.worksheets[id].original,'현재');
});
test('analysis progress is available without adding personal analysis to search content',()=>{
  const data=empty();assert.equal(StepFinder.availability(id),'ready');assert.equal(StepFinder.availability('4-0'),'ready');
  data.worksheets[id]={original:'목차에없는비공개분석'};assert.equal(StepFinder.progress(id,data),'in-progress');assert.equal(StepFinder.search({query:'목차에없는비공개분석'},data).length,0);
});
test('all four followup templates require comparison context and evidence',()=>{
  assert.equal(CompanyAnalysis.questions.length,4);for(const [key] of CompanyAnalysis.questions){const text=CompanyAnalysis.followup(key);assert.match(text,/기준일/);assert.match(text,/근거 위치/);assert.match(text,/미확인/);}assert.equal(CompanyAnalysis.followup('unknown'),'');
});
