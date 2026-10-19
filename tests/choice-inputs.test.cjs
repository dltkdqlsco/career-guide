const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function boot(){
 const context={window:{},esc:value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};
 vm.createContext(context);
 for(const name of ['career-data','workbook','choice-inputs'])vm.runInContext(fs.readFileSync(`${__dirname}/../dist/assets/js/${name}.js`,'utf8'),context);
 return context.window;
}
test('choice fields preserve old prose exactly, including text resembling an incomplete envelope',()=>{
 const {ChoiceInputs:c}=boot(),def=c.config('1-2','experience');
 for(const value of ['기존 전공 / Python·React 경험\n내 역할과 근거', '[선택 정보]\n전공 분야: ["기존 기록"]\n[상세 내용]\n원문','[선택 정보]\n기술 스택:\n[상세 내용]\n본문','']){
  const decoded=c.decode(value,def);assert.equal(decoded.detail,value);assert.equal(c.encode(decoded,def),value);
 }
});
test('known and custom selections roundtrip with detailed Korean prose in the same backup fields',()=>{
 const {ChoiceInputs:c,Workbook:w}=boot(),def=c.config('1-2','experience');
 const values={major:['융합·의생명공학'],language:['Python'],stack:['React','기술 / 쉼표, 대괄호 [A]']},detail='내가 직접 한 일\n\n[상세 내용]\n추가 근거';
 const encoded=c.encode({values,detail},def),decoded=c.decode(encoded,def);
 assert.deepEqual(JSON.parse(JSON.stringify(decoded)),{values,detail});
 assert.equal(w.clean({'1-2':{experience:encoded}})['1-2'].experience,encoded);
 assert.match(w.exportText('1-2',{experience:encoded}),/기술 스택:\n- React/);
 assert.equal(c.encode({values:{},detail},def),detail);
});
test('selectable categories cover requested facts without changing AI or long-form answers',()=>{
 const {ChoiceInputs:c}=boot();
 assert.deepEqual(Array.from(c.config('1-2','experience').items,item=>item.name),['major','language','stack']);
 assert.deepEqual(Array.from(c.config('1-0','target').items,item=>item.name),['industry','job','level']);
 assert(c.config('3-2','inventory').items.find(item=>item.name==='stack').multiple);
 for(const key of ['target','experience','format'])assert.equal(c.config('0-1',key),null);
 for(const [id,key] of [['2-4','actions'],['2-8','revised'],['3-3','finalText'],['4-1','finalText']])assert.equal(c.config(id,key),null);
});
test('rendered controls escape imported text and keep the existing record value unchanged',()=>{
 const {ChoiceInputs:c}=boot(),value='<img src=x onerror=alert(1)>',html=c.render('3-2',['inventory','기술 목록','도움','예시'],1,true,value,'');
 assert(html.includes('data-field="inventory" hidden'));
 assert(html.includes('data-choice-detail="inventory"'));
 assert(html.includes('기술 스택 · 여러 개 선택'));
 assert(html.includes('직접 입력'));assert(!html.includes('<img'));assert(html.includes('&lt;img'));
});
