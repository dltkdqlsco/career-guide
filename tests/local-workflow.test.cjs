const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const dist=path.join(__dirname,'../dist');
const scripts=[...fs.readFileSync(path.join(dist,'index.html'),'utf8').matchAll(/<script src="([^"]+)" defer><\/script>/g)].map(match=>match[1]);

// A minimal document adapter for executing render/event logic. This is not a
// browser or visual-layout test. Child tokens and write counters check panel
// reuse; HTML parsing, layout, native scroll and focus behavior are not simulated.
function boot(saved){
  const nodes=new Map();
  const persisted=new Map(saved?[['one-step-career-workbook-v1',JSON.stringify(saved)]]:[]);
  const events={};
  const documentEvents={};
  const scrolls=[];
  const historyWrites=[];
  const historyPushes=[];
  let storageWrites=0;
  const node=selector=>{
    if(/^#tab-(guide|example|write)$/.test(selector))selector=`[data-tab=${selector.slice(5)}]`;
    if(selector==='.step-item[aria-current="step"]')return [...nodes.values()].find(item=>item.isStep&&item.attributes['aria-current']==='step')||null;
    if(!nodes.has(selector))nodes.set(selector,{
      childNodes:[],htmlWrites:0,replacements:0,_textContent:'',_value:'',textWrites:0,valueWrites:0,checked:false,tabIndex:0,dataset:{},attributes:{},
      open:false,scrollTop:0,focusCount:0,scrolls:[],
      get textContent(){return this._textContent;},
      set textContent(value){this.textWrites++;this._textContent=value;},
      get value(){return this._value;},
      set value(value){this.valueWrites++;this._value=value;},
      get innerHTML(){return this.childNodes.map(child=>child.markup||'').join('');},
      set innerHTML(html){this.htmlWrites++;this.childNodes=html?[{markup:html}]:[];},
      replaceChildren(...children){this.replacements++;this.childNodes=[...children];},
      appendChild(child){this.childNodes.push(child);return child;},
      style:{},firstElementChild:{style:{}},classList:{values:new Set(),add(key){this.values.add(key);},remove(key){this.values.delete(key);},toggle(key,force){if(force)this.add(key);else this.remove(key);},contains(key){return this.values.has(key);}},
      addEventListener(name,handler){this['on'+name]=handler;},
      setAttribute(key,value){this.attributes[key]=String(value);},
      getAttribute(key){return this.attributes[key]??null;},
      removeAttribute(key){delete this.attributes[key];},hasAttribute(key){return key in this.attributes;},
      focus(options){this.focused=true;this.focusCount++;this.focusOptions=options;},select(){this.selected=true;},click(){},
      setSelectionRange(start,end,direction){this.selectionStart=start;this.selectionEnd=end;this.selectionDirection=direction;},
      scrollIntoView(options){this.scrolls.push(options);},
      getBoundingClientRect(){return {height:1000};},
      contains(other){return other.inMain===true;},
      insertAdjacentHTML(where,html){this.innerHTML=where==='afterbegin'?html+this.innerHTML:this.innerHTML+html;},
      querySelector(child){return node(selector+' '+child);},
      querySelectorAll(child){return child==='textarea'?this.childNodes.filter(item=>item.tagName==='TEXTAREA'):[];}
    });
    return nodes.get(selector);
  };
  const group=(key,values)=>values.map(value=>{const item=node(`[data-${key}=${value}]`);item.dataset[key]=value;return item;});
  const doc={
    scrollingElement:{scrollHeight:4000},
    querySelector:node,
    addEventListener:(name,fn)=>documentEvents[name]=fn,
    querySelectorAll(selector){
      if(selector==='[data-tab]')return group('tab',['guide','example','write']);
      if(selector==='[data-nav]')return group('nav',['home','ai','company','essay','portfolio','interview','find','notes']);
      if(selector==='.step-item')return [...node('#main').innerHTML.matchAll(/class="step-item[^"\n]*"[^>]*href="([^"]+)"/g)].map(([,href])=>{const item=node(`step:${href}`);item.isStep=true;return item;});
      if(selector==='[data-source-field]')return [...node('#source-cards').innerHTML.matchAll(/data-source-card="(\d+)" data-source-field="([^"]+)"/g)].map(([,index,key])=>{const input=node(`#source-${index}-${key}`);input.dataset.sourceCard=index;input.dataset.sourceField=key;return input;});
      if(selector==='[data-remove-source]')return [...node('#source-cards').innerHTML.matchAll(/data-remove-source="(\d+)"/g)].map(([,index])=>{const button=node(`remove-source:${index}`);button.dataset.removeSource=index;return button;});
      if(selector==='[data-verification-field]')return [...node('#verification-cards').innerHTML.matchAll(/data-verification-card="(\d+)" data-verification-field="([^"]+)"/g)].map(([,index,key])=>{const input=node(`#verification-${index}-${key}`);input.dataset.verificationCard=index;input.dataset.verificationField=key;return input;});
      if(selector==='[data-remove-verification]')return [...node('#verification-cards').innerHTML.matchAll(/data-remove-verification="(\d+)"/g)].map(([,index])=>{const button=node(`remove-verification:${index}`);button.dataset.removeVerification=index;return button;});
      if(selector==='[data-career-check]')return group('careerCheck',[...node('#tab-content').innerHTML.matchAll(/data-career-check="([^"]+)"/g)].map(([,key])=>key));
      if(selector==='[data-review]')return group('review',['truth','role','voice']);
      if(selector==='[data-field]')return group('field',[...node('#tab-content').innerHTML.matchAll(/data-field="([^"]+)"/g)].map(([,key])=>key));
      if(selector==='[data-restore-id]')return [...node('#restore-preview').innerHTML.matchAll(/data-restore-id="([^"]+)" value="([^"]+)"/g)].map(([,id,value])=>{const item=node(`restore-radio:${id}:${value}`);item.dataset.restoreId=id;item.value=value;return item;});
      return [];
    },
    createElement:node
  };
  let copied='';
  const downloads=[];
  const context={document:doc,location:{hash:'#home'},TextEncoder,Blob,
    URL:{createObjectURL:blob=>{downloads.push(blob);return 'blob:local-test';},revokeObjectURL(){}},
    localStorage:{getItem:key=>persisted.get(key)||null,setItem:(key,value)=>{storageWrites++;persisted.set(key,value);}},
    navigator:{clipboard:{writeText:async text=>{copied=text;}}},
    scrollX:0,scrollY:0,innerHeight:800,
    setTimeout:()=>1,clearTimeout(){},scrollTo:(...args)=>{scrolls.push(args);context.scrollX=typeof args[0]==='object'?args[0].left:args[0];context.scrollY=typeof args[0]==='object'?args[0].top:args[1];},
    history:{replaceState:(state,title,hash)=>{historyWrites.push(hash);context.location.hash=hash;},pushState:(state,title,hash)=>{historyPushes.push(hash);context.location.hash=hash;}},
    addEventListener:(name,fn)=>events[name]=fn,confirm:()=>false
  };
  context.window=context;
  vm.createContext(context);
  for(const script of scripts)vm.runInContext(fs.readFileSync(path.join(dist,script),'utf8'),context,{filename:script});
  return {context,node,persisted,downloads,scrolls,historyWrites,historyPushes,storageWrites:()=>storageWrites,copied:()=>copied,
    run:code=>vm.runInContext(code,context),
    route(hash){context.location.hash=hash;events.hashchange();},
    clickLink(href,options={}){
      const link=node(`link:${href}`);link.setAttribute('href',href);link.target=options.target||'';
      if(options.download)link.setAttribute('download','');else link.removeAttribute('download');
      const event={button:0,defaultPrevented:false,...options,target:{closest:()=>link},preventDefault(){this.defaultPrevented=true;}};
      documentEvents.click(event);return event;
    },
    clickSummary(summary,options={}){
      const event={button:0,defaultPrevented:false,...options,target:{closest:selector=>selector==='summary'?summary:null},preventDefault(){this.defaultPrevented=true;}};
      documentEvents.click(event);return event;
    },
    saved:()=>JSON.parse(persisted.get('one-step-career-workbook-v1'))
  };
}

test('home and both writing screens explain the local, manual AI workflow',()=>{
  const app=boot();
  assert.match(app.node('#main').innerHTML,/AI API 미연결/);
  for(const hash of ['#course/ai/1/write','#course/ai/2/write']){
    app.route(hash);
    const html=app.node('#tab-content').innerHTML;
    assert.match(html,/자동 생성·자동 전송 없음/);
    assert.match(html,/외부 AI에 직접 붙여넣기/);
    assert.match(html,/복사는 전송이 아니며/);
    assert.equal(app.node('[data-tab=write]').attributes['aria-selected'],'true');
  }
});

test('direct links reach the proper writing tab and unknown tabs fall back safely',()=>{
  const app=boot();
  app.route('#course/ai/1/write');
  assert.match(app.node('#tab-content').innerHTML,/#course\/ai\/2\/write/);
  app.route('#course/ai/2/write');
  assert.match(app.node('#tab-content').innerHTML,/data-field="original"/);
  app.route('#course/ai/1/unknown');
  assert.equal(app.run('selectedTab'),'guide');
  app.route('#course/unknown/100/write');
  assert.match(app.node('#main').innerHTML,/취업 준비, 한 걸음씩/);
});

test('the saved prompt is read-only, escaped and never inserted into the AI draft',async()=>{
  const custom='내 지침 </textarea><script>alert(1)</script> & 한글';
  const app=boot({notes:{'0-2':'예전 메모'},done:{},worksheets:{'0-1':{target:'개발자',custom},'0-2':{original:'외부에서 받은 원문',revised:'직접 고친 문장'}},last:null});
  app.route('#course/ai/2/write');
  const html=app.run('renderSavedPromptReference()');
  assert.match(html,/readonly/);
  assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(html,/<script>/);
  assert.equal(app.saved().worksheets['0-2'].original,'외부에서 받은 원문');
  assert.equal(app.saved().notes['0-2'],'예전 메모');
  await app.node('#copy-saved-prompt').onclick();
  assert.equal(app.copied(),custom);
});

test('no existing prompt offers a preparation link without inventing text',()=>{
  const app=boot();
  assert.match(app.run('renderSavedPromptReference()'),/아직 만든 프롬프트가 없나요/);
  assert.doesNotMatch(app.run('renderSavedPromptReference()'),/id="saved-prompt"/);
  app.run("state.worksheets['0-1']={target:'작성한 정보',custom:''}");
  assert.match(app.run('renderSavedPromptReference()'),/아직 만든 프롬프트가 없나요/);
});

test('editing a revision resets self-review and completion but preserves other notes and drafts',()=>{
  const app=boot({notes:{'0-2':'기존 메모'},done:{'0-2':true,'0-1':true},worksheets:{'0-1':{custom:'보존할 지침'},'0-2':{original:'원문',issues:'고칠 점',facts:'내 사실',revised:'기존 수정본',truth:true,role:true,voice:true}}});
  app.route('#course/ai/2/write');
  app.run("saveWorksheet('0-2','revised','새 수정본')");
  const saved=app.saved();
  assert.equal(saved.worksheets['0-2'].revised,'새 수정본');
  for(const key of ['truth','role','voice']){
    assert.equal(saved.worksheets['0-2'][key],false);
    assert.equal(app.node(`[data-review=${key}]`).checked,false);
  }
  assert.equal(saved.done['0-2'],false);
  assert.equal(saved.done['0-1'],true);
  assert.equal(saved.worksheets['0-1'].custom,'보존할 지침');
  assert.equal(saved.notes['0-2'],'기존 메모');
  app.run("saveWorksheet('0-2','truth',true); saveWorksheet('0-2','role',true)");
  assert.equal(app.saved().worksheets['0-2'].truth,true);
  assert.equal(app.saved().worksheets['0-2'].role,true);
});

test('all 45 steps including resumed external lessons render across three tabs',()=>{
  const app=boot();
  const courses=app.context.COURSES;
  assert.equal(courses.flatMap(c=>c.steps).length,45);
  for(const course of courses){
    for(let i=0;i<course.steps.length;i++){
      for(const tab of ['guide','example','write']){
        assert.doesNotThrow(()=>app.route(`#course/${course.id}/${i}/${tab}`));
        assert.ok(app.node('#tab-content').innerHTML.trim());
        assert.doesNotMatch(app.node('#tab-content').innerHTML,/PDF [0-9]|캡처 원문|원문 기준|원문 강조|원문에 소개|보완 내용|원문 확인 ↗/);
      }
    }
  }
  for(const index of [3,4,5]){
    app.route(`#course/ai/${index}`);
    assert.match(app.node('#lesson-host').innerHTML,/학습 · 작성 가능/);
  }
});

test('worksheets and legacy notes remain available in combined Markdown export',()=>{
  const app=boot({notes:{'0-1':'예전 메모'},done:{},worksheets:{'0-1':{target:'백엔드',custom:'직접 수정한 지침'}}});
  app.route('#notes');
  const record=app.run('recordText(courses[0].steps[1])');
  assert.match(record,/백엔드/);
  assert.match(record,/직접 수정한 지침/);
  assert.match(record,/예전 메모/);
});

test('static assets contain no model/network calls, microphone capture or remote asset loads',()=>{
  for(const file of scripts){
    const text=fs.readFileSync(path.join(dist,file),'utf8');
    assert.doesNotMatch(text,/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|getUserMedia)\s*\(/,file);
  }
  const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
  assert.doesNotMatch(html,/(?:src|href)=["']https?:/);
  const css=fs.readFileSync(path.join(dist,'style.css'),'utf8');
  assert.doesNotMatch(css,/@import|url\(\s*["']?https?:/);
});

const storageKey='one-step-career-workbook-v1';
const recoveryKey=storageKey+'-before-import';
const blankState=()=>({notes:{},done:{},worksheets:{},last:null});
function fileFor(app,data,name='my-backup.json'){
  const text=app.context.RecordBackup.serialize(data);
  return {name,size:Buffer.byteLength(text),text:async()=>text};
}
test('resume remembers the exact explanation, example or writing tab',()=>{
  const app=boot();
  app.route('#course/ai/1/write');
  assert.equal(app.saved().last,'#course/ai/1/write');
  app.route('#home');assert.equal(app.run('validLast()'),'#course/ai/1/write');
  app.route('#course/ai/1');
  app.node('[data-tab=example]').onclick();
  assert.equal(app.saved().last,'#course/ai/1/example');
  assert.equal(boot(app.saved()).run('validLast()'),'#course/ai/1/example');
});
test('backup route and export preserve all data and do not send or change state',async()=>{
  const data=blankState();data.notes['0-0']='내 기록';data.worksheets['0-1']={custom:''};data.last='#course/ai/1/write';
  const app=boot(data);const before=app.run('JSON.stringify(state)');
  app.route('#backup');
  assert.match(app.node('#main').innerHTML,/백업 파일 불러오기/);
  assert.equal(app.node('#backup-link').attributes['aria-current'],'page');
  app.node('#export-backup').onclick();
  assert.equal(app.downloads.length,1);
  const content=JSON.parse(await app.downloads[0].text());
  assert.deepEqual(content.data,data);
  assert.equal(app.run('JSON.stringify(state)'),before);
});
test('preview and cancel leave both memory and stored record untouched',async()=>{
  const current=blankState(),incoming=blankState();
  current.notes['0-0']='현재';incoming.notes['0-0']='이전';incoming.notes['1-0']='추가';
  const app=boot(current);app.route('#backup');
  const before=app.persisted.get(storageKey);
  await app.context.readBackupFile(fileFor(app,incoming));
  assert.match(app.node('#restore-preview').innerHTML,/현재 기록 유지/);
  assert.match(app.node('#restore-preview').innerHTML,/value="current" checked/);
  assert.equal(app.persisted.get(storageKey),before);
  app.node('#cancel-restore').onclick();
  assert.equal(app.run('pendingBackup'),null);
  assert.equal(app.persisted.get(storageKey),before);
  assert.equal(app.run('state.notes["0-0"]'),'현재');
});
test('safe apply adds only new records, keeps conflicts and saves a recovery snapshot',async()=>{
  const current=blankState(),incoming=blankState();
  current.notes['0-0']='현재';incoming.notes['0-0']='이전';incoming.notes['1-0']='새 기록';
  const app=boot(current);app.route('#backup');
  await app.context.readBackupFile(fileFor(app,incoming));
  app.node('#apply-restore').onclick();
  assert.equal(app.saved().notes['0-0'],'현재');assert.equal(app.saved().notes['1-0'],'새 기록');
  assert.deepEqual(JSON.parse(app.persisted.get(recoveryKey)).data,current);
  assert.equal(app.run('pendingBackup'),null);
  assert.match(app.node('#backup-file-status').textContent,/1개 단계/);
  app.node('#export-recovery').onclick();
  assert.deepEqual(JSON.parse(await app.downloads[0].text()).data,current);
});
test('conflict replacement requires selection and confirmation; declining does nothing',async()=>{
  const current=blankState(),incoming=blankState();current.notes['0-0']='현재';incoming.notes['0-0']='교체본';
  const app=boot(current);app.route('#backup');await app.context.readBackupFile(fileFor(app,incoming));
  const radio=app.node('restore-radio:0-0:incoming');radio.onchange({target:radio});
  assert.equal(app.node('#apply-restore').disabled,false);
  app.node('#apply-restore').onclick();
  assert.equal(app.saved().notes['0-0'],'현재');assert.equal(app.persisted.has(recoveryKey),false);
  app.context.confirm=()=>true;
  app.node('#apply-restore').onclick();
  assert.equal(app.saved().notes['0-0'],'교체본');
  assert.equal(JSON.parse(app.persisted.get(recoveryKey)).data.notes['0-0'],'현재');
});
test('storage failure at either recovery or primary commit never changes the live record',async()=>{
  for(const failureKey of [recoveryKey,storageKey]){
    const current=blankState(),incoming=blankState();current.notes['0-0']='현재';incoming.notes['1-0']='추가';
    const app=boot(current);app.route('#backup');await app.context.readBackupFile(fileFor(app,incoming));
    const before=app.run('JSON.stringify(state)');
    const setter=app.context.localStorage.setItem;
    app.context.localStorage.setItem=(key,value)=>{if(key===failureKey){const error=new Error('full');error.name='QuotaExceededError';throw error;}setter(key,value);};
    app.node('#apply-restore').onclick();
    assert.equal(app.run('JSON.stringify(state)'),before);
    assert.deepEqual(app.saved(),current);
    assert.match(app.node('#restore-result').textContent,/저장 공간이 부족/);
    assert.match(app.node('#restore-result').textContent,/적용되지 않았습니다/);
  }
});
test('another tab changing storage before preview is detected',async()=>{
  const current=blankState(),incoming=blankState();incoming.notes['1-0']='추가';
  const app=boot(current);app.route('#backup');
  const newer=blankState();newer.notes['0-0']='다른 탭의 최신 글';app.persisted.set(storageKey,JSON.stringify(newer));
  await app.context.readBackupFile(fileFor(app,incoming));
  assert.equal(app.run('pendingBackup'),null);
  assert.match(app.node('#backup-file-status').textContent,/다른 탭/);
  assert.deepEqual(app.saved(),newer);
});
test('changes during preview or during confirmation prevent stale overwrite',async()=>{
  for(const timing of ['preview','confirmation']){
    const current=blankState(),incoming=blankState();current.notes['0-0']='현재';incoming.notes['0-0']='이전';
    const app=boot(current);app.route('#backup');await app.context.readBackupFile(fileFor(app,incoming));
    const radio=app.node('restore-radio:0-0:incoming');radio.onchange({target:radio});
    const newer=blankState();newer.notes['0-0']='다른 탭에서 수정';
    if(timing==='preview')app.persisted.set(storageKey,JSON.stringify(newer));
    else app.context.confirm=()=>{app.persisted.set(storageKey,JSON.stringify(newer));return true;};
    app.node('#apply-restore').onclick();
    assert.deepEqual(app.saved(),newer);assert.equal(app.persisted.has(recoveryKey),false);
    assert.equal(app.run('state.notes["0-0"]'),'현재');
    assert.match(app.node('#restore-result').textContent,/적용되지 않았습니다/);
  }
});
test('invalid, oversized and failed file reads have no state side effects',async()=>{
  const app=boot(blankState());app.route('#backup');
  const before=app.run('JSON.stringify(state)');
  const files=[{name:'bad.json',size:1,text:async()=>'bad'},{name:'big.json',size:20*1024*1024,text:()=>{throw Error('should not read');}},{name:'broken.json',size:1,text:async()=>{throw Error('파일 읽기 실패');}}];
  for(const file of files){
    await app.context.readBackupFile(file);
    assert.equal(app.run('pendingBackup'),null);
    assert.equal(app.run('JSON.stringify(state)'),before);
    assert.match(app.node('#backup-file-status').textContent,/현재 기록은 변경하지 않았습니다/);
  }
});
test('leaving backup or choosing another file ignores an older asynchronous read',async()=>{
  const app=boot(blankState());app.route('#backup');
  const first=blankState();first.notes['0-0']='옛 파일';
  let resolve;
  const slow={name:'slow.json',size:10,text:()=>new Promise(done=>{resolve=done;})};
  const reading=app.context.readBackupFile(slow);
  const second=blankState();second.notes['1-0']='새 파일';
  await app.context.readBackupFile(fileFor(app,second,'new.json'));
  resolve(app.context.RecordBackup.serialize(first));await reading;
  assert.equal(app.run('pendingBackup.name'),'new.json');
  const readingAgain=app.context.readBackupFile(slow);
  app.route('#home');resolve(app.context.RecordBackup.serialize(first));await readingAgain;
  assert.equal(app.run('pendingBackup'),null);
});
test('preview escapes filenames and note contents from untrusted files',async()=>{
  const data=blankState();data.notes['0-0']='<img src=x onerror=alert(1)>';
  const app=boot(blankState());app.route('#backup');
  await app.context.readBackupFile(fileFor(app,data,'<script>alert(1)</script>.json'));
  const html=app.node('#restore-preview').innerHTML;
  assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;img/);
  assert.doesNotMatch(html,/<script>|<img/);
});
test('last-tab location restoration and empty backups are explicit and safe',async()=>{
  const app=boot(blankState());app.route('#backup');
  await app.context.readBackupFile(fileFor(app,blankState()));
  app.context.updateRestoreButton();assert.equal(app.node('#apply-restore').disabled,true);
  const incoming=blankState();incoming.last='#course/ai/2/write';
  await app.context.readBackupFile(fileFor(app,incoming));
  assert.equal(app.run('pendingBackup.useLast'),true);
  app.context.applyRestore();
  assert.equal(app.saved().last,'#course/ai/2/write');
  assert.match(app.node('#restore-preview').innerHTML,/#course\/ai\/2\/write/);
});

test('finder is reachable from home and navigation and shows all original steps',()=>{
  const app=boot();
  assert.match(app.node('#main').innerHTML,/id="home-finder-form"/);
  assert.match(app.node('#nav').innerHTML,/href="#find"/);
  app.route('#find');
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 45개');
  assert.equal((app.node('#finder-results').innerHTML.match(/class="finder-result"/g)||[]).length,45);
  assert.doesNotMatch(app.node('#finder-results').innerHTML,/진행 보류/);
  assert.match(app.node('#main').innerHTML,/aria-live="polite"/);
  assert.equal(app.context.document.title,'단계 찾기 — 한 걸음 · 취업 준비 워크북');
});
test('home search carries the query and resets old filters, without submitting during IME',()=>{
  const app=boot();
  app.run("finderFilters=StepFinder.criteria({course:'interview',status:'done',readyOnly:true})");
  const input=app.node('#home-finder-query');input.value='지원동기';
  input.oncompositionstart();
  app.node('#home-finder-form').onsubmit({preventDefault(){}});
  assert.equal(app.context.location.hash,'#home');
  input.oncompositionend();app.node('#home-finder-form').onsubmit({preventDefault(){}});
  assert.equal(app.context.location.hash,'#find');app.route('#find');
  assert.equal(app.run('finderFilters.course'),'all');
  assert.equal(app.run('finderFilters.status'),'all');
  assert.equal(app.run('finderFilters.readyOnly'),false);
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 1개');
  assert.match(app.node('#finder-results').innerHTML,/#course\/essay\/3\/guide/);
});
test('typing updates only results so the active input and toolbar are not replaced',()=>{
  const app=boot();app.route('#find');
  const input=app.node('#finder-query'),page=app.node('#main').innerHTML;
  input.value='지원동기';input.oninput({isComposing:false});
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 1개');
  assert.equal(app.node('#main').innerHTML,page);
  assert.equal(app.node('#finder-query'),input);
  input.value='없는목차123';input.oninput({});
  assert.match(app.node('#finder-results').innerHTML,/검색 조건에 맞는 단계가 없어요/);
});
test('Korean composition defers search until committed, and Escape clears the query',()=>{
  const app=boot();app.route('#find');const input=app.node('#finder-query');
  input.oncompositionstart();input.value='프롬프트';input.oninput({isComposing:true});
  app.node('#finder-form').onsubmit({preventDefault(){}});
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 45개');
  input.oncompositionend();
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 2개');
  input.onkeydown({key:'Escape',preventDefault(){}});
  assert.equal(input.value,'');assert.equal(app.node('#finder-count').textContent,'전체 45개 중 45개');
});
test('course, progress and ready-only UI filters work together',()=>{
  const data=blankState();data.notes['0-1']='작성중';data.notes['1-2']='기업 지침';
  const app=boot(data);app.route('#find');
  app.node('#finder-status').onchange({target:{value:'in-progress'}});
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 2개');
  app.node('#finder-ready').onchange({target:{checked:true}});
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 2개');
  assert.match(app.node('#finder-results').innerHTML,/#course\/ai\/1\/write/);
  app.node('#finder-course').onchange({target:{value:'company'}});
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 1개');
});
test('reset clears every criterion and returns keyboard focus to search',()=>{
  const app=boot();app.route('#find');
  app.run("finderFilters=StepFinder.criteria({query:'임원',course:'interview',status:'done',readyOnly:true})");
  app.node('#finder-reset').onclick();
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 45개');
  assert.equal(app.node('#finder-query').focused,true);
  assert.equal(app.node('#finder-course').value,'all');
  assert.equal(app.node('#finder-status').value,'all');
  assert.equal(app.node('#finder-ready').checked,false);
});
test('filters survive in-page navigation and results reflect newly edited progress',()=>{
  const app=boot();app.route('#find');
  app.node('#finder-status').onchange({target:{value:'in-progress'}});
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 0개');
  app.route('#course/ai/1/write');app.run("saveWorksheet('0-1','target','개발자')");
  app.route('#find');
  assert.equal(app.run('finderFilters.status'),'in-progress');
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 1개');
  assert.match(app.node('#finder-results').innerHTML,/이어서 작성/);
});
test('search never changes saved notes, completion, resume location or backup schema',()=>{
  const data=blankState();data.notes['0-0']='비공개 메모';data.last='#course/ai/1/write';
  const app=boot(data),before=app.persisted.get(storageKey),live=app.run('JSON.stringify(state)');
  app.route('#find');app.node('#finder-query').value='프롬프트';app.node('#finder-query').oninput({});
  app.node('#finder-ready').onchange({target:{checked:true}});
  assert.equal(app.persisted.get(storageKey),before);
  assert.equal(app.run('JSON.stringify(state)'),live);
  assert.doesNotMatch(app.context.RecordBackup.serialize(JSON.parse(live)),/finderFilters|readyOnly/);
  const next=boot(app.saved());assert.equal(next.run('finderFilters.query'),'');
});
test('query strings are escaped on rerender and are never treated as HTML or regular expressions',()=>{
  const app=boot();app.route('#find');
  app.node('#finder-query').value='"/><img src=x onerror=alert(1)>';
  app.node('#finder-query').oninput({});app.route('#home');
  assert.match(app.node('#main').innerHTML,/&lt;img/);
  assert.doesNotMatch(app.node('#main').innerHTML,/<img/);
  app.route('#find');assert.equal(app.node('#finder-count').textContent,'전체 45개 중 0개');
  assert.doesNotMatch(app.node('#main').innerHTML,/<img/);
});
test('native search clear and empty Enter searches restore all results without extra routes',()=>{
  const app=boot();app.route('#find');const input=app.node('#finder-query');
  input.value='프롬프트';input.oninput({});
  input.value='';input.onsearch();
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 45개');
  app.node('#finder-form').onsubmit({preventDefault(){}});
  assert.equal(app.context.location.hash,'#find');
  assert.equal(app.node('#finder-count').textContent,'전체 45개 중 45개');
});

function renderCounts(app){
  return ['#nav','#main','#lesson-host','#tab-content'].map(selector=>{
    const item=app.node(selector);return [item.htmlWrites,item.replacements];
  });
}

test('completion updates only progress, preserving the lesson and open content',()=>{
  for(const [course,id,total] of [['ai','0-0',6],['company','1-0',10]]){
    const data=blankState();data.notes[id]='보존할 메모';
    if(course==='company')data.worksheets[id]={target:'기업과 직무',question:'분석 질문',sources:'확보한 자료',facts:'사실과 미확인 내용'};
    const app=boot(data);app.route(`#course/${course}/0/write`);
    const panel=app.node('#tab-content'),details={open:true};panel.appendChild(details);
    const before=renderCounts(app),scrolls=app.scrolls.length,focus=app.node('#main').focusCount;
    const checkbox=app.node('#complete');
    for(const checked of [true,false]){
      checkbox.checked=checked;checkbox.onchange({target:checkbox});
      assert.equal(app.saved().done[id],checked);
      assert.equal(app.saved().notes[id],'보존할 메모');
      assert.equal(app.node('[role="progressbar"]').attributes['aria-valuenow'],String(checked?Math.round(100/total):0));
      assert.equal(app.node('.step-item[aria-current="step"]').classList.contains('done'),checked);
      assert.deepEqual(renderCounts(app),before);
      assert.equal(panel.childNodes.includes(details),true);assert.equal(details.open,true);
    }
    assert.equal(app.scrolls.length,scrolls);assert.equal(app.node('#main').focusCount,focus);
  }
});

test('clicking the active tab is a no-op with no writes, replacement or focus jump',()=>{
  const app=boot();app.route('#course/ai/1/write');
  const before=renderCounts(app),writes=app.storageWrites(),history=app.historyWrites.length;
  const button=app.node('#tab-write'),focus=button.focusCount,scrolls=app.scrolls.length;
  for(let i=0;i<5;i++)button.onclick();
  assert.deepEqual(renderCounts(app),before);assert.equal(app.storageWrites(),writes);
  assert.equal(app.historyWrites.length,history);assert.equal(button.focusCount,focus);assert.equal(app.scrolls.length,scrolls);
});

test('tab roundtrips reuse nodes, handlers, open examples, textarea selection and internal scroll',()=>{
  const app=boot();app.route('#course/ai/1/write');
  const panel=app.node('#tab-content'),input=app.node('#prompt-output');
  input.tagName='TEXTAREA';input.value='직접 고친 지침';input.oninput({target:input});
  input.setSelectionRange(2,5,'forward');input.scrollTop=120;input.scrollLeft=7;
  const details={open:true},handler=input.oninput;
  panel.appendChild(input);panel.appendChild(details);
  app.node('#tab-example').onclick();
  assert.equal(panel.childNodes.includes(input),false);
  const example={open:true};panel.appendChild(example);
  const writes=panel.htmlWrites;
  // Disconnection may reset native scroll/selection; the saved values win.
  input.scrollTop=0;input.scrollLeft=0;input.setSelectionRange(0,0,'none');
  app.node('#tab-write').onclick();
  assert.equal(panel.htmlWrites,writes);assert.ok(panel.childNodes.includes(input));
  assert.ok(panel.childNodes.includes(details));assert.equal(details.open,true);
  assert.equal(input.value,'직접 고친 지침');assert.equal(input.oninput,handler);
  assert.equal(input.selectionStart,2);assert.equal(input.selectionEnd,5);assert.equal(input.selectionDirection,'forward');
  assert.equal(input.scrollTop,120);assert.equal(input.scrollLeft,7);
  input.value='다시 수정한 지침';input.oninput({target:input});
  assert.equal(app.saved().worksheets['0-1'].custom,'다시 수정한 지침');
  app.node('#tab-example').onclick();
  assert.equal(panel.htmlWrites,writes);assert.ok(panel.childNodes.includes(example));assert.equal(example.open,true);
});

test('repeated route events do not replace or refocus the current page',()=>{
  const app=boot();
  for(const hash of ['#home','#find','#notes','#backup','#course/ai/1/write']){
    app.route(hash);const before=renderCounts(app),writes=app.storageWrites();
    const focus=app.node('#main').focusCount,scrolls=app.scrolls.length;
    app.route(hash);app.route(hash);
    assert.deepEqual(renderCounts(app),before);assert.equal(app.storageWrites(),writes);
    assert.equal(app.node('#main').focusCount,focus);assert.equal(app.scrolls.length,scrolls);
  }
});

test('same-step route changes only the tab and synchronizes its URL without adding history',()=>{
  const app=boot();app.route('#course/ai/1/guide');
  const main=app.node('#main').htmlWrites,lesson=app.node('#lesson-host').htmlWrites,scrolls=app.scrolls.length;
  app.route('#course/ai/1/example');
  assert.equal(app.run('selectedTab'),'example');
  assert.equal(app.node('#main').htmlWrites,main);assert.equal(app.node('#lesson-host').htmlWrites,lesson);
  assert.equal(app.scrolls.length,scrolls);assert.equal(app.node('#tab-example').focusOptions.preventScroll,true);
  app.node('#tab-write').onclick();
  assert.equal(app.context.location.hash,'#course/ai/1/write');assert.equal(app.saved().last,'#course/ai/1/write');
  assert.equal(app.historyWrites.at(-1),'#course/ai/1/write');
  const writes=app.node('#tab-content').htmlWrites;
  app.route('#course/ai/1/example');app.route('#course/ai/1/write');
  assert.equal(app.node('#tab-content').htmlWrites,writes);
});

test('changing steps reuses the course shell and expanded TOC without scrolling to the new lesson',()=>{
  const app=boot();app.route('#course/ai/0');
  app.node('.steps-panel').open=true;
  const main=app.node('#main').htmlWrites,lesson=app.node('#lesson-host').htmlWrites,scrolls=app.scrolls.length;
  app.route('#course/ai/1/write');
  assert.equal(app.node('#main').htmlWrites,main);assert.equal(app.node('#lesson-host').htmlWrites,lesson+1);
  assert.equal(app.node('.steps-panel').open,true);assert.equal(app.node('#mobile-step').value,'1');
  assert.equal(app.node('step:#course/ai/0').attributes['aria-current'],undefined);
  assert.equal(app.node('step:#course/ai/1').attributes['aria-current'],'step');
  assert.match(app.node('.steps-panel summary .tiny').textContent,/2번째 단계/);
  assert.equal(app.scrolls.length,scrolls);assert.equal(app.node('#lesson-host').scrolls.length,0);
  assert.equal(app.node('#lesson-host').focusOptions.preventScroll,true);
  app.node('#prev').onclick();assert.equal(app.context.location.hash,'#course/ai/0/guide');
  app.node('#mobile-step').onchange({target:{value:'2'}});assert.equal(app.context.location.hash,'#course/ai/2/guide');
});

test('top navigation remains mounted across major pages while active accessibility state updates',()=>{
  const app=boot(),nav=app.node('#nav');nav.scrollLeft=210;
  const writes=nav.htmlWrites;
  for(const [hash,key] of [['#course/ai/1','ai'],['#course/company/0','company'],['#find','find'],['#notes','notes'],['#home','home']]){
    app.route(hash);
    assert.equal(nav.htmlWrites,writes);assert.equal(nav.scrollLeft,210);
    for(const link of app.context.document.querySelectorAll('[data-nav]')){
      assert.equal(link.classList.contains('active'),link.dataset.nav===key);
      assert.equal(link.attributes['aria-current'],link.dataset.nav===key?'page':undefined);
    }
  }
  app.route('#backup');assert.equal(nav.htmlWrites,writes);assert.equal(app.node('#backup-link').attributes['aria-current'],'page');
});

test('invalid completion opens the cached writing panel without replacing the course',()=>{
  const app=boot();app.route('#course/ai/1/write');
  const marker={open:true};app.node('#tab-content').appendChild(marker);
  app.node('#tab-example').onclick();const before=renderCounts(app);
  const checkbox=app.node('#complete');checkbox.checked=true;checkbox.onchange({target:checkbox});
  assert.equal(checkbox.checked,false);assert.notEqual(app.saved().done['0-1'],true);
  assert.equal(app.run('selectedTab'),'write');assert.ok(app.node('#tab-content').childNodes.includes(marker));
  assert.deepEqual(renderCounts(app).slice(0,3),before.slice(0,3));
  assert.equal(app.node('#tab-content').htmlWrites,before[3][0]);
  assert.match(app.node('#toast').textContent,/먼저 작성/);
});

test('valid completion and later edits keep cached tabs intact and invalidate progress correctly',()=>{
  const data=blankState();data.worksheets['0-1']={target:'직무',background:'배경',task:'요청',evidence:'자료',format:'형식',rules:'규칙',custom:'직접 작성한 지침'};
  const app=boot(data);app.route('#course/ai/1/write');app.node('#tab-example').onclick();
  const before=renderCounts(app),checkbox=app.node('#complete');checkbox.checked=true;checkbox.onchange({target:checkbox});
  assert.equal(app.saved().done['0-1'],true);assert.deepEqual(renderCounts(app),before);
  app.node('#tab-write').onclick();app.run("saveWorksheet('0-1','target','새 직무')");
  assert.equal(app.saved().done['0-1'],false);assert.equal(checkbox.checked,false);
  assert.equal(app.saved().worksheets['0-1'].custom,'직접 작성한 지침');
  assert.equal(app.node('.step-item[aria-current="step"]').classList.contains('done'),false);
});

test('panel cache is scoped to one step and cleared when leaving a course',()=>{
  const app=boot();app.route('#course/ai/0/write');
  const old={open:true};app.node('#tab-content').appendChild(old);app.node('#tab-example').onclick();
  assert.ok(app.run('tabPanels.size')>0);
  app.route('#course/ai/1/write');assert.equal(app.run('tabPanels.size'),0);
  assert.equal(app.node('#tab-content').childNodes.includes(old),false);
  app.node('#tab-guide').onclick();app.route('#notes');assert.equal(app.run('tabPanels.size'),0);
  app.run("state.notes['0-0']='새로 보관한 메모'");app.route('#course/ai/0/write');
  assert.match(app.node('#tab-content').innerHTML,/새로 보관한 메모/);
  assert.equal(app.node('#tab-content').childNodes.includes(old),false);
});

test('same backup navigation preserves an active preview and an in-flight file read',async()=>{
  const app=boot(blankState());app.route('#backup');
  const incoming=blankState();incoming.notes['0-0']='가져올 메모';
  let resolve;
  const reading=app.context.readBackupFile({name:'slow.json',size:10,text:()=>new Promise(done=>{resolve=done;})});
  const token=app.run('backupReadToken'),writes=app.node('#main').htmlWrites;
  app.route('#backup');assert.equal(app.clickLink('#backup').defaultPrevented,true);
  resolve(app.context.RecordBackup.serialize(incoming));await reading;
  assert.equal(app.run('pendingBackup.name'),'slow.json');
  const preview=app.run('pendingBackup');app.route('#backup');
  assert.equal(app.run('pendingBackup'),preview);assert.equal(app.run('backupReadToken'),token);
  assert.equal(app.node('#main').htmlWrites,writes);
});

test('restored records are rendered fresh after returning to a previously cached writing panel',async()=>{
  const current=blankState();current.notes['0-0']='이전 글';
  const app=boot(current);app.route('#course/ai/0/write');app.node('#tab-example').onclick();
  app.route('#backup');const incoming=blankState();incoming.notes['0-0']='복원된 최신 글';
  await app.context.readBackupFile(fileFor(app,incoming));
  const radio=app.node('restore-radio:0-0:incoming');radio.onchange({target:radio});
  app.context.confirm=()=>true;app.context.applyRestore();app.route('#course/ai/0/write');
  assert.match(app.node('#tab-content').innerHTML,/복원된 최신 글/);
  assert.doesNotMatch(app.node('#tab-content').innerHTML,/이전 글/);
});

test('same-page links are no-ops, same-step tab links switch locally, and modified/external links are left alone',()=>{
  const app=boot();app.route('#course/ai/1/write');const before=renderCounts(app);
  for(const hash of ['#course/ai/1','#course/ai/1/write'])assert.equal(app.clickLink(hash).defaultPrevented,true);
  assert.deepEqual(renderCounts(app),before);assert.equal(app.run('selectedTab'),'write');
  assert.equal(app.clickLink('#course/ai/1/example').defaultPrevented,true);assert.equal(app.run('selectedTab'),'example');
  for(const options of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{target:'_blank'},{download:true},{defaultPrevented:true}]){
    const event=app.clickLink('#course/ai/1/example',options);
    assert.equal(event.defaultPrevented,Boolean(options.defaultPrevented));
  }
  for(const href of ['https://www.notion.so/','#unknown-anchor'])assert.equal(app.clickLink(href).defaultPrevented,false);
  for(const href of ['#course/company/0','#course/ai/2'])assert.equal(app.clickLink(href).defaultPrevented,true);
});

test('skip-to-content never reroutes the current screen or clears its state',()=>{
  const app=boot();app.route('#course/ai/1/write');const before=renderCounts(app),hash=app.context.location.hash;
  const event=app.clickLink('#main');assert.equal(event.defaultPrevented,true);
  assert.equal(app.context.location.hash,hash);assert.deepEqual(renderCounts(app),before);
  assert.equal(app.node('#main').focusOptions.preventScroll,true);assert.equal(app.node('#main').scrolls.length,1);
  app.route('#main');assert.deepEqual(renderCounts(app),before);assert.equal(app.run('currentStep.id'),'0-1');
});

test('keyboard tab navigation wraps correctly without course rendering or automatic focus scrolling',()=>{
  const app=boot();app.route('#course/ai/0/guide');const before=renderCounts(app).slice(0,3),scrolls=app.scrolls.length;
  let prevented=0;
  app.node('#tab-guide').onkeydown({key:'ArrowLeft',preventDefault(){prevented++;}});
  assert.equal(app.run('selectedTab'),'write');assert.equal(app.node('#tab-write').focusOptions.preventScroll,true);
  app.node('#tab-write').onkeydown({key:'ArrowRight',preventDefault(){prevented++;}});
  assert.equal(app.run('selectedTab'),'guide');assert.equal(app.node('#tab-guide').tabIndex,0);
  assert.equal(app.node('#tab-write').tabIndex,-1);assert.equal(prevented,2);
  assert.deepEqual(renderCounts(app).slice(0,3),before);assert.equal(app.scrolls.length,scrolls);
});

test('tab switching and same-step links still work if local-file history updates are unavailable',()=>{
  const app=boot();app.route('#course/ai/1/guide');
  app.context.history.replaceState=()=>{throw new Error('History unavailable');};
  assert.doesNotThrow(()=>app.node('#tab-write').onclick());
  assert.equal(app.run('selectedTab'),'write');assert.equal(app.saved().last,'#course/ai/1/write');
  assert.equal(app.context.location.hash,'#course/ai/1/guide');
  app.clickLink('#course/ai/1/guide');assert.equal(app.run('selectedTab'),'guide');
});

test('Korean composition saves input immediately but refreshes the dependent preview only after commit',()=>{
  const app=boot();app.route('#course/ai/1/write');
  const input=app.node('[data-field=target]'),output=app.node('#prompt-output');
  const before=renderCounts(app),previewWrites=output.valueWrites,scrolls=app.scrolls.length;
  input.oncompositionstart();
  for(const text of ['ㅎ','하','한']){
    input.value=text;input.setSelectionRange(text.length,text.length,'none');
    const inputWrites=input.valueWrites;
    input.oninput({target:input,isComposing:true});
    assert.equal(app.saved().worksheets['0-1'].target,text);
    assert.equal(output.valueWrites,previewWrites);
    assert.equal(input.valueWrites,inputWrites);assert.equal(input.selectionStart,text.length);
  }
  input.oncompositionend();
  assert.match(output.value,/한/);assert.equal(output.valueWrites,previewWrites+1);
  assert.deepEqual(renderCounts(app),before);assert.equal(app.scrolls.length,scrolls);
  assert.equal(input.focusCount,0);
});

test('duplicate committed input events do not resave records or rewrite unchanged status labels',()=>{
  const app=boot();app.route('#course/ai/1/write');const input=app.node('[data-field=target]');
  input.value='백엔드';input.oninput({target:input});
  const selectors=['#save-status','#worksheet-status','#filled-count','#custom-status','#output-count'];
  const counts=selectors.map(selector=>app.node(selector).textWrites),writes=app.storageWrites(),preview=app.node('#prompt-output').valueWrites;
  input.oncompositionend();input.oninput({target:input,isComposing:false});
  assert.deepEqual(selectors.map(selector=>app.node(selector).textWrites),counts);
  assert.equal(app.storageWrites(),writes);assert.equal(app.node('#prompt-output').valueWrites,preview);
});

test('missing compositionend can be completed on blur without losing the final text',()=>{
  const app=boot();app.route('#course/ai/1/write');const input=app.node('[data-field=background]');
  input.value='프로젝';input.oninput({target:input,isComposing:true});
  assert.doesNotMatch(app.node('#prompt-output').value,/프로젝/);
  input.value='프로젝트 경험';input.onblur();
  assert.equal(app.saved().worksheets['0-1'].background,'프로젝트 경험');
  assert.match(app.node('#prompt-output').value,/프로젝트 경험/);
  input.value='프로젝트 경험 추가';input.oninput({target:input});
  assert.match(app.node('#prompt-output').value,/경험 추가/);
});

test('editing source fields never reassigns a manually edited final draft or its selection and scroll',()=>{
  const data=blankState();data.worksheets['0-1']={target:'개발',custom:'사용자가 직접 고친 지침'};
  const app=boot(data);app.route('#course/ai/1/write');
  const output=app.node('#prompt-output'),input=app.node('[data-field=target]');
  output.setSelectionRange(2,6,'forward');output.scrollTop=90;output.scrollLeft=3;
  const writes=output.valueWrites,count=app.node('#custom-status').textWrites;
  for(const value of ['개발자','신입 개발자']){input.value=value;input.oninput({target:input});}
  assert.equal(output.valueWrites,writes);assert.equal(output.value,'사용자가 직접 고친 지침');
  assert.equal(output.selectionStart,2);assert.equal(output.selectionEnd,6);assert.equal(output.selectionDirection,'forward');
  assert.equal(output.scrollTop,90);assert.equal(output.scrollLeft,3);
  assert.equal(app.node('#custom-status').textWrites,count);
});

test('automatic draft refresh preserves its scroll without assigning to the active field',()=>{
  const app=boot();app.route('#course/ai/1/write');
  const output=app.node('#prompt-output'),input=app.node('[data-field=evidence]');
  output.scrollTop=110;output.scrollLeft=4;input.value='직접 한 행동\n확인 가능한 결과';
  const writes=input.valueWrites,before=renderCounts(app);
  input.oninput({target:input});
  assert.match(output.value,/직접 한 행동/);assert.equal(output.scrollTop,110);assert.equal(output.scrollLeft,4);
  assert.equal(input.valueWrites,writes);assert.deepEqual(renderCounts(app),before);
});

test('manual draft typing keeps the editor in place and changing help text is placed below it',()=>{
  const app=boot();app.route('#course/ai/1/write');const output=app.node('#prompt-output');
  const html=app.node('#tab-content').innerHTML;
  const textareaEnd=html.indexOf('</textarea>',html.indexOf('id="prompt-output"'));
  assert.ok(textareaEnd<html.indexOf('id="custom-status"'));
  assert.match(html,/id="prompt-output" aria-describedby="custom-status"/);
  output.value='내 지침을 직접 수정';output.setSelectionRange(2,2,'none');output.scrollTop=60;
  const writes=output.valueWrites,before=renderCounts(app);
  output.oninput({target:output,isComposing:true});
  assert.equal(output.valueWrites,writes);assert.equal(output.selectionStart,2);assert.equal(output.scrollTop,60);
  assert.equal(app.saved().worksheets['0-1'].custom,'내 지침을 직접 수정');assert.deepEqual(renderCounts(app),before);
});

test('re-entering the same revision value does not clear already confirmed reviews or progress',()=>{
  const data=blankState();data.worksheets['0-2']={original:'원문',issues:'고칠 점',facts:'사실',revised:'내 문장',truth:true,role:true,voice:true};data.done['0-2']=true;
  const app=boot(data);app.route('#course/ai/2/write');const input=app.node('[data-field=revised]');
  const writes=app.storageWrites();input.value='내 문장';input.oninput({target:input});
  assert.equal(app.saved().done['0-2'],true);assert.equal(app.storageWrites(),writes);
  for(const key of ['truth','role','voice'])assert.equal(app.saved().worksheets['0-2'][key],true);
  input.value='새로 쓴 문장';input.oninput({target:input});
  assert.equal(app.saved().done['0-2'],false);
  for(const key of ['truth','role','voice'])assert.equal(app.saved().worksheets['0-2'][key],false);
});

test('free-note typing across all courses preserves the course/TOC DOM and updates only text counters',()=>{
  const app=boot();
  for(const course of app.context.COURSES){
    const index=course.id==='company'?9:0;
    app.route(`#course/${course.id}/${index}/write`);const structured=app.run('Boolean(CareerLessons.lessons[currentStep.id])');const input=app.node(structured?'#previous-note':'#note');
    const before=renderCounts(app),scrolls=app.scrolls.length;
    input.value='나의 경험 <문장>\n'+('긴주소나내용'.repeat(1500));const inputWrites=input.valueWrites;
    input.oninput({target:input});
    const statusWrites=app.node('#note-state').textWrites;
    input.oninput({target:input});
    assert.deepEqual(renderCounts(app),before);assert.equal(app.scrolls.length,scrolls);assert.equal(input.valueWrites,inputWrites);
    assert.equal(app.node('#note-state').textWrites,statusWrites);
    assert.equal(app.saved().notes[course.steps[index].id],input.value);
    if(!structured)assert.equal(app.node('#char-count').textContent,input.value.length+'자');
  }
});

test('a failed save is retried for unchanged input rather than being mistaken for an already saved value',()=>{
  const app=boot();app.route('#course/ai/1/write');const input=app.node('[data-field=target]');
  const setter=app.context.localStorage.setItem;let fail=true;
  app.context.localStorage.setItem=(key,value)=>{if(fail)throw new Error('storage full');setter(key,value);};
  input.value='잃으면 안 되는 작성 내용';input.oninput({target:input});
  assert.equal(app.run('storageOK'),false);assert.match(app.node('#worksheet-status').textContent,/저장되지 않음/);
  fail=false;input.oninput({target:input});
  assert.equal(app.run('storageOK'),true);assert.equal(app.saved().worksheets['0-1'].target,input.value);
  assert.equal(app.node('#worksheet-status').textContent,'이 브라우저에 저장됨');
});

test('internal navigation links change the view without native hash jumps or top/bottom scrolling',()=>{
  const app=boot();app.context.scrollY=1400;
  for(const href of ['#course/ai/1/write','#course/ai/2','#course/company/0','#find','#notes','#backup','#home']){
    const pushes=app.historyPushes.length;
    assert.equal(app.clickLink(href).defaultPrevented,true);
    assert.equal(app.context.scrollY,1400);assert.equal(app.historyPushes.length,pushes+1);
    assert.equal(app.node('#main').scrolls.length,0);assert.equal(app.node('#lesson-host').scrolls.length,0);
  }
  assert.equal(app.scrolls.length,0,'navigation must not issue a top/bottom scroll command');
});

test('tab button restores the exact pre-click position even if node exchange moves the viewport',()=>{
  const app=boot();app.route('#course/ai/1/guide');app.context.scrollY=1900;
  const panel=app.node('#tab-content'),replace=panel.replaceChildren;
  panel.replaceChildren=function(...children){replace.apply(this,children);app.context.scrollY=0;};
  app.node('#tab-example').onclick();
  assert.equal(app.context.scrollY,1900);assert.equal(app.scrolls.at(-1)[0].top,1900);
  assert.equal(app.scrolls.at(-1)[0].behavior,'instant');
  assert.equal(app.node('#tab-example').focusOptions.preventScroll,true);
  app.node('#tab-write').onclick();assert.equal(app.context.scrollY,1900);
});

test('previous-step button and step selector keep the current viewport with no hashchange roundtrip',()=>{
  const app=boot();app.route('#course/ai/2/write');app.context.scrollY=1700;
  app.node('#prev').onclick();assert.equal(app.run('currentStep.id'),'0-1');assert.equal(app.context.scrollY,1700);
  app.node('#mobile-step').onchange({target:{value:'4'}});
  assert.equal(app.run('currentStep.id'),'0-4');assert.equal(app.context.scrollY,1700);
  assert.equal(app.node('#lesson-host').scrolls.length,0);
});

test('opening and closing TOC/examples keeps the viewport and leaves modified clicks native',()=>{
  const app=boot();app.route('#course/ai/1/example');app.context.scrollY=1600;
  let open=false;
  const details={tagName:'DETAILS',get open(){return open;},set open(value){open=value;app.context.scrollY=value?2800:0;}};
  const summary=app.node('summary-test');summary.inMain=true;summary.parentElement=details;
  for(const expected of [true,false,true]){
    assert.equal(app.clickSummary(summary).defaultPrevented,true);assert.equal(details.open,expected);
    assert.equal(app.context.scrollY,1600);assert.equal(summary.focusOptions.preventScroll,true);
  }
  assert.equal(app.clickSummary(summary,{ctrlKey:true}).defaultPrevented,false);
  summary.inMain=false;assert.equal(app.clickSummary(summary).defaultPrevented,false);
});

test('history API failure restores the position captured before native hash navigation',()=>{
  const app=boot();app.route('#course/ai/1/write');app.context.scrollY=1450;
  app.context.history.pushState=()=>{throw new Error('History unavailable');};
  app.clickLink('#course/company/0');
  assert.equal(app.run('pendingNavigationPosition.y'),1450);
  app.context.scrollY=0;app.route('#course/company/0');
  assert.equal(app.run('currentStep.id'),'1-0');assert.equal(app.context.scrollY,1450);
  assert.equal(app.run('pendingNavigationPosition'),null);
});

test('copy fallback selects the text without moving the viewport to its textarea',async()=>{
  const app=boot();app.route('#course/ai/0/write');const note=app.node('#note');
  note.value='복사할 메모';app.context.scrollY=1800;
  app.context.navigator.clipboard.writeText=async()=>{throw new Error('Clipboard denied');};
  note.select=()=>{note.selected=true;app.context.scrollY=0;};
  await app.node('#copy-note').onclick();
  assert.equal(app.context.scrollY,1800);assert.equal(note.selected,true);assert.equal(note.focusOptions.preventScroll,true);
});

test('finder filter/reset actions preserve the viewport and request no focus scrolling',()=>{
  const app=boot();app.route('#find');app.context.scrollY=1550;
  app.node('#finder-ready').onchange({target:{checked:true}});assert.equal(app.context.scrollY,1550);
  app.node('#finder-reset').onclick();assert.equal(app.context.scrollY,1550);
  assert.equal(app.node('#finder-query').focusOptions.preventScroll,true);
});

test('canceling or applying a backup stays at the current viewport instead of jumping to the new page bottom',async()=>{
  const app=boot(blankState());app.route('#backup');const incoming=blankState();incoming.notes['0-0']='추가할 메모';
  await app.context.readBackupFile(fileFor(app,incoming));app.context.scrollY=1650;
  app.node('#cancel-restore').onclick();assert.equal(app.context.scrollY,1650);
  await app.context.readBackupFile(fileFor(app,incoming));app.context.scrollY=1750;
  app.node('#apply-restore').onclick();assert.equal(app.context.scrollY,1750);
  assert.equal(app.saved().notes['0-0'],'추가할 메모');
});

test('company first three lessons provide original guidance and examples without filling user data',()=>{
  const data=blankState();data.notes['1-0']='예전 메모 </textarea><script>bad()</script>';
  const app=boot(data);
  for(let index=0;index<3;index++){
    const id=`1-${index}`;
    for(const tab of ['guide','example','write']){
      app.route(`#course/company/${index}/${tab}`);
      const html=app.node('#tab-content').innerHTML;
      assert.doesNotMatch(app.node('#lesson-host').innerHTML,/캡처|PDF|보완 가이드/);
      assert.doesNotMatch(html,/이 단계의 핵심 설명이 들어갑니다/);
      if(tab==='example'){
        assert.equal((html.match(/class="example-case"/g)||[]).length,index===1?3:2);
        assert.match(html,/학습용 가상/);
      }
      if(tab==='write'){
        assert.equal((html.match(/data-field="/g)||[]).length,index===2?6:4);
        assert.equal((html.match(/class="field-example"/g)||[]).length,index===2?6:4);
        assert.doesNotMatch(html,/<script>/);
        for(const value of Object.values(app.saved().worksheets[id]||{}))assert.equal(value,'');
      }
    }
  }
  assert.equal(app.saved().notes['1-0'],data.notes['1-0']);
  app.route('#course/ai/3/guide');assert.match(app.node('#lesson-host').innerHTML,/학습 · 작성 가능/);
});

test('company planning forms save real input, defer IME preview and invalidate completion without rerendering',async()=>{
  const app=boot();
  for(let index=0;index<2;index++){
    const id=`1-${index}`;app.route(`#course/company/${index}/write`);app.context.scrollY=1200;
    const before=renderCounts(app),fields=app.context.Workbook.fields(id),output=app.node('#company-record');
    const first=app.node(`[data-field=${fields[0][0]}]`),writes=output.valueWrites;
    first.oncompositionstart();first.value='작성';first.oninput({target:first,isComposing:true});
    assert.equal(app.saved().worksheets[id][fields[0][0]],'작성');assert.equal(output.valueWrites,writes);
    first.oncompositionend();assert.match(output.value,/작성/);
    for(const [key] of fields){const input=app.node(`[data-field=${key}]`);input.value=`내가 적은 ${key}`;input.oninput({target:input});}
    assert.equal(app.node('#filled-count').textContent,'4 / 4개 항목 작성');
    await app.node('#copy-company-record').onclick();assert.equal(app.copied(),output.value);
    const checkbox=app.node('#complete');checkbox.checked=true;checkbox.onchange({target:checkbox});
    assert.equal(app.saved().done[id],true);
    first.value='수정한 기록';first.oninput({target:first});assert.equal(app.saved().done[id],false);
    const note=app.node('#previous-note');note.value='추가로 기억할 점';note.oninput({target:note});
    assert.equal(app.saved().notes[id],note.value);assert.equal(app.context.scrollY,1200);
    assert.deepEqual(renderCounts(app),before);
  }
  const saved=app.saved(),reloaded=boot(saved);assert.deepEqual(JSON.parse(reloaded.run('JSON.stringify(state.worksheets)')),saved.worksheets);
  assert.equal(reloaded.run("state.worksheets['1-0'].target"),'수정한 기록');
  assert.equal(reloaded.run("state.worksheets['1-1'].task"),'수정한 기록');
});

test('company prompt edits stay separate from AI prompts and recompose needs confirmation for manual text',async()=>{
  const data=blankState();data.worksheets['0-1']={custom:'기존 AI 지침'};
  const app=boot(data);app.route('#course/company/2/write');app.context.scrollY=1450;
  const first=app.node('[data-field=target]'),output=app.node('#prompt-output');
  first.value='내 기업 / 운영';first.oninput({target:first});assert.match(output.value,/내 기업 \/ 운영/);
  assert.doesNotMatch(output.value,/다온|SQL|기존 AI 지침/);
  output.value='직접 수정한 기업 분석 지침';output.oninput({target:output});
  const writes=output.valueWrites;first.value='다른 기업 / 운영';first.oninput({target:first});
  assert.equal(output.valueWrites,writes);assert.equal(output.value,'직접 수정한 기업 분석 지침');
  await app.node('#copy-prompt').onclick();assert.equal(app.copied(),output.value);
  let prompts=0;app.context.confirm=()=>{prompts++;return false;};
  app.node('#recompose').onclick();assert.equal(prompts,1);assert.equal(app.saved().worksheets['1-2'].custom,output.value);
  app.context.confirm=()=>true;app.node('#recompose').onclick();
  assert.equal(app.saved().worksheets['1-2'].custom,undefined);assert.match(output.value,/다른 기업/);
  output.value='';output.oninput({target:output});first.value='세 번째 기업';first.oninput({target:first});
  assert.equal(output.value,'');assert.equal(app.saved().worksheets['1-2'].custom,'');
  assert.equal(app.saved().worksheets['0-1'].custom,'기존 AI 지침');assert.equal(app.context.scrollY,1450);
  assert.equal(boot(app.saved()).run("state.worksheets['1-2'].custom"),'');
});

test('company completion requires every field and old notes are escaped read-only references',()=>{
  const data=blankState();data.notes['1-0']='기존 목표 <script>bad()</script>';data.worksheets['1-1']={task:'내 작업'};
  const app=boot(data);app.route('#course/company/2/guide');
  const checkbox=app.node('#complete');checkbox.checked=true;checkbox.onchange({target:checkbox});
  assert.equal(checkbox.checked,false);assert.equal(app.saved().done['1-2'],undefined);
  assert.equal(app.run('selectedTab'),'write');
  const html=app.node('#tab-content').innerHTML;
  assert.match(html,/기존 목표 &lt;script&gt;/);assert.match(html,/내 작업/);assert.doesNotMatch(html,/<script>/);
  assert.equal(app.node('#prompt-output').value,'');
  for(const [key] of app.context.Workbook.fields('1-2')){const input=app.node(`[data-field=${key}]`);input.value=`나의 ${key}`;input.oninput({target:input});}
  checkbox.checked=true;checkbox.onchange({target:checkbox});assert.equal(app.saved().done['1-2'],true);
  const record=app.run('recordText(courses[1].steps[2])');assert.match(record,/완성 프롬프트/);assert.match(record,/나의 sources/);
});

test('company JSON export and selective restore retain all forms, old notes, manual empty prompt and last tab',async()=>{
  const incoming=blankState();incoming.last='#course/company/2/write';
  incoming.notes={'1-0':'보존할 기업 자유 메모','1-2':'프롬프트 추가 메모'};
  incoming.worksheets={'1-0':{target:'기업',question:'질문',sources:'자료',facts:'사실'},'1-1':{task:'할 일',tool:'선택 이유',materials:'제공 자료',verification:'확인 기준'},'1-2':{target:'백업의 기업',custom:''}};
  incoming.done={'1-0':true,'1-1':true};
  const current=blankState();current.worksheets['1-2']={custom:'현재 기업 지침'};current.notes['0-0']='다른 가이드 기록';
  const app=boot(current);app.route('#backup');
  await app.context.readBackupFile(fileFor(app,incoming));
  assert.match(app.node('#restore-preview').innerHTML,/직접 비워 둔 상태/);
  const choice=app.context.document.querySelectorAll('[data-restore-id]').find(input=>input.dataset.restoreId==='1-2'&&input.value==='incoming');
  choice.onchange({target:choice});app.node('#restore-last').onchange({target:{checked:true}});
  app.context.confirm=()=>true;app.node('#apply-restore').onclick();
  const saved=app.saved();assert.deepEqual(saved.worksheets,incoming.worksheets);assert.equal(saved.notes['0-0'],'다른 가이드 기록');
  assert.equal(saved.notes['1-0'],'보존할 기업 자유 메모');assert.equal(saved.last,incoming.last);
  const recovery=JSON.parse(app.persisted.get(recoveryKey));assert.equal(recovery.data.worksheets['1-2'].custom,'현재 기업 지침');
  app.node('#export-backup').onclick();const exported=JSON.parse(await app.downloads.at(-1).text());assert.deepEqual(exported.data,saved);
  app.route('#course/company/2/write');assert.equal(app.node('#prompt-output').value,'');
});

test('research lesson retains useful routes and fictional examples without production notes',()=>{
  const app=boot();app.route('#course/company/3/guide');
  const guide=app.node('#tab-content').innerHTML;
  for(const text of ['DartPoint AI','한경컨센서스','비상장기업','TheVC','스타트업 위클리','KIND'])assert.ok(guide.includes(text));
  assert.doesNotMatch(guide,/PDF [0-9]|원문에서|원문의 같은|보완 제안/);
  app.route('#course/company/3/example');assert.equal((app.node('#tab-content').innerHTML.match(/class="example-case"/g)||[]).length,2);
  app.route('#course/company/3/write');assert.equal(app.run("Workbook.sourceCards(state.worksheets['1-3']).length"),0);
});

test('research card input preserves DOM and viewport while saving Korean composition',async()=>{
  const app=boot();app.route('#course/company/3/write');app.node('#add-source-card').onclick();
  const input=app.node('#source-0-target'),output=app.node('#research-record');app.context.scrollY=1400;
  const before=renderCounts(app),cardWrites=app.node('#source-cards').htmlWrites;
  input.oncompositionstart();input.value='ㅎ';input.oninput({target:input,isComposing:true});
  assert.equal(app.saved().worksheets['1-3'].cards[0].target,'ㅎ');assert.equal(output.value,'');
  input.value='한글 기업';input.oncompositionend();assert.match(output.value,/한글 기업/);
  const writes=app.storageWrites();input.oninput({target:input});assert.equal(app.storageWrites(),writes);
  assert.deepEqual(renderCounts(app),before);assert.equal(app.node('#source-cards').htmlWrites,cardWrites);assert.equal(app.context.scrollY,1400);
  await app.node('#copy-research-record').onclick();assert.equal(app.copied(),output.value);
});

test('research cards enforce completion, preserve other records and confirm removal',()=>{
  const data=blankState();data.notes['1-3']='이전 메모';data.worksheets['1-2']={custom:'수동 지침'};
  const app=boot(data);app.route('#course/company/3/write');const check=app.node('#complete');check.checked=true;check.onchange({target:check});assert.equal(check.checked,false);
  app.node('#add-source-card').onclick();
  for(const [key] of app.context.Workbook.sourceFields){const input=app.node(`#source-0-${key}`);input.value='내 '+key;input.oninput({target:input});}
  check.checked=true;check.onchange({target:check});assert.equal(app.saved().done['1-3'],true);
  const input=app.node('#source-0-target');input.value='수정 기업';input.oninput({target:input});assert.equal(app.saved().done['1-3'],false);
  app.node('#add-source-card').onclick();assert.equal(app.saved().worksheets['1-3'].cards.length,2);
  app.node('remove-source:0').onclick();assert.equal(app.saved().worksheets['1-3'].cards.length,2);
  app.context.confirm=()=>true;app.node('remove-source:0').onclick();assert.equal(app.saved().worksheets['1-3'].cards.length,1);
  assert.equal(app.saved().notes['1-3'],'이전 메모');assert.equal(app.saved().worksheets['1-2'].custom,'수동 지침');
});

test('research card markup escapes saved values and copying has a scroll-safe fallback',async()=>{
  const payload='</textarea><script>not executable</script>';
  const data=blankState();data.worksheets['1-3']={cards:[{target:payload}]};data.notes['1-3']=payload;
  const app=boot(data);app.route('#course/company/3/write');assert.doesNotMatch(app.node('#source-cards').innerHTML,/<script>/);assert.match(app.node('#source-cards').innerHTML,/&lt;script&gt;/);
  app.context.scrollY=1500;app.context.navigator.clipboard.writeText=async()=>{throw new Error('Clipboard denied');};
  const output=app.node('#research-record');output.select=()=>{output.selected=true;app.context.scrollY=0;};
  await app.node('#copy-research-record').onclick();assert.equal(app.context.scrollY,1500);assert.equal(output.selected,true);
});

test('analysis reference escapes old records and guide/example visits never prefill user fields',()=>{
  const data=blankState();data.worksheets['1-2']={custom:'내 지침 </pre><script>bad()</script>'};data.worksheets['1-3']={cards:[{source:'내 자료'}]};data.notes['1-4']='이전 메모';
  const app=boot(data);for(const tab of ['guide','example','write'])app.route(`#course/company/4/${tab}`);
  const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/내 자료/);
  assert.deepEqual(app.saved().worksheets['1-4'],{});assert.equal(app.saved().worksheets['1-2'].custom,data.worksheets['1-2'].custom);assert.equal(app.saved().notes['1-4'],'이전 메모');
});
test('analysis IME saves immediately and updates prompt/record only after composition without replacing fields',()=>{
  const app=boot();app.route('#course/company/4/write');const input=app.node('[data-field=target]'),output=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
  input.oncompositionstart();input.value='ㅎ';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['1-4'].target,'ㅎ');assert.equal(output.value,'');assert.equal(record.value,'');
  input.value='한글 기업';input.oncompositionend();assert.match(output.value,/한글 기업/);assert.match(record.value,/한글 기업/);assert.deepEqual(renderCounts(app),before);
});
test('analysis editing preserves custom prompt and original, invalidates completion and keeps export current',async()=>{
  const app=boot();app.route('#course/company/4/write');
  for(const [key] of app.context.Workbook.requiredFields('1-4')){const input=app.node(`[data-field=${key}]`);input.value='내 '+key;input.oninput({target:input});}
  app.node('#prompt-output').oninput({target:{value:'내 수정 요청문'}});const complete=app.node('#complete');complete.checked=true;complete.onchange({target:complete});assert.equal(app.saved().done['1-4'],true);
  const input=app.node('[data-field=market]');input.value='수정한 시장 분석';input.oninput({target:input});assert.equal(app.saved().done['1-4'],false);assert.equal(app.saved().worksheets['1-4'].original,'내 original');assert.equal(app.node('#prompt-output').value,'내 수정 요청문');assert.match(app.node('#analysis-record').value,/수정한 시장 분석/);
  await app.node('#copy-analysis-record').onclick();assert.equal(app.copied(),app.node('#analysis-record').value);assert.match(app.copied(),/내 수정 요청문/);
  const saved=app.saved();const again=boot(saved);again.route('#course/company/4/write');assert.equal(again.node('#prompt-output').value,'내 수정 요청문');assert.equal(again.saved().worksheets['1-4'].original,'내 original');
});
test('analysis recompose cancellation preserves edits and approval changes only request, with question selection read-only',()=>{
  const data=blankState();data.worksheets['1-4']={target:'기업',sources:'자료 A',custom:'직접 고친 요청',original:'받은 원문',overview:'내 메모'};
  const app=boot(data);app.route('#course/company/4/write');app.node('#recompose').onclick();assert.equal(app.saved().worksheets['1-4'].custom,'직접 고친 요청');
  app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['1-4'].custom,undefined);assert.equal(app.saved().worksheets['1-4'].original,'받은 원문');assert.equal(app.saved().worksheets['1-4'].overview,'내 메모');
  const before=JSON.stringify(app.saved().worksheets);app.node('#analysis-question').value='competition';app.node('#analysis-question').onchange();assert.match(app.node('#analysis-followup').value,/경쟁사명/);assert.equal(JSON.stringify(app.saved().worksheets),before);
});

function verificationTestCard(verdict='confirmed'){
  return {claim:'원래 주장',source:'공식 원문 / 자료 A / 13쪽 / 확인일',comparison:'비교 기준 일치',reason:'근거가 뒷받침함',final:'대조한 최종 문장',next:'남은 질문 없음',verdict};
}
function verificationType(app,index,key,value){const input=app.node(`#verification-${index}-${key}`);input.value=value;if(key==='verdict')input.onchange({target:input});else input.oninput({target:input});return input;}
test('verification guide and examples do not fill records; reference escapes and preserves earlier writing',()=>{
  const data=blankState();data.worksheets['1-4']={original:'받은 답변 </pre><script>bad()</script>',custom:'수동 지침'};data.worksheets['1-3']={cards:[{source:'수집 자료'}]};data.notes['1-5']='기존 메모';const app=boot(data);
  for(const tab of ['guide','example','write'])app.route(`#course/company/5/${tab}`);
  const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/수집 자료/);assert.deepEqual(app.saved().worksheets['1-5'],{});assert.equal(app.saved().notes['1-5'],'기존 메모');assert.equal(app.saved().worksheets['1-4'].custom,'수동 지침');assert.equal(app.node('#verification-record').value,'');
});
test('verification editing removes stale accepted sentences immediately during IME, saves and defers other previews',()=>{
  const data=blankState();data.worksheets['1-5']={cards:[verificationTestCard()]};data.done['1-5']=true;const app=boot(data);app.route('#course/company/5/write');
  const before=renderCounts(app),input=app.node('#verification-0-claim'),record=app.node('#verification-record'),prior=record.value;
  assert.match(app.node('#verified-sentences').value,/대조한 최종 문장/);
  input.oncompositionstart();input.value='ㅎ';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['1-5'].cards[0].claim,'ㅎ');assert.equal(app.saved().worksheets['1-5'].cards[0].verdict,'');assert.equal(app.saved().done['1-5'],false);assert.equal(app.node('#verified-sentences').value,'');assert.equal(record.value,prior);
  input.value='한글 주장';input.oncompositionend();assert.match(record.value,/한글 주장/);assert.equal(app.saved().worksheets['1-5'].cards[0].claim,'한글 주장');assert.deepEqual(renderCounts(app),before);
  verificationType(app,0,'verdict','corrected');assert.match(app.node('#verified-sentences').value,/대조한 최종 문장/);
});
test('verification final sentence changes reset judgment; unverified cards complete without entering accepted output',async()=>{
  const data=blankState();data.worksheets['1-5']={cards:[verificationTestCard()]};const app=boot(data);app.route('#course/company/5/write');
  verificationType(app,0,'final','수정 최종 문장');assert.equal(app.saved().worksheets['1-5'].cards[0].verdict,'');assert.equal(app.node('#verified-sentences').value,'');
  verificationType(app,0,'verdict','unverified');const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['1-5'],true);assert.equal(app.node('#verified-sentences').value,'');await app.node('#copy-verification-record').onclick();assert.match(app.copied(),/미확인/);assert.match(app.copied(),/수정 최종 문장/);
  verificationType(app,0,'verdict','error');assert.equal(app.saved().done['1-5'],false);assert.equal(app.node('#verified-sentences').value,'');
});
test('verification prompt manual edits and intentional empty draft survive cards; recompose never changes judgments',()=>{
  const data=blankState();data.worksheets['1-5']={cards:[verificationTestCard()],custom:'수동 검증 요청'};const app=boot(data);app.route('#course/company/5/write');
  verificationType(app,0,'source','새 근거');assert.equal(app.node('#verification-prompt').value,'수동 검증 요청');app.node('#recompose-verification-prompt').onclick();assert.equal(app.saved().worksheets['1-5'].custom,'수동 검증 요청');
  const prompt=app.node('#verification-prompt');prompt.value='';prompt.oninput({target:prompt});assert.equal(app.saved().worksheets['1-5'].custom,'');verificationType(app,0,'reason','새 판단 근거');assert.equal(prompt.value,'');verificationType(app,0,'verdict','corrected');
  app.context.confirm=()=>true;app.node('#recompose-verification-prompt').onclick();assert.equal(app.saved().worksheets['1-5'].custom,undefined);assert.match(prompt.value,/새 근거/);assert.equal(app.saved().worksheets['1-5'].cards[0].verdict,'corrected');
});
test('verification add/delete honors confirmation and 20-card limit without changing old notes or source analysis',()=>{
  const data=blankState();data.worksheets['1-4']={original:'이전 분석 원문'};data.worksheets['1-5']={cards:[verificationTestCard()]};data.notes['1-5']='기존 메모';const app=boot(data);app.route('#course/company/5/write');
  app.node('remove-verification:0').onclick();assert.equal(app.saved().worksheets['1-5'].cards.length,1);app.context.confirm=()=>true;app.node('remove-verification:0').onclick();assert.equal(app.saved().worksheets['1-5'].cards.length,0);
  for(let i=0;i<21;i++)app.node('#add-verification-card').onclick();assert.equal(app.saved().worksheets['1-5'].cards.length,20);assert.equal(app.node('#add-verification-card').disabled,true);
  assert.equal(app.saved().worksheets['1-4'].original,'이전 분석 원문');assert.equal(app.saved().notes['1-5'],'기존 메모');
});
test('verification unchanged input after storage failure retries without discarding a matching verdict',()=>{
  const data=blankState();data.worksheets['1-5']={cards:[verificationTestCard()]};const app=boot(data);app.route('#course/company/5/write');
  const setter=app.context.localStorage.setItem;let fail=true;app.context.localStorage.setItem=(key,value)=>{if(fail)throw new Error('quota');setter(key,value);};
  verificationType(app,0,'source','수정 근거');assert.equal(app.run('storageOK'),false);fail=false;verificationType(app,0,'source','수정 근거');assert.equal(app.run('storageOK'),true);assert.equal(app.saved().worksheets['1-5'].cards[0].source,'수정 근거');assert.equal(app.saved().worksheets['1-5'].cards[0].verdict,'');
  verificationType(app,0,'verdict','confirmed');const writes=app.storageWrites();verificationType(app,0,'source','수정 근거');assert.equal(app.saved().worksheets['1-5'].cards[0].verdict,'confirmed');assert.equal(app.storageWrites(),writes);
});

test('posting guidance/examples never populate fields and references show only selected verified sentences',()=>{
  const data=blankState();data.notes['1-6']='기존 공고 메모';data.worksheets['1-5']={cards:[verificationTestCard(),{...verificationTestCard('unverified'),final:'불확실한 문장숨김'}]};data.worksheets['1-0']={target:'목표 </pre><script>bad()</script>'};const app=boot(data);
  for(const tab of ['guide','example','write'])app.route(`#course/company/6/${tab}`);
  const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|불확실한 문장숨김/);assert.match(html,/대조한 최종 문장/);assert.equal((html.match(/data-field="/g)||[]).length,11);assert.deepEqual(app.saved().worksheets['1-6'],{});assert.equal(app.saved().notes['1-6'],'기존 공고 메모');
});
test('posting typing saves IME immediately and defers combined preview without replacing the form',()=>{
  const app=boot();app.route('#course/company/6/write');const input=app.node('[data-field=original]'),record=app.node('#company-record'),before=renderCounts(app);
  input.oncompositionstart();input.value='ㅎ';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['1-6'].original,'ㅎ');assert.equal(record.value,'');input.value='한글 공고 원문';input.oncompositionend();assert.match(record.value,/한글 공고 원문/);assert.deepEqual(renderCounts(app),before);
});
test('posting completion enforces reference limits and changes invalidate completion without altering original',async()=>{
  const app=boot();app.route('#course/company/6/write');for(const [key] of app.context.Workbook.requiredFields('1-6')){const input=app.node(`[data-field=${key}]`);input.value='내 '+key;input.oninput({target:input});}
  const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['1-6'],true);
  const reference=app.node('[data-field=references]');reference.value='경쟁사 경력직 원문';reference.oninput({target:reference});assert.equal(app.saved().done['1-6'],false);done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['1-6'],false);assert.equal(done.checked,false);
  const limits=app.node('[data-field=referenceLimits]');limits.value='다른 법인과 경력 수준';limits.oninput({target:limits});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['1-6'],true);
  const required=app.node('[data-field=qualifications]');required.value='명시된 필수만';required.oninput({target:required});assert.equal(app.saved().done['1-6'],false);assert.equal(app.saved().worksheets['1-6'].original,'내 original');await app.node('#copy-company-record').onclick();assert.match(app.copied(),/명시된 필수만/);assert.match(app.copied(),/다른 법인과 경력 수준/);
});
test('posting reload preserves original, reference boundaries and old notes while exposing no script markup',()=>{
  const data=blankState();data.worksheets['1-6']={original:'</textarea><img src=x onerror=bad()>',references:'참고 공고',referenceLimits:'다른 법인'};data.notes['1-6']='기존 메모';data.worksheets['1-4']={custom:'수동 분석 요청'};
  const app=boot(data);app.route('#course/company/6/write');assert.doesNotMatch(app.node('#tab-content').innerHTML,/<img src=x/);const again=boot(app.saved());again.route('#course/company/6/write');assert.deepEqual(again.saved().worksheets['1-6'],data.worksheets['1-6']);assert.equal(again.saved().notes['1-6'],'기존 메모');assert.equal(again.saved().worksheets['1-4'].custom,'수동 분석 요청');
});

test('role reference is escaped and read-only; examples never fill personal experiences or keywords',()=>{
  const data=blankState();data.worksheets['1-6']={original:'공고 </pre><script>bad()</script>',references:'경력직 참고',referenceLimits:'적용 제한'};data.notes['1-7']='기존 직무 메모';const app=boot(data);
  for(const tab of ['guide','example','write'])app.route(`#course/company/7/${tab}`);const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/적용 제한/);assert.equal((html.match(/data-field="/g)||[]).length,11);assert.deepEqual(app.saved().worksheets['1-7'],{});assert.equal(app.saved().notes['1-7'],'기존 직무 메모');assert.equal(app.node('#analysis-record').value,'');
});
test('role IME saves immediately but defers request and record previews without rerendering',()=>{
  const app=boot();app.route('#course/company/7/write');const input=app.node('[data-field=posting]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);input.oncompositionstart();input.value='ㅎ';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['1-7'].posting,'ㅎ');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='한글 공고';input.oncompositionend();assert.match(prompt.value,/한글 공고/);assert.match(record.value,/한글 공고/);assert.deepEqual(renderCounts(app),before);
});
test('role editing preserves AI answer and manual request, invalidates completion and updates copied record',async()=>{
  const app=boot();app.route('#course/company/7/write');for(const [key] of app.context.Workbook.requiredFields('1-7')){const input=app.node(`[data-field=${key}]`);input.value='내 '+key;input.oninput({target:input});}
  const original=app.node('[data-field=original]');original.value='받은 원문';original.oninput({target:original});app.node('#prompt-output').oninput({target:{value:'수동 요청'}});const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['1-7'],true);
  const keyword=app.node('[data-field=keyword1]');keyword.value='고친 키워드와 근거';keyword.oninput({target:keyword});assert.equal(app.saved().done['1-7'],false);assert.equal(app.saved().worksheets['1-7'].original,'받은 원문');assert.equal(app.node('#prompt-output').value,'수동 요청');await app.node('#copy-role-record').onclick();assert.match(app.copied(),/고친 키워드와 근거/);assert.match(app.copied(),/수동 요청/);
  const again=boot(app.saved());again.route('#course/company/7/write');assert.equal(again.node('#prompt-output').value,'수동 요청');assert.equal(again.saved().worksheets['1-7'].original,'받은 원문');
});
test('role recompose cancellation preserves manual prompt; approval replaces only prompt not answer or analysis',()=>{
  const data=blankState();data.worksheets['1-7']={target:'대상',posting:'지원 공고',custom:'고친 요청',original:'답변 원문',keyword1:'내 키워드'};const app=boot(data);app.route('#course/company/7/write');app.node('#recompose').onclick();assert.equal(app.saved().worksheets['1-7'].custom,'고친 요청');app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['1-7'].custom,undefined);assert.match(app.node('#prompt-output').value,/지원 공고/);assert.equal(app.saved().worksheets['1-7'].original,'답변 원문');assert.equal(app.saved().worksheets['1-7'].keyword1,'내 키워드');
});

test('self analysis references are read-only and escaped, and deferred lesson drafts do not render',()=>{
 const data=blankState();data.worksheets['1-7']={matches:'참고 </pre><script>bad()</script>'};data.worksheets['2-2']={question:'보존할 초안',custom:''};data.notes['1-8']='기존 메모';const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/company/8/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/읽기 전용/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,6);assert.deepEqual(app.saved().worksheets['1-8'],{});assert.equal(app.saved().notes['1-8'],'기존 메모');
 app.route('#course/ai/3/write');assert.match(app.node('#tab-content').innerHTML,/data-field=/);assert.equal(app.saved().worksheets['2-2'].question,'보존할 초안');
});
test('self IME saves partial input, defers previews and preserves the active form',()=>{
 const app=boot();app.route('#course/company/8/write');const input=app.node('[data-field=experience]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='ㅎ';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['1-8'].experience,'ㅎ');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='한글 경험';input.oncompositionend();assert.match(prompt.value,/한글 경험/);assert.match(record.value,/한글 경험/);assert.deepEqual(renderCounts(app),before);
});
test('self edits reset review and completion, preserve manual prompt and original; identical events are harmless',async()=>{
 const data=blankState();data.worksheets['1-8']={target:'대상',requirements:'공고',experience:'경험',matches:'연결',gaps:'다음 행동',review:'confirmed',custom:'수동',original:'원문'};data.done['1-8']=true;const app=boot(data);app.route('#course/company/8/write');app.node('#career-review').checked=true;
 const input=app.node('[data-field=experience]');input.value='경험';input.oninput({target:input});assert.equal(app.saved().done['1-8'],true);assert.equal(app.saved().worksheets['1-8'].review,'confirmed');
 input.value='수정한 경험';input.oninput({target:input});assert.equal(app.saved().done['1-8'],false);assert.equal(app.saved().worksheets['1-8'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'수동');assert.equal(app.saved().worksheets['1-8'].original,'원문');await app.node('#copy-career-record').onclick();assert.match(app.copied(),/수정한 경험/);
});
test('self recompose respects cancellation and resets final review when accepted',()=>{
 const data=blankState();data.worksheets['1-8']={target:'대상',requirements:'공고',experience:'경험',matches:'연결',gaps:'다음 행동',review:'confirmed',custom:'수동',original:'원문'};data.done['1-8']=true;const app=boot(data);app.route('#course/company/8/write');app.node('#career-review').checked=true;
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['1-8'].review,'confirmed');assert.equal(app.saved().done['1-8'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['1-8'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.saved().done['1-8'],false);assert.equal(app.saved().worksheets['1-8'].original,'원문');assert.match(app.node('#prompt-output').value,/대상/);
});
test('self direct analysis completes with intentionally empty request and survives reload',()=>{
 const app=boot();app.route('#course/company/8/write');for(const key of ['target','requirements','experience','matches','gaps']){const input=app.node(`[data-field=${key}]`);input.value='내 '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['1-8'],true);
 const again=boot(app.saved());again.route('#course/company/8/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['1-8'].review,'confirmed');assert.equal(again.saved().done['1-8'],true);
});

test('preparation IME saves partial input, defers previews and preserves the active form',()=>{
 const app=boot();app.route('#course/company/9/write');const input=app.node('[data-field=evidence]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='ㅎ';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['1-9'].evidence,'ㅎ');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='한글 경험';input.oncompositionend();assert.match(prompt.value,/한글 경험/);assert.match(record.value,/한글 경험/);assert.deepEqual(renderCounts(app),before);
});
test('preparation edits reset review and completion, preserve manual prompt and original; identical events are harmless',async()=>{
 const data=blankState();data.worksheets['1-9']={target:'대상',motivation:'공고',evidence:'경험',plans:'연결',editing:'다음 행동',review:'confirmed',custom:'수동',original:'원문'};data.done['1-9']=true;const app=boot(data);app.route('#course/company/9/write');app.node('#career-review').checked=true;
 const input=app.node('[data-field=evidence]');input.value='경험';input.oninput({target:input});assert.equal(app.saved().done['1-9'],true);assert.equal(app.saved().worksheets['1-9'].review,'confirmed');
 input.value='수정한 경험';input.oninput({target:input});assert.equal(app.saved().done['1-9'],false);assert.equal(app.saved().worksheets['1-9'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'수동');assert.equal(app.saved().worksheets['1-9'].original,'원문');await app.node('#copy-career-record').onclick();assert.match(app.copied(),/수정한 경험/);
});
test('preparation recompose respects cancellation and resets final review when accepted',()=>{
 const data=blankState();data.worksheets['1-9']={target:'대상',motivation:'공고',evidence:'경험',plans:'연결',editing:'다음 행동',review:'confirmed',custom:'수동',original:'원문'};data.done['1-9']=true;const app=boot(data);app.route('#course/company/9/write');app.node('#career-review').checked=true;
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['1-9'].review,'confirmed');assert.equal(app.saved().done['1-9'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['1-9'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.saved().done['1-9'],false);assert.equal(app.saved().worksheets['1-9'].original,'원문');assert.match(app.node('#prompt-output').value,/대상/);
});
test('preparation direct analysis completes with intentionally empty request and survives reload',()=>{
 const app=boot();app.route('#course/company/9/write');for(const key of ['target','motivation','evidence','plans','editing']){const input=app.node(`[data-field=${key}]`);input.value='내 '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['1-9'],true);
 const again=boot(app.saved());again.route('#course/company/9/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['1-9'].review,'confirmed');assert.equal(again.saved().done['1-9'],true);
});

test('preparation references are escaped and read-only, preserve existing drafts, and do not enter the request',()=>{
 const data=blankState();data.worksheets['1-5']={strengths:'기업 근거 <script>bad()</script>'};data.worksheets['1-6']={posting:'공고 참고'};data.worksheets['1-8']={experience:'기존 내 경험 <script>bad()</script>'};data.worksheets['1-9']={target:'이전 준비 초안',custom:''};data.notes['1-9']='기존 메모';const app=boot(data);
 app.route('#course/company/9/write');const html=app.node('#tab-content').innerHTML;
 assert.match(html,/읽기 전용/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,6);
 assert.equal(app.saved().worksheets['1-9'].target,'이전 준비 초안');assert.equal(app.saved().worksheets['1-9'].evidence,undefined);assert.equal(app.node('#prompt-output').value,'');assert.equal(app.saved().notes['1-9'],'기존 메모');
});

test('question analysis IME saves partial input, defers previews and preserves the active form',()=>{
 const app=boot();app.route('#course/essay/0/write');const input=app.node('[data-field=posting]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='ㅎ';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['2-0'].posting,'ㅎ');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='한글 경험';input.oncompositionend();assert.match(prompt.value,/한글 경험/);assert.match(record.value,/한글 경험/);assert.deepEqual(renderCounts(app),before);
});
test('question analysis edits reset review and completion, preserve manual prompt and original; identical events are harmless',async()=>{
 const data=blankState();data.worksheets['2-0']={question:'대상',posting:'공고',intent:'연결',evidence:'경험',review:'confirmed',custom:'수동',original:'원문'};data.done['2-0']=true;const app=boot(data);app.route('#course/essay/0/write');app.node('#career-review').checked=true;
 const input=app.node('[data-field=evidence]');input.value='경험';input.oninput({target:input});assert.equal(app.saved().done['2-0'],true);assert.equal(app.saved().worksheets['2-0'].review,'confirmed');
 input.value='수정한 경험';input.oninput({target:input});assert.equal(app.saved().done['2-0'],false);assert.equal(app.saved().worksheets['2-0'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'수동');assert.equal(app.saved().worksheets['2-0'].original,'원문');await app.node('#copy-career-record').onclick();assert.match(app.copied(),/수정한 경험/);
});
test('question analysis recompose respects cancellation and resets final review when accepted',()=>{
 const data=blankState();data.worksheets['2-0']={question:'대상',posting:'공고',intent:'연결',evidence:'경험',review:'confirmed',custom:'수동',original:'원문'};data.done['2-0']=true;const app=boot(data);app.route('#course/essay/0/write');app.node('#career-review').checked=true;
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-0'].review,'confirmed');assert.equal(app.saved().done['2-0'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-0'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.saved().done['2-0'],false);assert.equal(app.saved().worksheets['2-0'].original,'원문');assert.match(app.node('#prompt-output').value,/대상/);
});
test('question analysis direct analysis completes with intentionally empty request and survives reload',()=>{
 const app=boot();app.route('#course/essay/0/write');for(const key of ['question','posting','intent','evidence']){const input=app.node(`[data-field=${key}]`);input.value='내 '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['2-0'],true);
 const again=boot(app.saved());again.route('#course/essay/0/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['2-0'].review,'confirmed');assert.equal(again.saved().done['2-0'],true);
});

test('question references preserve old drafts and never auto-fill question, analysis or request',()=>{
 const data=blankState();data.worksheets['1-6']={original:'공고 <script>bad()</script>'};data.worksheets['1-9']={target:'이전 사전 준비'};data.worksheets['2-0']={question:'이전 문항 초안',custom:''};data.worksheets['2-1']={question:'다음 단계 초안',custom:'보존'};data.notes['2-0']='기존 메모';const app=boot(data);
 app.route('#course/essay/0/write');const html=app.node('#tab-content').innerHTML;
 assert.match(html,/읽기 전용/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,6);
 assert.equal(app.saved().worksheets['2-0'].question,'이전 문항 초안');assert.equal(app.saved().worksheets['2-0'].posting,undefined);assert.equal(app.node('#prompt-output').value,'');assert.equal(app.saved().notes['2-0'],'기존 메모');assert.deepEqual(app.saved().worksheets['2-1'],data.worksheets['2-1']);
});

test('AI prompt groups preserve existing records and show no example values until entered',()=>{
 const data=blankState();data.notes['0-1']='기존 메모';data.worksheets['0-1']={target:'기존 직무',background:'내 배경',evidence:'내 경험',custom:''};const app=boot(data);
 app.route('#course/ai/1/write');const html=app.node('#tab-content').innerHTML;
 assert.equal((html.match(/class="prompt-group"/g)||[]).length,4);
 assert.equal((html.match(/data-field="/g)||[]).length,6);
 assert.deepEqual(app.saved().worksheets['0-1'],data.worksheets['0-1']);assert.equal(app.node('#prompt-output').value,'');
 for(const tab of ['guide','example','write'])app.route(`#course/ai/1/${tab}`);
 assert.deepEqual(app.saved().worksheets['0-1'],data.worksheets['0-1']);assert.equal(app.saved().notes['0-1'],'기존 메모');
});

test('experience selection IME saves partial input, defers previews and preserves the active form',()=>{
 const app=boot();app.route('#course/essay/1/write');const input=app.node('[data-field=candidates]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='ㅎ';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['2-1'].candidates,'ㅎ');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='한글 경험';input.oncompositionend();assert.match(prompt.value,/한글 경험/);assert.match(record.value,/한글 경험/);assert.deepEqual(renderCounts(app),before);
});
test('experience selection edits reset review and completion, preserve manual prompt and original; identical events are harmless',async()=>{
 const data=blankState();data.worksheets['2-1']={question:'대상',candidates:'공고',selected:'연결',keywords:'경험',review:'confirmed',custom:'수동',original:'원문'};data.done['2-1']=true;const app=boot(data);app.route('#course/essay/1/write');app.node('#career-review').checked=true;
 const input=app.node('[data-field=keywords]');input.value='경험';input.oninput({target:input});assert.equal(app.saved().done['2-1'],true);assert.equal(app.saved().worksheets['2-1'].review,'confirmed');
 input.value='수정한 경험';input.oninput({target:input});assert.equal(app.saved().done['2-1'],false);assert.equal(app.saved().worksheets['2-1'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'수동');assert.equal(app.saved().worksheets['2-1'].original,'원문');await app.node('#copy-career-record').onclick();assert.match(app.copied(),/수정한 경험/);
});
test('experience selection recompose respects cancellation and resets final review when accepted',()=>{
 const data=blankState();data.worksheets['2-1']={question:'대상',candidates:'공고',selected:'연결',keywords:'경험',review:'confirmed',custom:'수동',original:'원문'};data.done['2-1']=true;const app=boot(data);app.route('#course/essay/1/write');app.node('#career-review').checked=true;
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-1'].review,'confirmed');assert.equal(app.saved().done['2-1'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-1'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.saved().done['2-1'],false);assert.equal(app.saved().worksheets['2-1'].original,'원문');assert.match(app.node('#prompt-output').value,/대상/);
});
test('experience selection direct analysis completes with selectedionally empty request and survives reload',()=>{
 const app=boot();app.route('#course/essay/1/write');for(const key of ['question','candidates','selected','keywords']){const input=app.node(`[data-field=${key}]`);input.value='내 '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['2-1'],true);
 const again=boot(app.saved());again.route('#course/essay/1/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['2-1'].review,'confirmed');assert.equal(again.saved().done['2-1'],true);
});


test('experience references preserve drafts, escape source text and do not auto-fill choices',()=>{
 const data=blankState();data.worksheets['2-0']={evidence:'参照 </pre><script>bad()</script>'};data.worksheets['2-1']={question:'기존 문항',candidates:'기존 후보',selected:'기존 선택',keywords:'기존 키워드',custom:''};data.notes['2-1']='기존 메모';const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/essay/1/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/읽기 전용/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,5);
 assert.deepEqual(app.saved().worksheets['2-1'],data.worksheets['2-1']);assert.equal(app.node('#prompt-output').value,'');assert.equal(app.saved().notes['2-1'],'기존 메모');
});

test('technique outline IME saves partial input, defers previews and preserves the active form',()=>{
 const app=boot();app.route('#course/essay/2/write');const input=app.node('[data-field=star]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='ㅎ';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['2-2'].star,'ㅎ');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='한글 경험';input.oncompositionend();assert.match(prompt.value,/한글 경험/);assert.match(record.value,/한글 경험/);assert.deepEqual(renderCounts(app),before);
});
test('technique outline edits reset review and completion, preserve manual prompt and original; identical events are harmless',async()=>{
 const data=blankState();data.worksheets['2-2']={question:'대상',star:'공고',fab:'plan',kpi:'연결',outline:'경험',review:'confirmed',custom:'수동',original:'원문'};data.done['2-2']=true;const app=boot(data);app.route('#course/essay/2/write');app.node('#career-review').checked=true;
 const input=app.node('[data-field=outline]');input.value='경험';input.oninput({target:input});assert.equal(app.saved().done['2-2'],true);assert.equal(app.saved().worksheets['2-2'].review,'confirmed');
 input.value='수정한 경험';input.oninput({target:input});assert.equal(app.saved().done['2-2'],false);assert.equal(app.saved().worksheets['2-2'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'수동');assert.equal(app.saved().worksheets['2-2'].original,'원문');await app.node('#copy-career-record').onclick();assert.match(app.copied(),/수정한 경험/);
});
test('technique outline recompose respects cancellation and resets final review when accepted',()=>{
 const data=blankState();data.worksheets['2-2']={question:'대상',star:'공고',fab:'plan',kpi:'연결',outline:'경험',review:'confirmed',custom:'수동',original:'원문'};data.done['2-2']=true;const app=boot(data);app.route('#course/essay/2/write');app.node('#career-review').checked=true;
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-2'].review,'confirmed');assert.equal(app.saved().done['2-2'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-2'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.saved().done['2-2'],false);assert.equal(app.saved().worksheets['2-2'].original,'원문');assert.match(app.node('#prompt-output').value,/대상/);
});
test('technique outline direct analysis completes with intentionally empty request and survives reload',()=>{
 const app=boot();app.route('#course/essay/2/write');for(const key of ['question','star','kpi','fab','outline']){const input=app.node(`[data-field=${key}]`);input.value='내 '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['2-2'],true);
 const again=boot(app.saved());again.route('#course/essay/2/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['2-2'].review,'confirmed');assert.equal(again.saved().done['2-2'],true);
});



test('technique references preserve existing draft fields and never fill from references or examples',()=>{
 const data=blankState();data.worksheets['2-1']={selected:'source </pre><script>bad()</script>'};data.worksheets['2-2']={question:'old question',star:'old STAR',fab:'plan',kpi:'not measured',fab:'old FAB',outline:'old outline',custom:''};data.notes['2-2']='old note';const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/essay/2/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,6);
 assert.deepEqual(app.saved().worksheets['2-2'],data.worksheets['2-2']);assert.equal(app.node('#prompt-output').value,'');assert.equal(app.saved().notes['2-2'],'old note');
});

function motivationSheet(){return {question:'q',evidence:'posting',experience:'my actual action',motivation:'reason',plans:'future plan',draft:'my draft',review:'confirmed',original:'AI raw answer',custom:'manual request'};}
test('motivation references are escaped and read-only; legacy free note remains without autofilling a draft',()=>{
 const data=blankState();data.notes['2-3']='legacy motivation note';data.worksheets['1-9']={evidence:'source </pre><script>bad()</script>'};const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/essay/3/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.saved().worksheets['2-3'].draft,undefined);assert.equal(app.saved().notes['2-3'],'legacy motivation note');assert.equal(app.node('#prompt-output').value,'');
});
test('motivation IME saves input immediately and updates request and record after composition without rerendering',()=>{
 const app=boot();app.route('#course/essay/3/write');const input=app.node('[data-field=motivation]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['2-3'].motivation,'\ud55c');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
});
test('motivation draft edits reset review and completion while preserving raw AI answer and manual request',async()=>{
 const data=blankState();data.worksheets['2-3']=motivationSheet();data.done['2-3']=true;const app=boot(data);app.route('#course/essay/3/write');const input=app.node('[data-field=draft]');
 input.value='my draft';input.oninput({target:input});assert.equal(app.saved().done['2-3'],true);
 input.value='revised draft';input.oninput({target:input});assert.equal(app.saved().done['2-3'],false);assert.equal(app.saved().worksheets['2-3'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'manual request');assert.equal(app.saved().worksheets['2-3'].original,'AI raw answer');await app.node('#copy-career-record').onclick();assert.ok(app.copied().includes('revised draft'));
});
test('motivation recompose cancellation preserves review, acceptance resets it and does not replace the draft',()=>{
 const data=blankState();data.worksheets['2-3']=motivationSheet();data.done['2-3']=true;const app=boot(data);app.route('#course/essay/3/write');
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-3'].review,'confirmed');assert.equal(app.saved().done['2-3'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-3'].review,'');assert.equal(app.saved().done['2-3'],false);assert.equal(app.saved().worksheets['2-3'].draft,'my draft');assert.equal(app.saved().worksheets['2-3'].original,'AI raw answer');assert.ok(app.node('#prompt-output').value.includes('my actual action'));
});
test('motivation can complete with an intentionally blank optional request and reload with all records',()=>{
 const app=boot();app.route('#course/essay/3/write');for(const key of ['question','evidence','experience','motivation','plans','draft']){const input=app.node(`[data-field=${key}]`);input.value='my '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['2-3'],true);
 const again=boot(app.saved());again.route('#course/essay/3/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['2-3'].draft,'my draft');assert.equal(again.saved().worksheets['2-3'].review,'confirmed');assert.equal(again.saved().done['2-3'],true);
});

function problemSheet(){return {question:'q',situation:'posting',task:'my actual action',actions:'reason',results:'future plan',draft:'my draft',review:'confirmed',original:'AI raw answer',custom:'manual request'};}
test('problem solving references are escaped and read-only; legacy free note remains without autofilling a draft',()=>{
 const data=blankState();data.notes['2-4']='legacy actions note';data.worksheets['2-0']={evidence:'source </pre><script>bad()</script>'};const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/essay/4/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.saved().worksheets['2-4'].draft,undefined);assert.equal(app.saved().notes['2-4'],'legacy actions note');assert.equal(app.node('#prompt-output').value,'');
});
test('problem solving IME saves input immediately and updates request and record after composition without rerendering',()=>{
 const app=boot();app.route('#course/essay/4/write');const input=app.node('[data-field=actions]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['2-4'].actions,'\ud55c');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
});
test('problem solving draft edits reset review and completion while preserving raw AI answer and manual request',async()=>{
 const data=blankState();data.worksheets['2-4']=problemSheet();data.done['2-4']=true;const app=boot(data);app.route('#course/essay/4/write');const input=app.node('[data-field=draft]');
 input.value='my draft';input.oninput({target:input});assert.equal(app.saved().done['2-4'],true);
 input.value='revised draft';input.oninput({target:input});assert.equal(app.saved().done['2-4'],false);assert.equal(app.saved().worksheets['2-4'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'manual request');assert.equal(app.saved().worksheets['2-4'].original,'AI raw answer');await app.node('#copy-career-record').onclick();assert.ok(app.copied().includes('revised draft'));
});
test('problem solving recompose cancellation preserves review, acceptance resets it and does not replace the draft',()=>{
 const data=blankState();data.worksheets['2-4']=problemSheet();data.done['2-4']=true;const app=boot(data);app.route('#course/essay/4/write');
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-4'].review,'confirmed');assert.equal(app.saved().done['2-4'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-4'].review,'');assert.equal(app.saved().done['2-4'],false);assert.equal(app.saved().worksheets['2-4'].draft,'my draft');assert.equal(app.saved().worksheets['2-4'].original,'AI raw answer');assert.ok(app.node('#prompt-output').value.includes('my actual action'));
});
test('problem solving can complete with an intentionally blank optional request and reload with all records',()=>{
 const app=boot();app.route('#course/essay/4/write');for(const key of ['question','situation','task','actions','results','draft']){const input=app.node(`[data-field=${key}]`);input.value='my '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['2-4'],true);
 const again=boot(app.saved());again.route('#course/essay/4/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['2-4'].draft,'my draft');assert.equal(again.saved().worksheets['2-4'].review,'confirmed');assert.equal(again.saved().done['2-4'],true);
});

function goalSheet(){return {question:'q',goal:'posting',strategy:'my actual action',results:'reason',learning:'future plan',draft:'my draft',review:'confirmed',original:'AI raw answer',custom:'manual request'};}
test('goal achievement references are escaped and read-only; legacy free note remains without autofilling a draft',()=>{
 const data=blankState();data.notes['2-5']='legacy results note';data.worksheets['2-0']={evidence:'source </pre><script>bad()</script>'};const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/essay/5/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.saved().worksheets['2-5'].draft,undefined);assert.equal(app.saved().notes['2-5'],'legacy results note');assert.equal(app.node('#prompt-output').value,'');
});
test('goal achievement IME saves input immediately and updates request and record after composition without rerendering',()=>{
 const app=boot();app.route('#course/essay/5/write');const input=app.node('[data-field=results]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['2-5'].results,'\ud55c');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
});
test('goal achievement draft edits reset review and completion while preserving raw AI answer and manual request',async()=>{
 const data=blankState();data.worksheets['2-5']=goalSheet();data.done['2-5']=true;const app=boot(data);app.route('#course/essay/5/write');const input=app.node('[data-field=draft]');
 input.value='my draft';input.oninput({target:input});assert.equal(app.saved().done['2-5'],true);
 input.value='revised draft';input.oninput({target:input});assert.equal(app.saved().done['2-5'],false);assert.equal(app.saved().worksheets['2-5'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'manual request');assert.equal(app.saved().worksheets['2-5'].original,'AI raw answer');await app.node('#copy-career-record').onclick();assert.ok(app.copied().includes('revised draft'));
});
test('goal achievement recompose cancellation preserves review, acceptance resets it and does not replace the draft',()=>{
 const data=blankState();data.worksheets['2-5']=goalSheet();data.done['2-5']=true;const app=boot(data);app.route('#course/essay/5/write');
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-5'].review,'confirmed');assert.equal(app.saved().done['2-5'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-5'].review,'');assert.equal(app.saved().done['2-5'],false);assert.equal(app.saved().worksheets['2-5'].draft,'my draft');assert.equal(app.saved().worksheets['2-5'].original,'AI raw answer');assert.ok(app.node('#prompt-output').value.includes('my actual action'));
});
test('goal achievement can complete with an intentionally blank optional request and reload with all records',()=>{
 const app=boot();app.route('#course/essay/5/write');for(const key of ['question','goal','strategy','results','learning','draft']){const input=app.node(`[data-field=${key}]`);input.value='my '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['2-5'],true);
 const again=boot(app.saved());again.route('#course/essay/5/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['2-5'].draft,'my draft');assert.equal(again.saved().worksheets['2-5'].review,'confirmed');assert.equal(again.saved().done['2-5'],true);
});

function collaborationSheet(){return {question:'q',context:'posting',criteria:'my actual action',actions:'reason',results:'future plan',draft:'my draft',review:'confirmed',original:'AI raw answer',custom:'manual request'};}
test('collaboration references are escaped and read-only; legacy free note remains without autofilling a draft',()=>{
 const data=blankState();data.notes['2-6']='legacy actions note';data.worksheets['2-0']={evidence:'source </pre><script>bad()</script>'};const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/essay/6/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.saved().worksheets['2-6'].draft,undefined);assert.equal(app.saved().notes['2-6'],'legacy actions note');assert.equal(app.node('#prompt-output').value,'');
});
test('collaboration IME saves input immediately and updates request and record after composition without rerendering',()=>{
 const app=boot();app.route('#course/essay/6/write');const input=app.node('[data-field=actions]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['2-6'].actions,'\ud55c');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
});
test('collaboration draft edits reset review and completion while preserving raw AI answer and manual request',async()=>{
 const data=blankState();data.worksheets['2-6']=collaborationSheet();data.done['2-6']=true;const app=boot(data);app.route('#course/essay/6/write');const input=app.node('[data-field=draft]');
 input.value='my draft';input.oninput({target:input});assert.equal(app.saved().done['2-6'],true);
 input.value='revised draft';input.oninput({target:input});assert.equal(app.saved().done['2-6'],false);assert.equal(app.saved().worksheets['2-6'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'manual request');assert.equal(app.saved().worksheets['2-6'].original,'AI raw answer');await app.node('#copy-career-record').onclick();assert.ok(app.copied().includes('revised draft'));
});
test('collaboration recompose cancellation preserves review, acceptance resets it and does not replace the draft',()=>{
 const data=blankState();data.worksheets['2-6']=collaborationSheet();data.done['2-6']=true;const app=boot(data);app.route('#course/essay/6/write');
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-6'].review,'confirmed');assert.equal(app.saved().done['2-6'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-6'].review,'');assert.equal(app.saved().done['2-6'],false);assert.equal(app.saved().worksheets['2-6'].draft,'my draft');assert.equal(app.saved().worksheets['2-6'].original,'AI raw answer');assert.ok(app.node('#prompt-output').value.includes('my actual action'));
});
test('collaboration can complete with an intentionally blank optional request and reload with all records',()=>{
 const app=boot();app.route('#course/essay/6/write');for(const key of ['question','context','criteria','actions','results','draft']){const input=app.node(`[data-field=${key}]`);input.value='my '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['2-6'],true);
 const again=boot(app.saved());again.route('#course/essay/6/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['2-6'].draft,'my draft');assert.equal(again.saved().worksheets['2-6'].review,'confirmed');assert.equal(again.saved().done['2-6'],true);
});

function creativitySheet(){return {question:'q',limitation:'posting',idea:'my actual action',actions:'reason',results:'future plan',draft:'my draft',review:'confirmed',original:'AI raw answer',custom:'manual request'};}
test('creativity references are escaped and read-only; legacy free note remains without autofilling a draft',()=>{
 const data=blankState();data.notes['2-7']='legacy actions note';data.worksheets['2-0']={evidence:'source </pre><script>bad()</script>'};const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/essay/7/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.saved().worksheets['2-7'].draft,undefined);assert.equal(app.saved().notes['2-7'],'legacy actions note');assert.equal(app.node('#prompt-output').value,'');
});
test('creativity IME saves input immediately and updates request and record after composition without rerendering',()=>{
 const app=boot();app.route('#course/essay/7/write');const input=app.node('[data-field=actions]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['2-7'].actions,'\ud55c');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
});
test('creativity draft edits reset review and completion while preserving raw AI answer and manual request',async()=>{
 const data=blankState();data.worksheets['2-7']=creativitySheet();data.done['2-7']=true;const app=boot(data);app.route('#course/essay/7/write');const input=app.node('[data-field=draft]');
 input.value='my draft';input.oninput({target:input});assert.equal(app.saved().done['2-7'],true);
 input.value='revised draft';input.oninput({target:input});assert.equal(app.saved().done['2-7'],false);assert.equal(app.saved().worksheets['2-7'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'manual request');assert.equal(app.saved().worksheets['2-7'].original,'AI raw answer');await app.node('#copy-career-record').onclick();assert.ok(app.copied().includes('revised draft'));
});
test('creativity recompose cancellation preserves review, acceptance resets it and does not replace the draft',()=>{
 const data=blankState();data.worksheets['2-7']=creativitySheet();data.done['2-7']=true;const app=boot(data);app.route('#course/essay/7/write');
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-7'].review,'confirmed');assert.equal(app.saved().done['2-7'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-7'].review,'');assert.equal(app.saved().done['2-7'],false);assert.equal(app.saved().worksheets['2-7'].draft,'my draft');assert.equal(app.saved().worksheets['2-7'].original,'AI raw answer');assert.ok(app.node('#prompt-output').value.includes('my actual action'));
});
test('creativity can complete with an intentionally blank optional request and reload with all records',()=>{
 const app=boot();app.route('#course/essay/7/write');for(const key of ['question','limitation','idea','actions','results','draft']){const input=app.node(`[data-field=${key}]`);input.value='my '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['2-7'],true);
 const again=boot(app.saved());again.route('#course/essay/7/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['2-7'].draft,'my draft');assert.equal(again.saved().worksheets['2-7'].review,'confirmed');assert.equal(again.saved().done['2-7'],true);
});

function editingSheet(){return {question:'q',before:'posting',evidence:'my actual action',focus:'reason',changes:'future plan',revised:'my revised',review:'confirmed',original:'AI raw answer',custom:'manual request'};}
test('editing references are escaped and read-only; legacy free note remains without autofilling a revised',()=>{
 const data=blankState();data.notes['2-8']='legacy focus note';data.worksheets['2-0']={evidence:'source </pre><script>bad()</script>'};const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/essay/8/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.saved().worksheets['2-8'].revised,undefined);assert.equal(app.saved().notes['2-8'],'legacy focus note');assert.equal(app.node('#prompt-output').value,'');
});
test('editing IME saves input immediately and updates request and record after composition without rerendering',()=>{
 const app=boot();app.route('#course/essay/8/write');const input=app.node('[data-field=focus]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['2-8'].focus,'\ud55c');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
});
test('editing revised edits reset review and completion while preserving raw AI answer and manual request',async()=>{
 const data=blankState();data.worksheets['2-8']=editingSheet();data.done['2-8']=true;const app=boot(data);app.route('#course/essay/8/write');const input=app.node('[data-field=revised]');
 input.value='my revised';input.oninput({target:input});assert.equal(app.saved().done['2-8'],true);
 input.value='revised revised';input.oninput({target:input});assert.equal(app.saved().done['2-8'],false);assert.equal(app.saved().worksheets['2-8'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'manual request');assert.equal(app.saved().worksheets['2-8'].original,'AI raw answer');await app.node('#copy-career-record').onclick();assert.ok(app.copied().includes('revised revised'));
});
test('editing recompose cancellation preserves review, acceptance resets it and does not replace the revised',()=>{
 const data=blankState();data.worksheets['2-8']=editingSheet();data.done['2-8']=true;const app=boot(data);app.route('#course/essay/8/write');
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-8'].review,'confirmed');assert.equal(app.saved().done['2-8'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-8'].review,'');assert.equal(app.saved().done['2-8'],false);assert.equal(app.saved().worksheets['2-8'].revised,'my revised');assert.equal(app.saved().worksheets['2-8'].original,'AI raw answer');assert.ok(app.node('#prompt-output').value.includes('my actual action'));
});
test('editing can complete with an intentionally blank optional request and reload with all records',()=>{
 const app=boot();app.route('#course/essay/8/write');for(const key of ['question','before','evidence','focus','changes','revised']){const input=app.node(`[data-field=${key}]`);input.value='my '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['2-8'],true);
 const again=boot(app.saved());again.route('#course/essay/8/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['2-8'].revised,'my revised');assert.equal(again.saved().worksheets['2-8'].review,'confirmed');assert.equal(again.saved().done['2-8'],true);
});

test('editing copies only current revision and never substitutes a source draft or AI answer when revision is empty',async()=>{
 const data=blankState();data.worksheets['2-8']=editingSheet();data.worksheets['2-8'].before='protected original draft';data.worksheets['2-8'].revised='revision to copy';const app=boot(data);app.route('#course/essay/8/write');
 await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'revision to copy');
 const input=app.node('[data-field=revised]');input.value='changed revision';input.oninput({target:input});await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'changed revision');assert.equal(app.saved().worksheets['2-8'].before,'protected original draft');assert.equal(app.saved().worksheets['2-8'].original,'AI raw answer');
 input.value='';input.oninput({target:input});await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'changed revision');assert.equal(app.saved().worksheets['2-8'].revised,'');
});

function finalSheet(){const s={question:'q',manuscript:'protected manuscript',evidence:'records',fixes:'verified adjustments',finalText:'final body',review:'confirmed',custom:'manual request',original:'AI raw answer'};for(const [key] of globalFinalChecks())s[key]='confirmed';return s;}
function globalFinalChecks(){return ['checkFacts','checkFit','checkQuestion','checkExamples','checkLogic','checkStrength','checkParagraphs','checkConcise','checkGrammar','checkReadable','checkVoice','checkSubmission'].map(key=>[key]);}
test('final checklist renders without autofilling text, preserves legacy notes and escapes previous revisions',()=>{
 const data=blankState();data.notes['2-9']='legacy final note';data.worksheets['2-8']={revised:'source </pre><script>bad()</script>'};const app=boot(data);for(const tab of ['guide','example','write'])app.route(`#course/essay/9/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,6);assert.equal((html.match(/data-career-check="/g)||[]).length,12);assert.equal(app.saved().worksheets['2-9'].finalText,undefined);assert.equal(app.saved().notes['2-9'],'legacy final note');
});
test('final checklist blocks completion until every item and final confirmation, then survives reload',()=>{
 const app=boot();app.route('#course/essay/9/write');for(const key of ['question','manuscript','evidence','fixes','finalText']){const input=app.node(`[data-field=${key}]`);input.value='my '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete'),review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 for(const [key] of globalFinalChecks()){const input=app.node(`[data-careerCheck=${key}]`);input.checked=true;input.onchange({target:input});}
 assert.equal(app.saved().worksheets['2-9'].review,'');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['2-9'],true);
 const again=boot(app.saved());again.route('#course/essay/9/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['2-9'].finalText,'my finalText');assert.equal(again.saved().done['2-9'],true);assert.equal((again.node('#tab-content').innerHTML.match(/data-career-check="[^"]+" checked/g)||[]).length,12);
});
test('final text edits reset every check, review and completion while preserving manuscript, raw AI and manual request',()=>{
 const data=blankState();data.worksheets['2-9']=finalSheet();data.done['2-9']=true;const app=boot(data);app.route('#course/essay/9/write');for(const [key] of globalFinalChecks())app.node(`[data-careerCheck=${key}]`).checked=true;
 const input=app.node('[data-field=finalText]');input.value='final body';input.oninput({target:input});assert.equal(app.saved().done['2-9'],true);
 input.value='changed final';input.oninput({target:input});assert.equal(app.saved().done['2-9'],false);assert.equal(app.saved().worksheets['2-9'].review,'');for(const [key] of globalFinalChecks()){assert.equal(app.saved().worksheets['2-9'][key],'');assert.equal(app.node(`[data-careerCheck=${key}]`).checked,false);}assert.equal(app.saved().worksheets['2-9'].manuscript,'protected manuscript');assert.equal(app.saved().worksheets['2-9'].original,'AI raw answer');assert.equal(app.node('#prompt-output').value,'manual request');
});
test('unchecking one checklist item preserves other checks but invalidates final review and completion',()=>{
 const data=blankState();data.worksheets['2-9']=finalSheet();data.done['2-9']=true;const app=boot(data);app.route('#course/essay/9/write');const input=app.node('[data-careerCheck=checkFacts]');input.checked=false;input.onchange({target:input});assert.equal(app.saved().worksheets['2-9'].checkFacts,'');assert.equal(app.saved().worksheets['2-9'].checkFit,'confirmed');assert.equal(app.saved().worksheets['2-9'].review,'');assert.equal(app.saved().done['2-9'],false);
});
test('final review IME stores input and invalidates checks without rerendering while preview waits for composition',()=>{
 const data=blankState();data.worksheets['2-9']=finalSheet();delete data.worksheets['2-9'].custom;const app=boot(data);app.route('#course/essay/9/write');const input=app.node('[data-field=manuscript]'),prompt=app.node('#prompt-output'),prior=prompt.value,before=renderCounts(app);
 input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['2-9'].manuscript,'\ud55c');assert.equal(app.saved().worksheets['2-9'].checkFacts,'');assert.equal(prompt.value,prior);input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
});
test('final review recomposition preserves checks on cancel and clears them on acceptance, without replacing text',()=>{
 const data=blankState();data.worksheets['2-9']=finalSheet();data.done['2-9']=true;const app=boot(data);app.route('#course/essay/9/write');app.node('#recompose').onclick();assert.equal(app.saved().worksheets['2-9'].checkFacts,'confirmed');assert.equal(app.saved().done['2-9'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();for(const [key] of globalFinalChecks())assert.equal(app.saved().worksheets['2-9'][key],'');assert.equal(app.saved().worksheets['2-9'].review,'');assert.equal(app.saved().done['2-9'],false);assert.equal(app.saved().worksheets['2-9'].finalText,'final body');
});
test('final review copies only latest final text, preserving sources and never copying a fallback for blank text',async()=>{
 const data=blankState();data.worksheets['2-9']=finalSheet();const app=boot(data);app.route('#course/essay/9/write');await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'final body');const input=app.node('[data-field=finalText]');input.value='';input.oninput({target:input});await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'final body');assert.equal(app.saved().worksheets['2-9'].finalText,'');assert.equal(app.saved().worksheets['2-9'].manuscript,'protected manuscript');
});

function portfolioSheet(){return {target:'q',posting:'posting',experience:'my actual action',priorities:'reason',selection:'future plan',gaps:'my gaps',review:'confirmed',original:'AI raw answer',custom:'manual request'};}
test('portfolio analysis references are escaped and read-only; legacy free note remains without autofilling a gaps',()=>{
 const data=blankState();data.notes['3-0']='legacy priorities note';data.worksheets['1-8']={experience:'source </pre><script>bad()</script>'};const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/portfolio/0/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.saved().worksheets['3-0'].gaps,undefined);assert.equal(app.saved().notes['3-0'],'legacy priorities note');assert.equal(app.node('#prompt-output').value,'');
});
test('portfolio analysis IME saves input immediately and updates request and record after composition without rerendering',()=>{
 const app=boot();app.route('#course/portfolio/0/write');const input=app.node('[data-field=posting]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['3-0'].posting,'\ud55c');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
});
test('portfolio analysis gaps edits reset review and completion while preserving raw AI answer and manual request',async()=>{
 const data=blankState();data.worksheets['3-0']=portfolioSheet();data.done['3-0']=true;const app=boot(data);app.route('#course/portfolio/0/write');const input=app.node('[data-field=gaps]');
 input.value='my gaps';input.oninput({target:input});assert.equal(app.saved().done['3-0'],true);
 input.value='revised gaps';input.oninput({target:input});assert.equal(app.saved().done['3-0'],false);assert.equal(app.saved().worksheets['3-0'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'manual request');assert.equal(app.saved().worksheets['3-0'].original,'AI raw answer');await app.node('#copy-career-record').onclick();assert.ok(app.copied().includes('revised gaps'));
});
test('portfolio analysis recompose cancellation preserves review, acceptance resets it and does not replace the gaps',()=>{
 const data=blankState();data.worksheets['3-0']=portfolioSheet();data.done['3-0']=true;const app=boot(data);app.route('#course/portfolio/0/write');
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['3-0'].review,'confirmed');assert.equal(app.saved().done['3-0'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['3-0'].review,'');assert.equal(app.saved().done['3-0'],false);assert.equal(app.saved().worksheets['3-0'].gaps,'my gaps');assert.equal(app.saved().worksheets['3-0'].original,'AI raw answer');assert.ok(app.node('#prompt-output').value.includes('my actual action'));
});
test('portfolio analysis can complete with an intentionally blank optional request and reload with all records',()=>{
 const app=boot();app.route('#course/portfolio/0/write');for(const key of ['target','posting','experience','priorities','selection','gaps']){const input=app.node(`[data-field=${key}]`);input.value='my '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['3-0'],true);
 const again=boot(app.saved());again.route('#course/portfolio/0/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['3-0'].gaps,'my gaps');assert.equal(again.saved().worksheets['3-0'].review,'confirmed');assert.equal(again.saved().done['3-0'],true);
});


function catchphraseSheet(){return {target:'q',evidence:'evidence',focus:'my actual action',candidates:'reason',decision:'future plan',finalText:'my finalText',review:'confirmed',original:'AI raw answer',custom:'manual request'};}
test('portfolio catchphrase references are escaped and read-only; legacy free note remains without autofilling a finalText',()=>{
 const data=blankState();data.notes['3-1']='legacy candidates note';data.worksheets['1-8']={experience:'source </pre><script>bad()</script>'};const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/portfolio/1/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.saved().worksheets['3-1'].finalText,undefined);assert.equal(app.saved().notes['3-1'],'legacy candidates note');assert.equal(app.node('#prompt-output').value,'');
});
test('portfolio catchphrase IME saves input immediately and updates request and record after composition without rerendering',()=>{
 const app=boot();app.route('#course/portfolio/1/write');const input=app.node('[data-field=evidence]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['3-1'].evidence,'\ud55c');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
});
test('portfolio catchphrase finalText edits reset review and completion while preserving raw AI answer and manual request',async()=>{
 const data=blankState();data.worksheets['3-1']=catchphraseSheet();data.done['3-1']=true;const app=boot(data);app.route('#course/portfolio/1/write');const input=app.node('[data-field=finalText]');
 input.value='my finalText';input.oninput({target:input});assert.equal(app.saved().done['3-1'],true);
 input.value='revised finalText';input.oninput({target:input});assert.equal(app.saved().done['3-1'],false);assert.equal(app.saved().worksheets['3-1'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'manual request');assert.equal(app.saved().worksheets['3-1'].original,'AI raw answer');await app.node('#copy-career-record').onclick();assert.ok(app.copied().includes('revised finalText'));
});
test('portfolio catchphrase recompose cancellation preserves review, acceptance resets it and does not replace the finalText',()=>{
 const data=blankState();data.worksheets['3-1']=catchphraseSheet();data.done['3-1']=true;const app=boot(data);app.route('#course/portfolio/1/write');
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['3-1'].review,'confirmed');assert.equal(app.saved().done['3-1'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['3-1'].review,'');assert.equal(app.saved().done['3-1'],false);assert.equal(app.saved().worksheets['3-1'].finalText,'my finalText');assert.equal(app.saved().worksheets['3-1'].original,'AI raw answer');assert.ok(app.node('#prompt-output').value.includes('my actual action'));
});
test('portfolio catchphrase can complete with an intentionally blank optional request and reload with all records',()=>{
 const app=boot();app.route('#course/portfolio/1/write');for(const key of ['target','evidence','focus','candidates','decision','finalText']){const input=app.node(`[data-field=${key}]`);input.value='my '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['3-1'],true);
 const again=boot(app.saved());again.route('#course/portfolio/1/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['3-1'].finalText,'my finalText');assert.equal(again.saved().worksheets['3-1'].review,'confirmed');assert.equal(again.saved().done['3-1'],true);
});


test('portfolio catchphrase copies only the latest final line, preserving all source records and blank text',async()=>{
 const data=blankState();data.worksheets['3-1']=catchphraseSheet();const app=boot(data);app.route('#course/portfolio/1/write');await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'my finalText');
 const input=app.node('[data-field=finalText]');input.value='내가 고친 최종 한 줄';input.oninput({target:input});await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'내가 고친 최종 한 줄');assert.equal(app.saved().worksheets['3-1'].evidence,'evidence');assert.equal(app.saved().worksheets['3-1'].original,'AI raw answer');
 input.value='';input.oninput({target:input});await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'내가 고친 최종 한 줄');assert.equal(app.saved().worksheets['3-1'].finalText,'');
});

function stackSheet(){return {target:'q',inventory:'inventory',criteria:'my actual action',assessment:'reason',presentation:'future plan',gaps:'my gaps',review:'confirmed',original:'AI raw answer',custom:'manual request'};}
test('portfolio stack references are escaped and read-only; legacy free note remains without autofilling a gaps',()=>{
 const data=blankState();data.notes['3-2']='legacy assessment note';data.worksheets['1-8']={experience:'source </pre><script>bad()</script>'};const app=boot(data);
 for(const tab of ['guide','example','write'])app.route(`#course/portfolio/2/${tab}`);
 const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.saved().worksheets['3-2'].gaps,undefined);assert.equal(app.saved().notes['3-2'],'legacy assessment note');assert.equal(app.node('#prompt-output').value,'');
});
test('portfolio stack IME saves input immediately and updates request and record after composition without rerendering',()=>{
 const app=boot();app.route('#course/portfolio/2/write');const input=app.node('[data-field=inventory]'),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
 input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets['3-2'].inventory,'\ud55c');assert.equal(prompt.value,'');assert.equal(record.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
});
test('portfolio stack gaps edits reset review and completion while preserving raw AI answer and manual request',async()=>{
 const data=blankState();data.worksheets['3-2']=stackSheet();data.done['3-2']=true;const app=boot(data);app.route('#course/portfolio/2/write');const input=app.node('[data-field=gaps]');
 input.value='my gaps';input.oninput({target:input});assert.equal(app.saved().done['3-2'],true);
 input.value='revised gaps';input.oninput({target:input});assert.equal(app.saved().done['3-2'],false);assert.equal(app.saved().worksheets['3-2'].review,'');assert.equal(app.node('#career-review').checked,false);assert.equal(app.node('#prompt-output').value,'manual request');assert.equal(app.saved().worksheets['3-2'].original,'AI raw answer');await app.node('#copy-career-record').onclick();assert.ok(app.copied().includes('revised gaps'));
});
test('portfolio stack recompose cancellation preserves review, acceptance resets it and does not replace the gaps',()=>{
 const data=blankState();data.worksheets['3-2']=stackSheet();data.done['3-2']=true;const app=boot(data);app.route('#course/portfolio/2/write');
 app.node('#recompose').onclick();assert.equal(app.saved().worksheets['3-2'].review,'confirmed');assert.equal(app.saved().done['3-2'],true);
 app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets['3-2'].review,'');assert.equal(app.saved().done['3-2'],false);assert.equal(app.saved().worksheets['3-2'].gaps,'my gaps');assert.equal(app.saved().worksheets['3-2'].original,'AI raw answer');assert.ok(app.node('#prompt-output').value.includes('my actual action'));
});
test('portfolio stack can complete with an intentionally blank optional request and reload with all records',()=>{
 const app=boot();app.route('#course/portfolio/2/write');for(const key of ['target','inventory','criteria','assessment','presentation','gaps']){const input=app.node(`[data-field=${key}]`);input.value='my '+key;input.oninput({target:input});}app.node('#prompt-output').oninput({target:{value:''}});
 const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
 const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done['3-2'],true);
 const again=boot(app.saved());again.route('#course/portfolio/2/write');assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets['3-2'].gaps,'my gaps');assert.equal(again.saved().worksheets['3-2'].review,'confirmed');assert.equal(again.saved().done['3-2'],true);
});



test('portfolio stack displays a distinct proficiency rubric and importance/example legend without guessing unknown levels',()=>{
 const app=boot();app.route('#course/portfolio/2/guide');let html=app.node('#tab-content').innerHTML;for(const name of ['기초','초급','중급','고급','전문가'])assert.ok(html.includes(name));assert.match(html,/미확인/);
 app.route('#course/portfolio/2/example');html=app.node('#tab-content').innerHTML;assert.match(html,/<table class="skill-example">/);assert.match(html,/★★★★★ 5\/5/);assert.match(html,/■■■□□ 3\/5 · 중급/);assert.match(html,/Docker · 제외<\/th><td data-label="직무 중요도">미확인<\/td><td data-label="숙련도">미확인/);assert.doesNotMatch(html,/0\/5/);
});
test('portfolio stack visual example escapes technique names and explanations',()=>{
 const app=boot();app.run(`CareerLessons.lessons['3-2'].skillExample[0][0]='<script>name</script>';CareerLessons.lessons['3-2'].skillExample[0][3]='</td><script>reason</script>'`);app.route('#course/portfolio/2/example');const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;name/);assert.match(html,/&lt;script&gt;reason/);assert.doesNotMatch(html,/<script>/);
});
test('portfolio stack copies only the latest presentation and never substitutes sources for an empty presentation',async()=>{
 const data=blankState();data.worksheets['3-2']=stackSheet();const app=boot(data);app.route('#course/portfolio/2/write');await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'future plan');
 const input=app.node('[data-field=presentation]');input.value='SQL · importance 5/5 · proficiency 3/5 · development only';input.oninput({target:input});await app.node('#copy-career-final').onclick();assert.equal(app.copied(),input.value);assert.equal(app.saved().worksheets['3-2'].inventory,'inventory');assert.equal(app.saved().worksheets['3-2'].original,'AI raw answer');
 const prior=app.copied();input.value='';input.oninput({target:input});await app.node('#copy-career-final').onclick();assert.equal(app.copied(),prior);assert.equal(app.saved().worksheets['3-2'].presentation,'');
});

for(const index of [3,4,5,6,7,8,9]){
 const id=`3-${index}`;
 test(`portfolio ${index+1} tabs preserve free notes and escaped references without autofill; preparation state is explicit`,()=>{
  const data=blankState();data.notes[id]='legacy portfolio note';const reference=index===3?'3-0':index===4?'3-3':index===5?'3-3':index===6?'3-3':index===7?'3-0':'3-1';data.worksheets[reference]={original:'source </pre><script>bad()</script>'};const app=boot(data);
  for(const tab of ['guide','example','write'])app.route(`#course/portfolio/${index}/${tab}`);
  const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.node('#prompt-output').value,'');assert.equal(app.saved().notes[id],'legacy portfolio note');
  if(index>=8){assert.match(html,/완료는 원고와 점검 계획/);assert.match(html,/실제 파일 제작/);assert.match(html,/rows="8"/);}
 });
 test(`portfolio ${index+1} IME, completion, edits, raw/manual/blank requests, recomposition, final copy and reload preserve independent records`,async()=>{
  const app=boot();app.route(`#course/portfolio/${index}/write`);const keys=Array.from(app.context.Workbook.requiredFields(id),f=>f[0]).filter(k=>k!=='review');
  const input=app.node(`[data-field=${keys[0]}]`),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets[id][keys[0]],'\ud55c');assert.equal(prompt.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
  for(const key of keys){const node=app.node(`[data-field=${key}]`);node.value='my '+key;node.oninput({target:node});}
  const raw=app.node('[data-field=original]');raw.value='protected AI answer';raw.oninput({target:raw});prompt.oninput({target:{value:'manual request'}});
  const done=app.node('#complete');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);
  const review=app.node('#career-review');review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done[id],true);
  const finalKey=app.run(`CareerLessons.lessons['${id}'].finalTextKey`),output=app.node(`[data-field=${finalKey}]`);await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'my '+finalKey);
  output.value='revised final content';output.oninput({target:output});assert.equal(app.saved().done[id],false);assert.equal(app.saved().worksheets[id].review,'');assert.equal(prompt.value,'manual request');assert.equal(app.saved().worksheets[id].original,'protected AI answer');
  review.checked=true;review.onchange({target:review});app.node('#recompose').onclick();assert.equal(app.saved().worksheets[id].review,'confirmed');app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets[id].review,'');assert.equal(app.saved().worksheets[id][finalKey],'revised final content');
  prompt.oninput({target:{value:''}});review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});const again=boot(app.saved());again.route(`#course/portfolio/${index}/write`);assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets[id][finalKey],'revised final content');assert.equal(again.saved().done[id],true);
 });
}
test('portfolio comparison cards show test scope and format comparison preserves all four choices without new scripts',()=>{
 const app=boot();app.route('#course/portfolio/5/example');let html=app.node('#tab-content').innerHTML;assert.match(html,/metric-comparison/);assert.match(html,/<dd>2건<\/dd>/);assert.match(html,/<dd>0건<\/dd>/);assert.match(html,/입력 4/);assert.match(html,/미측정/);
 app.route('#course/portfolio/7/example');html=app.node('#tab-content').innerHTML;assert.match(html,/실제 제출 조건이 우선/);for(const label of ['PPT','Notion','개인 웹사이트','영상'])assert.ok(html.includes(label));
});
test('portfolio comparison and preparation metadata escape labels, cells, counts and scope',()=>{
 const app=boot();app.run(`CareerLessons.lessons['3-5'].comparisonExample.before='<script>count</script>';CareerLessons.lessons['3-7'].referenceTable.rows[0][0]='<script>format</script>';CareerLessons.lessons['3-9'].preparationOnly='<script>tool</script>'`);
 for(const index of [5,7,9]){app.route(`#course/portfolio/${index}/example`);const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);}
});

for(const index of [0,1,2,3,4,5,6,7,8]){
 const id=`4-${index}`;
 test(`interview ${index+1} tabs preserve legacy notes and escaped read-only references without autofill`,()=>{
  const data=blankState();data.notes[id]='legacy interview note';const preview=boot(),reference=preview.run(`CareerLessons.lessons['${id}'].refs[0]`);data.worksheets[reference]={original:'source </pre><script>bad()</script>'};const app=boot(data);
  for(const tab of ['guide','example','write'])app.route(`#course/interview/${index}/${tab}`);const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/data-field="/g)||[]).length,7);assert.equal(app.node('#prompt-output').value,'');assert.equal(app.saved().notes[id],'legacy interview note');
  if(index>=6){assert.match(html,/미실행·미수신/);assert.match(html,/실제 진행·녹음·촬영·업로드/);assert.match(html,/rows="8"/);}
 });
 test(`interview ${index+1} IME, completion, raw/manual/blank text, final copy, recomposition and reload remain independent`,async()=>{
  const app=boot();app.route(`#course/interview/${index}/write`);const keys=Array.from(app.context.Workbook.requiredFields(id),f=>f[0]).filter(k=>k!=='review'),input=app.node(`[data-field=${keys[0]}]`),prompt=app.node('#prompt-output'),record=app.node('#analysis-record'),before=renderCounts(app);
  input.oncompositionstart();input.value='\ud55c';input.oninput({target:input,isComposing:true});assert.equal(app.saved().worksheets[id][keys[0]],'\ud55c');assert.equal(prompt.value,'');input.value='\ud55c\uae00';input.oncompositionend();assert.ok(prompt.value.includes(input.value));assert.ok(record.value.includes(input.value));assert.deepEqual(renderCounts(app),before);
  for(const key of keys){const node=app.node(`[data-field=${key}]`);node.value='my '+key;node.oninput({target:node});}const raw=app.node('[data-field=original]');raw.value='protected raw AI';raw.oninput({target:raw});prompt.oninput({target:{value:'manual request'}});
  const done=app.node('#complete'),review=app.node('#career-review');done.checked=true;done.onchange({target:done});assert.equal(done.checked,false);review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});assert.equal(app.saved().done[id],true);
  const finalKey=app.run(`CareerLessons.lessons['${id}'].finalTextKey`),output=app.node(`[data-field=${finalKey}]`);await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'my '+finalKey);output.value='revised final answer or plan';output.oninput({target:output});assert.equal(app.saved().done[id],false);assert.equal(app.saved().worksheets[id].review,'');assert.equal(prompt.value,'manual request');assert.equal(app.saved().worksheets[id].original,'protected raw AI');
  review.checked=true;review.onchange({target:review});app.node('#recompose').onclick();assert.equal(app.saved().worksheets[id].review,'confirmed');app.context.confirm=()=>true;app.node('#recompose').onclick();assert.equal(app.saved().worksheets[id].review,'');assert.equal(app.saved().worksheets[id][finalKey],'revised final answer or plan');
  await app.node('#copy-career-final').onclick();assert.equal(app.copied(),'revised final answer or plan');const copied=app.copied();output.value='';output.oninput({target:output});await app.node('#copy-career-final').onclick();assert.equal(app.copied(),copied);output.value='revised final answer or plan';output.oninput({target:output});
  prompt.oninput({target:{value:''}});review.checked=true;review.onchange({target:review});done.checked=true;done.onchange({target:done});const again=boot(app.saved());again.route(`#course/interview/${index}/write`);assert.equal(again.node('#prompt-output').value,'');assert.equal(again.saved().worksheets[id][finalKey],'revised final answer or plan');assert.equal(again.saved().done[id],true);
 });
}
test('technical and executive evaluation show five distinct criteria with evidence-based review states',()=>{
 const app=boot();for(const index of [2,5]){app.route(`#course/interview/${index}/example`);const html=app.node('#tab-content').innerHTML;assert.match(html,/다섯 기준/);assert.match(html,/<table class="skill-example">/);assert.equal((html.match(/<th scope="row">/g)||[]).length,5);assert.match(html,/충분 \/ 보완 필요 \/ 판단 불가/);assert.match(html,index===2?/문제 해결 과정/:/판단 기준·행동/);assert.match(html,/실제 낭독|직접 재연습/);}
});
test('mock interview tool labels and evaluation tables escape source text; transcript-only records do not trigger media controls',()=>{
 const app=boot();app.run(`CareerLessons.lessons['4-7'].practiceTool='<script>tool</script>';CareerLessons.lessons['4-5'].referenceTable.rows[0][0]='<script>criterion</script>'`);
 for(const index of [5,7]){app.route(`#course/interview/${index}/example`);const html=app.node('#tab-content').innerHTML;assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|<video|<audio|type="file"/);}
});

