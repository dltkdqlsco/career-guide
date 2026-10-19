const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function boot(){
 const c=vm.createContext({});c.window=c;
 for(const name of ['career-data','workbook','examples','company-lessons','company-research','company-analysis','company-verification','company-posting','company-role'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/assets/js',name+'.js'),'utf8'),c);
 const ai=JSON.stringify({fields:c.Workbook.promptFields,revision:c.Workbook.revisionFields,examples:c.LessonExamples,external:['0-3','0-4','0-5'].map(id=>c.CareerLessons.lessons[id])});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/assets/js/pdf-content.js'),'utf8'),c);
 return {c,ai};
}
test('PDF first pass covers all 39 non-AI steps and leaves approved AI content unchanged',()=>{
 const {c,ai}=boot();assert.equal(Object.keys(c.PDFContent.lessons).length,39);
 for(const [group,count] of [[1,10],[2,10],[3,10],[4,9]])for(let i=0;i<count;i++){
  const lesson=c.PDFContent.lessons[`${group}-${i}`];assert.ok(lesson.pages);assert.ok(lesson.steps.length>=3);assert.ok(lesson.request.length>40);assert.ok(lesson.result.length>40);
  assert.doesNotMatch(JSON.stringify(lesson),/https?:|出典|출처|URL/);
 }
 assert.equal(JSON.stringify({fields:c.Workbook.promptFields,revision:c.Workbook.revisionFields,examples:c.LessonExamples,external:['0-3','0-4','0-5'].map(id=>c.CareerLessons.lessons[id])}),ai);
});
test('obsolete address/date fields are excluded from research completion while older values survive backup cleaning',()=>{
 const {c}=boot(),data={cards:[{target:'지원 기업과 직무',source:'사업보고서',evidence:'제품·서비스와 연구개발',questions:'다음 조사 질문'}]};
 assert.equal(c.Workbook.validate('1-3',data),'');
 const old={...data.cards[0],location:'previous private document location',dates:'previous date record'};
 const cleaned=c.Workbook.clean({'1-3':{cards:[old]}});
 assert.equal(cleaned['1-3'].cards[0].location,old.location);assert.equal(cleaned['1-3'].cards[0].dates,old.dates);
 const visible=c.PDFContent.visibleFields('1-3',c.Workbook.sourceFields);assert.deepEqual(Array.from(visible,([key])=>key),['target','source','evidence','questions']);
});
test('new prompt instructions omit citation requirements and preserve manually edited or intentionally empty prompts',()=>{
 const {c}=boot();for(const id of ['1-2','1-4','1-7','2-0','2-3','3-8','4-6']){
  const key=id.startsWith('2-')?'question':'target';const data={[key]:'내 입력은 그대로 보존 https://my-record.example'};
  const text=c.Workbook.compose(data,id);assert.ok(text.includes(data[key]));
  assert.doesNotMatch(text.replace(data[key],''),/출처|링크|URL|확인일|발행일/);
  assert.equal(c.Workbook.output({...data,custom:'직접 수정한 글'},id),'직접 수정한 글');assert.equal(c.Workbook.output({...data,custom:''},id),'');
 }
});
test('visible field guidance and comparison drawers no longer ask for provenance metadata',()=>{
 const {c}=boot();for(const id of Object.keys(c.PDFContent.lessons)){
  const fields=id==='1-3'?c.Workbook.sourceFields:id==='1-5'?c.Workbook.verificationFields:c.Workbook.fields(id);
  for(const [key,label,help,example] of c.PDFContent.visibleFields(id,fields))assert.doesNotMatch([label,help,example].join('\n'),/출처|링크|URL|확인일|발행일|확인 내용와|를 와/,id+'/'+key);
 }
 for(const [id,fields] of Object.entries(c.CompanyLessons.fieldHelp))for(const [key,item] of Object.entries(fields))if(!c.PDFContent.hidden(id,key))assert.doesNotMatch(item.good+item.tip,/출처|링크|URL|확인일|발행일/,id+'/'+key);
});

test('all reviewed steps specify an output structure and concrete review criteria',()=>{
 const {c}=boot();for(const [id,lesson] of Object.entries(c.PDFContent.lessons)){
  assert.ok(lesson.output.length>=2,id);assert.ok(lesson.checks.length>=2,id);
  assert.doesNotMatch([...lesson.output,...lesson.checks].join('\n'),/출처|링크|URL|확인일|발행일/);
 }
 const company=c.PDFContent.lessons['1-7'].output.join('\n');assert.match(company,/공고 특징/);assert.match(company,/1~2개/);assert.match(company,/필요 경험 유형/);
 const editing=c.PDFContent.lessons['2-8'];assert.match(editing.output.join('\n'),/피드백 3가지/);assert.match(editing.checks.join('\n'),/새 기술·측정값·경험/);
 const final=c.PDFContent.lessons['2-9'].output;assert.match(final[0],/기업·직무.*지원 동기.*구체적 경험.*구조·논리.*강점/);assert.match(final[1],/문단.*간결.*맞춤법.*가독성.*개성/);
});
test('generated requests carry the actual supplied records and PDF review criteria, excluding output-only records',()=>{
 const {c}=boot();for(const [id,lesson] of Object.entries(c.PDFContent.lessons)){
  if(!c.Workbook.isPrompt(id))continue;
  const data=c.pdfExampleData(id),text=c.Workbook.compose(data,id);assert.ok(text,id);
  for(const criterion of [...lesson.output,...lesson.checks])assert.ok(text.includes(criterion),id+' missing criterion');
  assert.match(text,/실제 문항·제출 조건/);
  const changed={...data,original:'RAW_REPLY_MUST_NOT_BECOME_INPUT',finalText:'FINAL_TEXT_MUST_NOT_BECOME_INPUT',review:'confirmed'};
  assert.doesNotMatch(c.Workbook.compose(changed,id),/RAW_REPLY_MUST_NOT_BECOME_INPUT|FINAL_TEXT_MUST_NOT_BECOME_INPUT/);
 }
});
test('examples use each visible writing field without obsolete metadata or checkbox controls',()=>{
 const {c}=boot();for(const id of Object.keys(c.PDFContent.lessons)){
  const fields=c.pdfExampleFields(id);assert.ok(fields.length,id);
  const keys=Array.from(fields,([key])=>key);assert.equal(new Set(keys).size,keys.length);assert.ok(!keys.includes('review'));
  for(const [key,label,help,example] of fields){assert.ok(label&&help,id+'/'+key);if(key!=='verdict')assert.ok(example,id+'/'+key);assert.ok(!c.PDFContent.hidden(id,key));}
  const sample=c.pdfExampleData(id),values=['1-3','1-5'].includes(id)?sample.cards[0]:sample;
  for(const [key,,,example] of fields)if(!['original','verdict'].includes(key))assert.equal(values[key],example,id+'/'+key);
 }
 assert.equal(c.pdfExampleData('1-5').cards[0].verdict,'corrected');
});
test('submission text samples exclude review notes and do not carry those notes through final-text copying',()=>{
 const {c}=boot();for(const id of ['2-3','2-4','2-5','2-6','2-7','2-8']){
  const field=c.Workbook.fields(id).find(([key])=>key==='draft'||key==='revised');assert.ok(field[3]);assert.doesNotMatch(field[3],/제출 전 확인:|점검 메모는 제출문/);
 }
});
test('provided slide counts and interview execution state take priority over PDF example defaults',()=>{
 const {c}=boot();const slides=c.Workbook.compose({target:'내 제출 조건은 8장',materials:'내 프로젝트 하나'},'3-8');assert.match(slides,/8장/);assert.match(slides,/장수가 정해지지 않았다면 10장/);assert.match(slides,/실제 문항·제출 조건/);
 for(const id of ['4-6','4-7','4-8']){const prompt=c.Workbook.compose({target:'미실행',materials:'내가 준비한 질문',protocol:'연습 계획'},id);assert.match(prompt,/가상 답변·평가를 생성하지 않기|미실행·미수신.*생성 금지|실제 영상이 없으면/);}
 assert.match(c.Workbook.compose({target:'직무 평가',before:'내 답변'},'4-2'),/협업과 내 역할/);
 assert.match(c.Workbook.compose({target:'임원 평가',before:'내 답변'},'4-5'),/판단 기준과 행동/);
});
test('reviewed field instructions avoid the broken sentence fragments left by metadata removal',()=>{
 const {c}=boot();for(const id of Object.keys(c.PDFContent.lessons))for(const [key,,help,example]of c.pdfExampleFields(id))assert.doesNotMatch(help+'\n'+example,/을 과 함께|의 을|는 을|하면 을|다면 을|와 ,|내용가|공고 은|공고 공고|확인 자료 확인/,id+'/'+key);
 const tech=c.Workbook.fields('4-0').find(([key])=>key==='technical')[3];assert.match(tech,/NULL/);assert.match(tech,/멱등성/);
 for(const id of ['4-2','4-5']){const assessment=c.Workbook.fields(id).find(([key])=>key==='assessment')[3];assert.doesNotMatch(assessment,/보완 필요 또는 판단 불가/);assert.match(assessment,/보완 필요\./);}
});
