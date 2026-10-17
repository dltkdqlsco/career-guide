const {test}=require('node:test');
const assert=require('node:assert/strict');
global.window=global;
require('../dist/assets/js/curriculum.js');require('../dist/assets/js/career-data.js');require('../dist/assets/js/workbook.js');require('../dist/assets/js/backup-core.js');require('../dist/assets/js/finder.js');
const w=Workbook,b=RecordBackup,id=w.verificationId;
const empty=()=>({notes:{},worksheets:{},done:{},last:null});
const card=(verdict='confirmed')=>({...Object.fromEntries(w.verificationFields.filter(([key])=>key!=='verdict').map(([key])=>[key,`내 기록 ${key}\n한글 😀`])),verdict});
test('verification completion requires a real card, reason and decision, with final sentence conditional on acceptance',()=>{
  assert.match(w.validate(id,{}),/한 개 이상/);assert.match(w.validate(id,{cards:[{}]}),/주장 1/);
  for(const verdict of ['confirmed','corrected']){const data=card(verdict);assert.equal(w.validate(id,{cards:[data]}),'');delete data.final;assert.match(w.validate(id,{cards:[data]}),/최종 문장/);}
  for(const verdict of ['unverified','error']){const data=card(verdict);delete data.final;assert.equal(w.validate(id,{cards:[data]}),'');}
  for(const verdict of ['', 'invented'])assert.match(w.validate(id,{cards:[card(verdict)]}),/판단/);
  assert.match(w.validate(id,{cards:[card(),{...card(),reason:''}]}),/주장 2/);
  assert.match(w.validate(id,{cards:Array.from({length:21},()=>card())}),/20개/);
});
test('accepted sentences exclude unknown, excluded and incomplete cards even if a final text remains',()=>{
  const cards=['confirmed','corrected','unverified','error',''].map((status,i)=>({...card(status),final:'문장 '+i}));
  cards.push({...card(),reason:'',final:'불완전한 문장'});
  const text=w.verifiedSentences({cards});assert.match(text,/문장 0/);assert.match(text,/문장 1/);assert.match(text,/사용자 판단/);
  assert.doesNotMatch(text,/문장 2|문장 3|문장 4|불완전한 문장/);
  assert.equal(w.verifiedSentences({cards:[card('unverified')]}),'');
});
test('verification recheck prompt includes actual claims and evidence but never treats final or verdict as source',()=>{
  const data={cards:[{...card(),claim:'실제 주장',source:'원문 A',comparison:'비교 메모',final:'비공개최종문장',reason:'개인판단이유'}]};
  const text=w.compose(data,id);assert.match(text,/실제 주장/);assert.match(text,/원문 A/);assert.match(text,/비교 메모/);assert.match(text,/확인하지 못한 것을 틀렸다고 단정하지/);assert.match(text,/공식 홈페이지·최신 기사/);assert.doesNotMatch(text,/비공개최종문장|개인판단이유|다온테크/);
  assert.equal(w.output({...data,custom:'내 요청'},id),'내 요청');assert.equal(w.output({...data,custom:''},id),'');
});
test('verification cleaning deep-copies strings, limits count and discards invalid verdicts',()=>{
  const raw={[id]:{cards:[card()],custom:''},'1-4':{original:'원문',custom:'지침'}};
  const cleaned=w.clean(raw);assert.deepEqual(cleaned,raw);cleaned[id].cards[0].claim='변경';assert.notEqual(raw[id].cards[0].claim,'변경');
  assert.deepEqual(w.clean({[id]:{cards:[null,[],{claim:42,source:'보존',verdict:'bad',extra:'제외'}],custom:42}}),{[id]:{cards:[{source:'보존'}]}});
  assert.equal(w.clean({[id]:{cards:Array.from({length:21},()=>card())}})[id].cards.length,20);
});
test('empty verification UI is not an exported record, all nonempty verdicts and custom prompts remain exportable',()=>{
  assert.equal(w.exportText(id,{}),'');assert.equal(w.exportText(id,{cards:[{}]}),'');assert.equal(w.exportText(id,{custom:''}),'');
  const data={cards:[card('unverified'),card('error')],custom:'내 수정 요청'};const text=w.exportText(id,data);assert.match(text,/미확인/);assert.match(text,/오류 확인·제외/);assert.match(text,/내 수정 요청/);assert.match(text,/한글 😀/);assert.doesNotMatch(text,/사용자가 원문 대조 후 선택한 문장/);
});
test('verification backups roundtrip and preserve selective restore boundaries',()=>{
  const current=empty(),incoming=empty();current.worksheets={'1-4':{original:'5단계 원문',custom:'지침'},'1-3':{cards:[{source:'4단계 자료'}]},[id]:{cards:[card()],custom:'현재 요청'}};current.notes[id]='이전 메모';
  incoming.worksheets[id]={cards:[card('unverified'),card('error')],custom:'복원 요청'};incoming.notes[id]='복원 메모';incoming.done[id]=true;
  assert.deepEqual(b.parse(b.serialize(incoming)).data,incoming);
  const next=b.merge(current,incoming,{[id]:'incoming'}).next;assert.deepEqual(next.worksheets[id],incoming.worksheets[id]);assert.equal(next.worksheets['1-4'].original,'5단계 원문');assert.equal(next.worksheets['1-3'].cards[0].source,'4단계 자료');assert.equal(current.notes[id],'이전 메모');assert.equal(next.notes[id],'복원 메모');
  next.worksheets[id].cards[0].claim='다른 값';assert.notEqual(incoming.worksheets[id].cards[0].claim,'다른 값');assert.deepEqual(b.parse(b.serialize(empty())).data,empty());
});
test('verification backup rejects malformed arrays, fields, types, statuses, prototypes and more than 20 cards',()=>{
  const sheets=[{cards:null},{cards:{}},{cards:[null]},{cards:[[]]},{cards:[{claim:42}]},{cards:[{verdict:'approved'}]},{cards:[{unknown:'필드'}]},{cards:Array.from({length:21},()=>card())},{custom:42},{unknown:''},JSON.parse('{"cards":[{"__proto__":"bad"}]}')];
  for(const sheet of sheets){const data=empty();data.worksheets[id]=sheet;assert.throws(()=>b.serialize(data));}
  const data=empty();data.worksheets[id]={cards:[{verdict:''}]};assert.doesNotThrow(()=>b.serialize(data));
});
test('incomplete confirmed backup is retained but completion cleared and final text not accepted',()=>{
  const data=empty();data.worksheets[id]={cards:[{verdict:'confirmed',final:'불완전한 최종문장'}]};data.done[id]=true;data.notes[id]='유지';
  const result=b.parse(b.serialize(data));assert.deepEqual(result.warnings,[id]);assert.equal(result.data.done[id],false);assert.equal(result.data.notes[id],'유지');assert.equal(w.verifiedSentences(result.data.worksheets[id]),'');
});
test('verification backup canonicalizes field order but preserves claim order',()=>{
  const a=empty(),z=empty();a.worksheets[id]={cards:[card(),{...card(),claim:'다른 주장'}]};z.worksheets[id]={cards:a.worksheets[id].cards.map(item=>Object.fromEntries(Object.entries(item).reverse()))};
  assert.equal(b.inspect(a,z)[0].status,'same');z.worksheets[id].cards.reverse();assert.equal(b.inspect(a,z)[0].status,'conflict');
});
test('verification progress uses nested user writing without searching private statements',()=>{
  const data=empty();data.worksheets[id]={cards:[{}]};assert.equal(StepFinder.progress(id,data),'not-started');data.worksheets[id].cards[0].reason='목차에없는개인검증문장';assert.equal(StepFinder.progress(id,data),'in-progress');assert.equal(StepFinder.search({query:'목차에없는개인검증문장'},data).length,0);
  data.worksheets[id]={custom:'수동 요청만'};assert.equal(StepFinder.progress(id,data),'in-progress');assert.equal(StepFinder.availability(id),'ready');assert.equal(StepFinder.availability('4-0'),'ready');
});
