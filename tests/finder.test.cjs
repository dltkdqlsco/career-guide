const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={};context.window=context;vm.createContext(context);
for(const file of ['curriculum.js','career-data.js','workbook.js','finder.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/assets/js',file),'utf8'),context,{filename:file});
const finder=context.StepFinder;
const ids=rows=>Array.from(rows,row=>row.step.id);
const empty=()=>({notes:{},worksheets:{},done:{},last:null});

test('unfiltered search preserves all 45 curriculum entries in their original order',()=>{
  const expected=Array.from(context.COURSES).flatMap(course=>Array.from(course.steps,step=>step.id));
  assert.equal(finder.total,45);
  assert.deepEqual(ids(finder.search()),expected);
  assert.equal(new Set(ids(finder.search())).size,45);
});
test('Korean spacing, decomposed Hangul, full-width characters and English case normalize',()=>{
  assert.deepEqual(ids(finder.search({query:'지원동기'})),['2-3']);
  assert.deepEqual(ids(finder.search({query:'  지원   동기  '})),['2-3']);
  assert.deepEqual(ids(finder.search({query:'지원동기'.normalize('NFD')})),['2-3']);
  assert.deepEqual(ids(finder.search({query:'it 포트폴리오'})),ids(finder.search({query:'ＩＴ 포트폴리오'})));
  assert.equal(finder.search({query:'it 포트폴리오'}).length,10);
});
test('multiple words combine guide, section and title while keeping repeated titles distinct',()=>{
  assert.deepEqual(ids(finder.search({query:'면접 임원 질문'})),['4-3']);
  const repeated=finder.search({course:'interview',query:'예상 질문'});
  assert.deepEqual(ids(repeated),['4-0','4-3']);
  assert.notEqual(repeated[0].step.group,repeated[1].step.group);
});
test('progress derives only from real text or explicit completion, not empty forms or checks',()=>{
  const state=empty();
  state.notes['0-0']=' \n ';state.worksheets['0-1']={custom:''};state.worksheets['0-2']={truth:true,role:false,voice:true};
  for(const id of ['0-0','0-1','0-2'])assert.equal(finder.progress(id,state),'not-started');
  state.notes['0-0']='메모';state.worksheets['0-1'].custom='수정한 지침';state.worksheets['0-2'].original='원문';
  for(const id of ['0-0','0-1','0-2'])assert.equal(finder.progress(id,state),'in-progress');
  state.done['0-1']=true;assert.equal(finder.progress('0-1',state),'done');
  state.done['0-2']='true';assert.equal(finder.progress('0-2',state),'in-progress');
});
test('query, course, progress and availability filters intersect without mutating records',()=>{
  const state=empty();state.notes['1-2']='기업 지침';state.worksheets['0-1']={target:'개발자'};
  const before=JSON.stringify(state);
  const rows=finder.search({query:'프롬프트',course:'ai',status:'in-progress',readyOnly:true},state);
  assert.deepEqual(ids(rows),['0-1']);
  assert.equal(rows[0].href,'#course/ai/1/write');
  assert.equal(JSON.stringify(state),before);
  assert.equal(finder.search({course:'company',readyOnly:true},state).length,10);
});
test('resumed external content is available and interview content is ready independently of progress',()=>{
  const state=empty();state.notes['0-3']='보류 항목 메모';state.done['4-0']=true;
  assert.equal(finder.availability('0-3'),'ready');
  assert.equal(finder.availability('4-0'),'ready');
  assert.equal(finder.progress('4-0',state),'done');
  assert.deepEqual(ids(finder.search({readyOnly:true},state)),['0-0','0-1','0-2','0-3','0-4','0-5','1-0','1-1','1-2','1-3','1-4','1-5','1-6','1-7','1-8','1-9','2-0','2-1','2-2','2-3','2-4','2-5','2-6','2-7','2-8','2-9','3-0','3-1','3-2','3-3','3-4','3-5','3-6','3-7','3-8','3-9','4-0','4-1','4-2','4-3','4-4','4-5','4-6','4-7','4-8']);
});
test('company fields and custom-only prompts derive writing progress without entering searchable content',()=>{
  const state=empty();state.worksheets={'1-0':{question:'목차에는없는검색어'},'1-1':{verification:'확인 기준'},'1-2':{custom:'직접 작성한 지침'}};
  assert.deepEqual(ids(finder.search({course:'company',status:'in-progress',readyOnly:true},state)),['1-0','1-1','1-2']);
  assert.equal(finder.search({query:'목차에는없는검색어'},state).length,0);
  state.worksheets['1-2'].custom='';assert.equal(finder.progress('1-2',state),'not-started');
});
test('private notes and prompt contents are never used as search keywords',()=>{
  const state=empty();state.notes['0-0']='private-search-token';state.worksheets['0-1']={custom:'secret-prompt-token'};
  assert.equal(finder.search({query:'private-search-token'},state).length,0);
  assert.equal(finder.search({query:'secret-prompt-token'},state).length,0);
  assert.equal(finder.search({status:'in-progress'},state).length,2);
});
test('search treats punctuation as literal input and bounds or sanitizes invalid filters',()=>{
  for(const query of ['.*','[','<script>alert(1)</script>'])assert.equal(finder.search({query}).length,0);
  const criteria=finder.criteria({query:'x'.repeat(200),course:'unknown',status:'invalid',readyOnly:'true'});
  assert.equal(criteria.query.length,120);assert.equal(criteria.course,'all');assert.equal(criteria.status,'all');assert.equal(criteria.readyOnly,false);
  assert.equal(finder.search({query:42,status:42,course:42}).length,45);
});
test('progress categories partition the whole curriculum',()=>{
  const state=empty();state.notes={'0-0':'메모','4-0':'답변'};state.done={'0-0':true,'1-0':true};
  assert.equal(finder.search({status:'done'},state).length,2);
  assert.equal(finder.search({status:'in-progress'},state).length,1);
  assert.equal(finder.search({status:'not-started'},state).length,42);
});
test('result links preserve original step indices and writing links require unfinished content',()=>{
  const state=empty();state.notes['4-3']='임원 질문 답변';
  for(const row of finder.search({},state)){
    assert.equal(row.course.steps[row.index].id,row.step.id);
    assert.equal(row.href,`#course/${row.course.id}/${row.index}/${row.step.id==='4-3'?'write':'guide'}`);
  }
  state.done['4-3']=true;
  assert.equal(finder.search({course:'interview',query:'임원 질문'},state)[0].href,'#course/interview/3/guide');
});
