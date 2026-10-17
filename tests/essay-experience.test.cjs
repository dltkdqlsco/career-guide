const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup,id='2-1';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({question:'문항·공고 근거',candidates:'실제 후보와 증거',selected:'대표 경험·선택 이유',keywords:'행동 근거·직무 연결',review:'confirmed'});
test('experience selection requires four records and review but no AI usage',()=>{
 const data=filled();assert.equal(w.validate(id,{...data,custom:''}),'');
 for(const key of ['question','candidates','selected','keywords'])assert.match(w.validate(id,{...data,[key]:' '}),/먼저 작성/);
 for(const review of ['',undefined,true])assert.match(w.validate(id,{...data,review}),/최종 확인/);
});
test('experience request supports initial comparison and selected-experience follow-up without including AI answers',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({original:'제외원문',keywords:'제외결론',custom:'제외수동'},id),'');
 const data=filled(),initial=w.compose({question:data.question,candidates:data.candidates},id),followup=w.compose({...data,original:'제외원문',keywords:'제외결론',custom:'제외수동'},id);
 assert.ok(initial.includes(data.candidates));assert.ok(!initial.includes(data.selected));assert.ok(followup.includes(data.selected));
 for(const term of ['하나뿐','선택 보류','측정 조건·단위·기간','팀 성과와 내 기여','미래 계획','합격 가능성'])assert.ok(followup.includes(term));
 assert.doesNotMatch(followup,/제외|다온테크|80%/);
});
test('legacy experience drafts and intentionally empty/manual prompts survive cleaning and exports',()=>{
 const data={...filled(),original:'AI 원문',custom:''};assert.deepEqual(w.clean({[id]:data})[id],data);assert.equal(w.output(data,id),'');
 data.custom='직접 요청';data.candidates='한글 😀\n</textarea><script>test</script>';assert.equal(w.output(data,id),'직접 요청');
 const state=empty();state.worksheets[id]=data;state.notes[id]='기존 메모';state.done[id]=true;state.last='#course/essay/1/write';assert.deepEqual(b.parse(b.serialize(state)).data,state);
 const text=w.exportText(id,data);for(const value of [data.candidates,data.original,data.custom])assert.ok(text.includes(value));assert.match(text,/확인 완료/);
});
test('experience restore affects only selected lesson and invalid completion is cleared',()=>{
 const current=empty(),incoming=empty();current.worksheets={'2-0':{question:'문항 원문'},'2-2':{star:'보류 초안'},[id]:{candidates:'현재 후보'}};incoming.worksheets[id]={...filled(),review:''};incoming.done[id]=true;
 const parsed=b.parse(b.serialize(incoming));assert.equal(parsed.data.done[id],false);assert.deepEqual(parsed.warnings,[id]);
 const next=b.merge(current,parsed.data,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets[id],parsed.data.worksheets[id]);for(const key of ['2-0','2-2'])assert.deepEqual(next.worksheets[key],current.worksheets[key]);assert.equal(current.worksheets[id].candidates,'현재 후보');
 for(const sheet of [{candidates:42},{review:true},{custom:[]},{unknown:'x'}]){incoming.worksheets[id]=sheet;assert.throws(()=>b.serialize(incoming));}
});
test('experience selection remains available alongside techniques while later essay lessons remain pending',()=>{
 assert.equal(w.has(id),true);assert.equal(COURSES.find(c=>c.id==='essay').steps[1].kind,'write');assert.equal(StepFinder.availability(id),'ready');assert.equal(StepFinder.search({readyOnly:true}).length,45);assert.equal(w.has('4-0'),true);
 const state=empty();state.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,state),'not-started');state.worksheets[id].candidates='private-candidate-token';assert.equal(StepFinder.progress(id,state),'in-progress');assert.equal(StepFinder.search({query:'private-candidate-token'},state).length,0);
});
