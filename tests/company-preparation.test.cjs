const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup,id='1-9';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({target:'지원 기업·직무 / 문항 / 700자',evidence:'공고 A / 확인일 / 내 코드',motivation:'내 선택 기준과 공고 근거',plans:'단기 학습·기여 / 중장기 개선',editing:'사실·문법·반복·말투·제출 조건 교정',review:'confirmed'});
test('preparation requires five records and final review; AI request and answer are optional',()=>{
 const data=filled();assert.equal(w.validate(id,data),'');assert.equal(w.validate(id,{...data,custom:''}),'');
 for(const key of ['target','evidence','motivation','plans','editing'])assert.match(w.validate(id,{...data,[key]:' '}),/먼저 작성/);
 for(const review of ['',undefined,true,'yes'])assert.match(w.validate(id,{...data,review}),/최종 확인/);
});
test('preparation prompt separates public goals from personal plans and excludes answer and editing record',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({original:'제외원문',editing:'제외교정',review:'confirmed',custom:'제외수동'},id),'');
 const data=filled(),text=w.compose({...data,original:'제외원문',editing:'제외교정',custom:'제외수동'},id);
 for(const key of ['target','evidence','motivation','plans'])assert.ok(text.includes(data[key]));
 for(const term of ['경쟁 우위','단기·중장기','교정·교열','문장 다변화','공개한 목표','미확인','없는 기술·역할·성과 수치'])assert.ok(text.includes(term));
 assert.doesNotMatch(text,/제외|다온테크|업계 최고|두 배/);
});
test('preparation preserves existing draft fields, manual and intentionally empty prompts without inventing content',()=>{
 const draft={target:'이전 초안',evidence:'기존 근거',motivation:'기존 동기',plans:'기존 포부',editing:'기존 교정',original:'원문',custom:''};
 assert.deepEqual(w.clean({[id]:draft})[id],draft);assert.equal(w.output(draft,id),'');
 draft.custom='수동 요청';draft.evidence='바뀐 근거';assert.equal(w.output(draft,id),'수동 요청');assert.equal(draft.original,'원문');
});
test('preparation export and backup retain Unicode, raw response, explicit blank prompt and free notes',()=>{
 const state=empty();state.worksheets[id]={...filled(),evidence:'한글 😀\n</textarea><script>test</script>',original:'받은 원문',custom:''};state.notes[id]='자유 메모';state.done[id]=true;state.last='#course/company/9/write';
 assert.deepEqual(b.parse(b.serialize(state)).data,state);
 const text=w.exportText(id,state.worksheets[id]);assert.ok(text.includes(state.worksheets[id].evidence));assert.match(text,/받은 원문|확인 완료/);assert.doesNotMatch(text,/confirmed/);assert.equal(w.exportText(id,{}),'');
});
test('preparation backup clears incomplete completion and rejects malformed new records',()=>{
 const state=empty();state.worksheets[id]={...filled(),review:''};state.done[id]=true;
 const parsed=b.parse(b.serialize(state));assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.done[id],false);assert.equal(parsed.data.worksheets[id].plans,filled().plans);
 for(const sheet of [{evidence:42},{review:true},{custom:[]},{unknown:'値'}]){state.worksheets[id]=sheet;assert.throws(()=>b.serialize(state));}
});
test('preparation selective restore protects self analysis and inactive essay drafts',()=>{
 const current=empty(),incoming=empty();current.worksheets={'1-8':{experience:'내 경험',original:'자기분석 원문',custom:'수동'},'2-0':{question:'보류 문항',custom:''},[id]:{evidence:'현재 근거'}};current.notes[id]='현재 메모';incoming.worksheets[id]={...filled(),custom:'',original:'복원 원문'};incoming.notes[id]='복원 메모';
 const next=b.merge(current,incoming,{[id]:'incoming'}).next;
 for(const key of ['1-8','2-0'])assert.deepEqual(next.worksheets[key],current.worksheets[key]);
 assert.deepEqual(next.worksheets[id],incoming.worksheets[id]);assert.equal(next.notes[id],'복원 메모');assert.equal(current.worksheets[id].evidence,'현재 근거');
});
test('preparation is the last available company lesson; review alone is not written progress',()=>{
 assert.equal(w.has(id),true);assert.equal(StepFinder.search({readyOnly:true}).length,45);
 assert.equal(COURSES.find(c=>c.id==='company').steps[9].kind,'write');
 for(const available of ['4-0'])assert.equal(StepFinder.availability(available),'ready');
 for(const held of ['0-3','0-4','0-5'])assert.equal(StepFinder.availability(held),'ready');
 const state=empty();state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].plans='private-plan-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-plan-token'},state).length,0);
});
