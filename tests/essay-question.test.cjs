const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/curriculum.js');require('../dist/career-data.js');require('../dist/workbook.js');require('../dist/backup-core.js');require('../dist/finder.js');
const w=Workbook,b=RecordBackup,id='2-0';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({question:'지원 기업·직무 / 문항 / 700자',posting:'공고 A / 확인일 / 업무·필수·우대',intent:'문항 표현을 근거로 한 해석',evidence:'필요 경험과 추가 확인',review:'confirmed'});
test('question analysis requires four records and final review; AI request and answer are optional',()=>{
 const data=filled();assert.equal(w.validate(id,data),'');assert.equal(w.validate(id,{...data,custom:''}),'');
 for(const key of ['question','posting','intent','evidence'])assert.match(w.validate(id,{...data,[key]:' '}),/먼저 작성/);
 for(const review of ['',undefined,true,'yes'])assert.match(w.validate(id,{...data,review}),/최종 확인/);
});
test('question prompt includes only provided question, posting and optional actual experience',()=>{
 assert.equal(w.compose({},id),'');
 assert.equal(w.compose({original:'제외원문',intent:'제외해석',evidence:'제외판단',custom:'제외수동'},id),'');
 const data={...filled(),experience:'내 실제 경험자료'},text=w.compose({...data,original:'제외원문',intent:'제외해석',evidence:'제외판단',custom:'제외수동'},id);
 for(const key of ['question','posting','experience'])assert.ok(text.includes(data[key]));
 for(const term of ['공개된 평가 기준','추정한 의도','적용 한계','제공된 실제 경험','최신 동향','미확인','없는 기술·역할·성과 수치'])assert.ok(text.includes(term));
 assert.doesNotMatch(text,/제외|다온테크|50점/);
});
test('question analysis preserves existing draft fields, manual and intentionally empty prompts without inventing content',()=>{
 const draft={question:'이전 초안',posting:'기존 공고',intent:'기존 해석',evidence:'기존 근거',original:'원문',custom:''};
 assert.deepEqual(w.clean({[id]:draft})[id],draft);assert.equal(w.output(draft,id),'');
 draft.custom='수동 요청';draft.evidence='바뀐 근거';assert.equal(w.output(draft,id),'수동 요청');assert.equal(draft.original,'원문');
});
test('question analysis export and backup retain Unicode, raw response, explicit blank prompt and free notes',()=>{
 const state=empty();state.worksheets[id]={...filled(),evidence:'한글 😀\n</textarea><script>test</script>',original:'받은 원문',custom:''};state.notes[id]='자유 메모';state.done[id]=true;state.last='#course/essay/0/write';
 assert.deepEqual(b.parse(b.serialize(state)).data,state);
 const text=w.exportText(id,state.worksheets[id]);assert.ok(text.includes(state.worksheets[id].evidence));assert.match(text,/받은 원문|확인 완료/);assert.doesNotMatch(text,/confirmed/);assert.equal(w.exportText(id,{}),'');
});
test('question analysis backup clears incomplete completion and rejects malformed new records',()=>{
 const state=empty();state.worksheets[id]={...filled(),review:''};state.done[id]=true;
 const parsed=b.parse(b.serialize(state));assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.done[id],false);assert.equal(parsed.data.worksheets[id].evidence,filled().evidence);
 for(const sheet of [{evidence:42},{review:true},{custom:[]},{unknown:'値'}]){state.worksheets[id]=sheet;assert.throws(()=>b.serialize(state));}
});
test('question analysis selective restore protects self analysis and inactive essay drafts',()=>{
 const current=empty(),incoming=empty();current.worksheets={'1-8':{experience:'내 경험',original:'자기분석 원문',custom:'수동'},'2-1':{question:'보류 문항',custom:''},[id]:{evidence:'현재 근거'}};current.notes[id]='현재 메모';incoming.worksheets[id]={...filled(),custom:'',original:'복원 원문'};incoming.notes[id]='복원 메모';
 const next=b.merge(current,incoming,{[id]:'incoming'}).next;
 for(const key of ['1-8','2-1'])assert.deepEqual(next.worksheets[key],current.worksheets[key]);
 assert.deepEqual(next.worksheets[id],incoming.worksheets[id]);assert.equal(next.notes[id],'복원 메모');assert.equal(current.worksheets[id].evidence,'현재 근거');
});
test('all ten essay lessons are active; review is not searchable personal progress',()=>{
 assert.equal(w.has(id),true);assert.equal(StepFinder.search({readyOnly:true}).length,45);
 assert.equal(COURSES.find(c=>c.id==='essay').steps[0].kind,'write');
 for(const available of ['4-0'])assert.equal(StepFinder.availability(available),'ready');
 for(const held of ['0-3','0-4','0-5'])assert.equal(StepFinder.availability(held),'ready');
 const state=empty();state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].intent='private-intent-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-intent-token'},state).length,0);
});