for(const index of [3,4,5])test(`AI external ${index+1} renders every tab with safe tool links and preserves legacy notes`,()=>{
 const id=`0-${index}`,data=blankState();data.notes[id]='legacy external note';data.worksheets['0-1']={target:'protected first prompt',custom:''};const app=boot(data);
 for(const tab of ['guide','example','write']){app.route(`#course/ai/${index}/${tab}`);const html=app.node('#tab-content').innerHTML;assert.match(html,/미실행·미수신/);assert.match(html,/target="_blank" rel="noopener noreferrer"/);assert.doesNotMatch(html,/<iframe|<video|<audio|<script>/);if(tab==='write'){assert.equal((html.match(/data-field="/g)||[]).length,7);assert.match(html,/legacy external note/);assert.match(html,/id="copy-career-final"/);}}
 assert.equal(app.saved().notes[id],'legacy external note');assert.equal(app.saved().worksheets['0-1'].target,'protected first prompt');
});

test('home availability follows the complete curriculum and finder explains external execution separately',()=>{
 const app=boot();assert.match(app.node('#main').innerHTML,/5개 가이드의 45개 단계/);assert.doesNotMatch(app.node('#main').innerHTML,/AI 활용법 1–3단계와 기업 분석 1–9단계/);app.route('#find');assert.match(app.node('#main').innerHTML,/외부 도구의 실제 실행 여부/);assert.doesNotMatch(app.node('#main').innerHTML,/준비 중 항목에서도/);
});

test('company source recheck exposes six copyable accuracy rules and the three tool candidates without source-process wording',async()=>{
 const app=boot();app.route('#course/company/0/guide');assert.match(app.node('#tab-content').innerHTML,/할루시네이션/);assert.match(app.node('#tab-content').innerHTML,/정확성이 보장되는 것은 아니/);await app.node('#copy-company-accuracy').onclick();assert.equal(app.copied(),app.context.CompanyLessons.accuracyPrompt);app.route('#course/company/1/guide');for(const tool of ['Gemini','Claude','Perplexity'])assert.match(app.node('#tab-content').innerHTML,new RegExp(tool));assert.doesNotMatch(app.node('#tab-content').innerHTML,/PDF \d|원문 기준/);
});
test('company grouped writing keeps all six legacy inputs with visual numbering and no autofill',()=>{
 const saved=blankState();saved.worksheets['1-2']={experience:'legacy project only',custom:''};saved.notes['1-2']='legacy memo';const app=boot(saved);app.route('#course/company/2/write');const html=app.node('#tab-content').innerHTML;assert.equal((html.match(/data-field=/g)||[]).length,6);assert.equal((html.match(/class="prompt-group"/g)||[]).length,4);assert.ok(html.indexOf('field-experience')<html.indexOf('field-target'));assert.match(html,/field-number">01<\/span>나의 배경/);assert.equal(app.saved().worksheets['1-2'].experience,'legacy project only');assert.equal(app.saved().worksheets['1-2'].custom,'');assert.equal(app.saved().notes['1-2'],'legacy memo');
});
