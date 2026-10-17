const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/curriculum.js');require('../dist/career-data.js');require('../dist/workbook.js');require('../dist/backup-core.js');require('../dist/finder.js');
const w=Workbook,b=RecordBackup,id=w.roleId;
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>Object.fromEntries(w.requiredFields(id).map(([key])=>[key,`근거 A / ${key}\n한글 😀`]));
test('role completion supports manual analysis with one keyword, no AI answer and no supplied experience',()=>{
  const data=filled();assert.equal(w.requiredFields(id).length,7);assert.equal(w.validate(id,data),'');
  assert.equal(w.validate(id,{...data,custom:'',matches:'경험 미제공으로 미연결. 다음 단계에서 실제 경험 정리'}),'');
  for(const [key] of w.requiredFields(id))assert.match(w.validate(id,{...data,[key]:' '}),/먼저 작성/);
});
test('role prompt requests the three source structures and keeps missing experience and comparison explicitly unknown',()=>{
  assert.equal(w.compose({},id),'');assert.equal(w.compose({original:'답변',keyword1:'내 해석'},id),'');
  const text=w.compose({target:'실제 대상',posting:'실제 공고 원문'},id);for(const term of ['공고 특징','강점 키워드','1~2개','필요 경험 유형','미제공','미연결','필수·우대'])assert.ok(text.includes(term));assert.doesNotMatch(text,/다온테크|LG CNS|제가 API를 구현/);
});
test('role prompt uses only four preparation fields, distinguishing reference postings from actual source',()=>{
  const text=w.compose({target:'내 대상',posting:'지원 원문 A',experience:'직접 작성한 코드',comparison:'경쟁사 경력직 R / 다른 법인',original:'제외할AI답변',features:'제외할분석',keyword1:'제외할키워드',matches:'제외할연결판단'},id);
  for(const term of ['내 대상','지원 원문 A','직접 작성한 코드','경쟁사 경력직 R','지원 공고와 구분','공고의 필수 요건으로 옮기지'])assert.ok(text.includes(term));assert.doesNotMatch(text,/제외할/);
});
test('role custom prompt and AI original survive independent edits and intentional blank prompts',()=>{
  const raw={[id]:{...filled(),original:'받은 원문',custom:'수동 요청',keyword2:'두 번째 근거'}};const clean=w.clean(raw);clean[id].posting='새 공고';clean[id].features='수정 분석';assert.equal(w.output(clean[id],id),'수동 요청');assert.equal(clean[id].original,'받은 원문');clean[id].custom='';assert.equal(w.output(clean[id],id),'');assert.equal(raw[id].custom,'수동 요청');
});
test('role export and backup roundtrip retain original, optional fields, prompt and previous notes',()=>{
  const data=empty();data.worksheets[id]={...filled(),experience:'실제 경험',comparison:'참고 R',original:'AI 답변',keyword2:'선택 키워드',custom:'수정한 지침'};data.notes[id]='기존 메모';data.done[id]=true;
  const result=b.parse(b.serialize(data));assert.deepEqual(result.data,data);assert.deepEqual(result.warnings,[]);const text=w.exportText(id,data.worksheets[id]);for(const value of Object.values(data.worksheets[id]))assert.ok(text.includes(value));assert.equal(w.exportText(id,{}),'');
});
test('role malformed backup is rejected and incomplete completion is cleared while evidence remains',()=>{
  for(const sheet of [{posting:42},{keyword1:[]},{custom:false},{cards:[]},{unexpected:'값'}]){const data=empty();data.worksheets[id]=sheet;assert.throws(()=>b.serialize(data));}
  const data=empty();data.worksheets[id]={posting:'실제 공고'};data.done[id]=true;const parsed=b.parse(b.serialize(data));assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.done[id],false);assert.equal(parsed.data.worksheets[id].posting,'실제 공고');
});
test('role selective restore preserves stage 7 original and reference limits plus earlier custom instructions',()=>{
  const current=empty(),incoming=empty();current.worksheets={'1-6':{original:'7단계 원문',references:'참고 원문',referenceLimits:'경력 수준 차이'},'1-4':{custom:'이전 지침'},[id]:{original:'현재 답변'}};current.notes[id]='현재 메모';incoming.worksheets[id]={...filled(),custom:'복원 요청'};incoming.notes[id]='복원 메모';
  const next=b.merge(current,incoming,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets['1-6'],current.worksheets['1-6']);assert.equal(next.worksheets['1-4'].custom,'이전 지침');assert.deepEqual(next.worksheets[id],incoming.worksheets[id]);assert.equal(next.notes[id],'복원 메모');assert.equal(current.worksheets[id].original,'현재 답변');assert.deepEqual(b.parse(b.serialize(empty())).data,empty());
});
test('role cleaning and progress preserve valid text without indexing personal experiences',()=>{
  assert.deepEqual(w.clean({[id]:{posting:'원문',experience:42,custom:'',other:'제외'}}),{[id]:{posting:'원문',custom:''}});
  const data=empty();data.worksheets[id]={};assert.equal(StepFinder.progress(id,data),'not-started');data.worksheets[id].experience='목차에없는개인경험';assert.equal(StepFinder.progress(id,data),'in-progress');assert.equal(StepFinder.search({query:'목차에없는개인경험'},data).length,0);assert.equal(StepFinder.availability(id),'ready');assert.equal(StepFinder.availability('4-0'),'ready');
});
