const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup,id='1-8';
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const filled=()=>({target:'내 기업·직무',requirements:'공고 원문 / 출처 / 확인일',experience:'실제 경험·근거',matches:'연결 근거',gaps:'부족한 경험·다음 행동',review:'confirmed'});
test('self analysis requires five records and explicit review, permits direct work without AI',()=>{
 const data=filled();assert.equal(w.validate(id,data),'');assert.equal(w.validate(id,{...data,custom:''}),'');
 for(const key of ['target','requirements','experience','matches','gaps'])assert.match(w.validate(id,{...data,[key]:' '}),/먼저 작성/);
 for(const review of ['',undefined,'yes','false',true])assert.match(w.validate(id,{...data,review}),/최종 확인/);
});
test('self prompt uses only supplied preparation material, excludes AI output and own conclusions',()=>{
 assert.equal(w.compose({},id),'');assert.equal(w.compose({original:'AI',matches:'결론',gaps:'보완',review:'confirmed'},id),'');
 const text=w.compose({...filled(),original:'제외답변',matches:'제외결론',gaps:'제외보완',custom:'제외수동'},id);
 for(const term of ['내 기업·직무','공고 원문 / 출처 / 확인일','실제 경험·근거','강점','약점','점수나 합격 가능성','미확인'])assert.ok(text.includes(term));
 assert.doesNotMatch(text,/제외|다온테크|Java|합격률 90/);
});
test('self editing preserves explicit empty/manual prompts and original response independently',()=>{
 const data=w.clean({[id]:{...filled(),original:'답변 원문',custom:'수동 요청',unknown:'제외'}})[id];
 data.experience='바꾼 경험';assert.equal(w.output(data,id),'수동 요청');assert.equal(data.original,'답변 원문');assert.equal(data.unknown,undefined);
 data.custom='';assert.equal(w.output(data,id),'');assert.equal(w.validate(id,data),'');
});
test('self export and JSON roundtrip preserve unicode, answers, notes and empty custom',()=>{
 const data=empty();data.worksheets[id]={...filled(),experience:'한글 😀\n</textarea><script>test</script>',original:'원문',custom:''};data.notes[id]='기존 자유 메모';data.done[id]=true;data.last='#course/company/8/write';
 const parsed=b.parse(b.serialize(data));assert.deepEqual(parsed.data,data);assert.deepEqual(parsed.warnings,[]);
 const text=w.exportText(id,data.worksheets[id]);assert.ok(text.includes(data.worksheets[id].experience));assert.match(text,/원문/);assert.match(text,/확인 완료/);assert.doesNotMatch(text,/confirmed/);assert.equal(w.exportText(id,{}),'');
});
test('self backup rejects malformed fields and clears unsupported completion while retaining evidence',()=>{
 for(const sheet of [{target:42},{review:true},{custom:[]},{unknown:'값'}]){const data=empty();data.worksheets[id]=sheet;assert.throws(()=>b.serialize(data));}
 const data=empty();data.worksheets[id]={...filled(),review:''};data.done[id]=true;const parsed=b.parse(b.serialize(data));assert.deepEqual(parsed.warnings,[id]);assert.equal(parsed.data.done[id],false);assert.equal(parsed.data.worksheets[id].experience,'실제 경험·근거');
});
test('self selective restore protects previous job analysis and deferred draft records',()=>{
 const current=empty(),incoming=empty();current.worksheets={'1-7':{original:'이전 원문',custom:'이전 수동 요청'},'1-9':{target:'초안 기록',custom:''},[id]:{experience:'현재 경험'}};current.notes[id]='현재 메모';incoming.worksheets[id]={...filled(),original:'복원 원문',custom:''};incoming.notes[id]='복원 메모';
 const next=b.merge(current,incoming,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets['1-7'],current.worksheets['1-7']);assert.deepEqual(next.worksheets['1-9'],current.worksheets['1-9']);assert.deepEqual(next.worksheets[id],incoming.worksheets[id]);assert.equal(next.notes[id],'복원 메모');assert.equal(current.worksheets[id].experience,'현재 경험');
 assert.deepEqual(w.clean(next.worksheets),next.worksheets);
});
test('self analysis and essay preparation are available; checkmarks do not count as written progress',()=>{
 assert.equal(w.has(id),true);assert.equal(StepFinder.search({readyOnly:true}).length,45);
 for(const available of ['4-0']){assert.equal(w.has(available),true);assert.equal(StepFinder.availability(available),'ready');}
 for(const held of ['0-3','0-4','0-5'])assert.equal(StepFinder.availability(held),'ready');
 const data=empty();data.worksheets[id]={review:'confirmed'};assert.equal(StepFinder.progress(id,data),'not-started');data.worksheets[id].experience='개인자료검색금지';assert.equal(StepFinder.progress(id,data),'in-progress');assert.equal(StepFinder.search({query:'개인자료검색금지'},data).length,0);
});
