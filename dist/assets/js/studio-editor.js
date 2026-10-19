'use strict';
let studioEditor=null;
function studioDraft(){return studioValue().drafts[studioEditor.key];}
function studioPersist(){studioEdit(()=>{});updateStudioPreview();}
function studioSourceLabel(source){return {profile:'공통 프로필',rule:'공통 AI 설정',category:'카테고리 기본 항목',custom:'직접 추가'}[source];}
function studioComposeView(route){
  const course=courses.find(c=>c.id===route.courseId),step=course.steps.find(s=>s.id===route.stepId),key=route.promptId?'saved-'+route.promptId:step.id;
  nav(course.id);$('#breadcrumb').innerHTML=`${esc(course.name)} <span>/</span> 프롬프트 구성`;
  const stored=route.promptId?studioValue().prompts.find(p=>p.id===route.promptId):null;
  if(route.promptId&&!stored){$('#main').innerHTML='<div class="studio-empty"><h1>저장한 프롬프트를 찾을 수 없습니다.</h1><a class="secondary" href="#notes">보관함으로 돌아가기</a></div>';return;}
  if(!studioValue().drafts[key]&&Object.keys(studioValue().drafts).length>=300){$('#main').innerHTML='<div class="studio-empty">작성 중인 구성이 많습니다. 보관함에서 필요 없는 작성 중 구성을 삭제한 뒤 다시 열어 주세요. <a class="text-button" href="#notes">보관함 열기 →</a></div>';return;}
  if(!studioValue().drafts[key])studioEdit(data=>{
    const draft=stored?PromptStudio.savedDraft(stored):PromptStudio.newDraft(data,course.id,step.id,state.worksheets[step.id]||{});
    if(!draft.name)draft.name=`${course.name} · ${step.title}`;
    data.drafts[key]=draft;
  });
  studioEditor={key,course,step,mode:'edit'};
  $('#main').innerHTML=`<a class="back-link" href="#course/${course.id}/${course.steps.indexOf(step)}/write">← 단계의 작성 기록</a><div class="page-heading"><div><div class="eyebrow">PROMPT COMPOSER · ${esc(course.name)}</div><h1>${esc(step.title)}</h1><p class="sub">필요한 공통 정보와 항목만 선택하세요. 완성한 프롬프트는 복사해 외부 AI에서 실행합니다.</p></div></div><div class="studio-editor-utility"><button class="secondary" type="button" data-open-profile>내 정보 선택</button><details class="studio-editor-manage"><summary>설정·보관함</summary><div class="studio-links"><a href="#profile">프로필 상세 관리</a><a href="#settings">공통 AI 설정</a><a href="#notes">보관함</a></div></details></div><div class="studio-modebar"><button class="secondary" type="button" id="studio-edit-mode" aria-pressed="true">작성하기</button><button class="secondary" type="button" id="studio-preview-mode" aria-pressed="false">결과·저장</button><span class="tiny" id="studio-save-state" role="status">${storageOK?'작성 중인 구성도 자동 저장됩니다.':'저장 불가 · 백업으로 보관하세요'}</span></div><div class="studio-compose" data-mode="edit"><section class="studio-editor-pane"><section class="panel studio-import"><h2>가져올 내 정보</h2><p>이번 작업에 쓸 정보만 체크하세요.</p><div id="studio-import-options"></div></section><section class="panel"><div class="studio-card-heading"><h2>내 내용 입력</h2><button class="secondary" type="button" id="studio-add-block">항목 추가 +</button></div><p class="tiny">필요 없는 항목은 체크를 해제하세요.</p><div id="studio-blocks"></div></section></section><section class="panel studio-preview-pane" aria-label="최종 프롬프트"><h2>완성한 프롬프트</h2><details class="studio-preview-sources"><summary>포함한 항목·출처 보기</summary><ol id="studio-source-list"></ol></details><div id="studio-diagnostics" role="status"></div><label class="note-label" for="studio-output">최종 프롬프트 · 직접 수정 가능</label><textarea id="studio-output" rows="16"></textarea><p class="tiny" id="studio-output-status"></p><div class="studio-toolbar"><button class="primary" id="studio-copy" type="button">프롬프트 복사</button><button class="secondary" id="studio-recompose" type="button" hidden>선택한 항목으로 다시 만들기</button></div><div class="studio-field"><label for="studio-prompt-name">프롬프트 이름</label><input id="studio-prompt-name" value="${esc(studioDraft().name)}" maxlength="200"></div><details class="studio-save-options"><summary>저장 폴더 선택</summary><div class="studio-field"><label for="studio-prompt-folder">저장 폴더</label><select id="studio-prompt-folder">${studioFolderOptions(studioDraft().folderId)}</select></div><div class="studio-inline-folder"><label class="sr-only" for="studio-inline-folder-name">새 폴더 이름</label><input id="studio-inline-folder-name" placeholder="새 폴더 이름" maxlength="100"><button class="secondary" type="button" id="studio-inline-folder-add">폴더 추가</button></div></details>${studioDraft().sourcePromptId?'<div class="studio-toolbar"><button class="primary" id="studio-save-existing" type="button">변경 저장</button></div><details class="studio-save-options"><summary>복사본으로 저장</summary><button class="secondary" id="studio-save-new" type="button">새 프롬프트로 저장</button></details>':'<div class="studio-toolbar"><button class="primary" id="studio-save-new" type="button">보관함에 저장</button></div>'}<p id="studio-saved-result" role="status" class="tiny"></p></section></div>`;
  renderStudioImports();renderStudioBlocks();updateStudioPreview();
  $('#studio-add-block').onclick=()=>{const draft=studioDraft();if(draft.blocks.length>=200){notify('항목은 200개까지 추가할 수 있습니다.');return;}draft.blocks.push(PromptStudio.block('custom','','새 항목','','custom'));studioPersist();rerenderStudioParts();document.querySelectorAll('#studio-blocks article:last-child details').forEach(detail=>detail.open=true);$('#studio-blocks article:last-child [data-block-title]')?.focus();};
  $('#studio-output').oninput=e=>{studioDraft().manual=e.target.value;studioPersist();};
  $('#studio-copy').onclick=()=>copyText(PromptStudio.output(studioDraft()),$('#studio-output'));
  $('#studio-recompose').onclick=()=>{const draft=studioDraft();if(typeof draft.manual==='string'&&draft.manual!==PromptStudio.compose(draft)&&!window.confirm('직접 수정한 최종본을 현재 선택한 항목으로 다시 조합할까요?'))return;draft.manual=null;studioPersist();};
  $('#studio-prompt-name').oninput=e=>{studioDraft().name=e.target.value;studioPersist();};
  $('#studio-prompt-folder').onchange=e=>{studioDraft().folderId=e.target.value;studioPersist();};
  $('#studio-inline-folder-add').onclick=()=>{
    const name=$('#studio-inline-folder-name').value.trim();if(!name){notify('새 폴더 이름을 입력해 주세요.');return;}
    let folder=studioValue().folders.find(f=>f.name===name);if(!folder&&studioValue().folders.length>=200){notify('폴더는 200개까지 만들 수 있습니다.');return;}
    studioEdit(data=>{if(!folder){folder={id:PromptStudio.newId(),name};data.folders.push(folder);}studioDraft().folderId=folder.id;});
    $('#studio-prompt-folder').innerHTML=studioFolderOptions(folder.id);$('#studio-inline-folder-name').value='';
  };
  function savePrompt(replace){try{let prompt;studioEdit(data=>prompt=PromptStudio.store(data,studioDraft(),replace));if(!storageOK)return;setText('#studio-saved-result',`‘${prompt.name}’ 저장했습니다.`);notify(replace?'원본에 변경 사항을 저장했습니다.':'새 프롬프트를 보관함에 저장했습니다.');}catch(error){notify(error.message);}}
  $('#studio-save-new').onclick=()=>savePrompt(false);if($('#studio-save-existing'))$('#studio-save-existing').onclick=()=>savePrompt(true);
  for(const mode of ['edit','preview'])$('#studio-'+mode+'-mode').onclick=()=>{studioEditor.mode=mode;$('.studio-compose').dataset.mode=mode;$('#studio-edit-mode').setAttribute('aria-pressed',String(mode==='edit'));$('#studio-preview-mode').setAttribute('aria-pressed',String(mode==='preview'));$('.studio-compose').scrollIntoView({block:'start',behavior:'instant'});};
}
function renderStudioImports(){
  const draft=studioDraft(),data=studioValue(),entries=PromptStudio.profileEntries(data.profile),profile=entries.sort((a,b)=>Number(PromptStudio.recommended(draft.courseId,b))-Number(PromptStudio.recommended(draft.courseId,a))),rules=data.rules.filter(r=>r.body.trim()&&(!r.categories.length||r.categories.includes(draft.courseId)));
  const renderOption=(source,entry)=>{const ref=entry.ref||entry.id,selected=draft.blocks.some(b=>b.source===source&&b.ref===ref&&b.enabled),recommended=source==='rule'||PromptStudio.recommended(draft.courseId,entry);return `<div class="studio-import-option"><label><input type="checkbox" data-import-source="${source}" data-import-ref="${esc(ref)}" ${selected?'checked':''}><span>${esc(entry.title)}${recommended?' <span class="badge">추천</span>':''}</span></label><details><summary>내용 확인</summary><pre>${esc(entry.body)}</pre></details></div>`;};
  const recommended=profile.filter(e=>PromptStudio.recommended(draft.courseId,e)),others=profile.filter(e=>!PromptStudio.recommended(draft.courseId,e));
  $('#studio-import-options').innerHTML=`<details class="studio-details" data-studio-drawer="profile" ${profile.length?'open':''}><summary>공통 프로필 <span class="tiny">${profile.length}개 정보</span></summary>${profile.length?recommended.slice(0,6).map(e=>renderOption('profile',e)).join('')+(recommended.length>6?`<details class="studio-details" data-studio-drawer="profile-more"><summary>추가 추천 정보 ${recommended.length-6}개</summary>${recommended.slice(6).map(e=>renderOption('profile',e)).join('')}</details>`:''):'<p>등록된 프로필이 없습니다. <button class="secondary" type="button" data-open-profile>내 정보 선택하기</button></p>'}${others.length?`<details class="studio-details" data-studio-drawer="profile-other"><summary>다른 프로필 정보 ${others.length}개</summary>${others.map(e=>renderOption('profile',e)).join('')}</details>`:''}</details><details class="studio-details" data-studio-drawer="rules"><summary>공통 AI 설정 <span class="tiny">${rules.length}개 항목</span></summary>${rules.length?rules.slice(0,4).map(r=>renderOption('rule',r)).join('')+(rules.length>4?`<details class="studio-details" data-studio-drawer="rules-more"><summary>다른 공통 설정 ${rules.length-4}개</summary>${rules.slice(4).map(r=>renderOption('rule',r)).join('')}</details>`:''):'<p>적용할 공통 설정이 없습니다. <a class="text-button" href="#settings">설정 추가하기 →</a></p>'}</details>`;
  document.querySelectorAll('[data-import-source]').forEach(input=>input.onchange=()=>{
    const source=input.dataset.importSource,ref=input.dataset.importRef,current=studioDraft(),existing=current.blocks.find(b=>b.source===source&&b.ref===ref),entry=source==='profile'?entries.find(e=>e.ref===ref):rules.find(r=>r.id===ref);
    if(!existing&&input.checked&&current.blocks.length>=200){input.checked=false;notify('항목은 200개까지 구성할 수 있습니다.');return;}
    if(existing)existing.enabled=input.checked;else if(input.checked&&entry)current.blocks.splice(1,0,PromptStudio.fromSource(source,entry));
    const pref={profileKeys:[],ruleIds:[]};for(const block of current.blocks.filter(b=>b.enabled)){if(block.source==='profile')pref.profileKeys.push(block.ref);if(block.source==='rule')pref.ruleIds.push(block.ref);}
    studioEdit(data=>data.preferences[current.courseId]=pref);rerenderStudioParts();
  });
}
function renderStudioBlocks(){
  const draft=studioDraft();
  $('#studio-blocks').innerHTML=draft.blocks.map((block,index)=>{
    const body=`<label class="sr-only" for="block-body-${block.id}">${esc(block.title||'항목')} 내용</label><textarea rows="4" id="block-body-${block.id}" data-block-body="${block.id}">${esc(block.body)}</textarea>`;
    return `<article class="studio-block ${block.enabled?'':'disabled'}" data-block-card="${block.id}"><div class="studio-block-head"><label><input type="checkbox" data-block-enabled="${block.id}" ${block.enabled?'checked':''}><span id="block-label-${block.id}">${esc(block.title||'새 항목')}</span></label></div>${block.source==='category'&&block.kind==='input'?body:`<details class="studio-block-content"><summary>내용 보기·수정</summary>${body}</details>`}<details class="studio-block-advanced"><summary>세부 설정</summary><div class="studio-field"><label for="block-title-${block.id}">항목 이름</label><input id="block-title-${block.id}" value="${esc(block.title)}" data-block-title="${block.id}"></div>${block.source==='custom'?`<div class="studio-field"><label for="block-kind-${block.id}">항목 종류</label><select id="block-kind-${block.id}" data-block-kind="${block.id}">${[['custom','직접 만든 항목'],['role','역할'],['format','출력 형식'],['tone','문체'],['language','언어'],['length','분량'],['rules','규칙']].map(([v,label])=>`<option value="${v}" ${block.kind===v?'selected':''}>${label}</option>`).join('')}</select></div>`:''}<p class="tiny">${studioSourceLabel(block.source)} · 수정해도 원본은 유지됩니다.</p><div class="studio-block-actions"><button class="secondary" type="button" data-move-block="${block.id}" data-direction="-1" aria-label="${esc(block.title)} 위로 이동" ${index===0?'disabled':''}>↑ 위로</button><button class="secondary" type="button" data-move-block="${block.id}" data-direction="1" aria-label="${esc(block.title)} 아래로 이동" ${index===draft.blocks.length-1?'disabled':''}>↓ 아래로</button><button class="secondary" type="button" data-delete-block="${block.id}" aria-label="${esc(block.title)} 항목 삭제">삭제</button></div></details></article>`;
  }).join('');
  document.querySelectorAll('[data-block-enabled]').forEach(input=>input.onchange=()=>{studioDraft().blocks.find(b=>b.id===input.dataset.blockEnabled).enabled=input.checked;syncStudioPreferences();studioPersist();rerenderStudioParts();});
  for(const [attr,key,event] of [['blockTitle','title','oninput'],['blockBody','body','oninput'],['blockKind','kind','onchange']])document.querySelectorAll(`[data-${attr.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}]`).forEach(input=>input[event]=()=>{const b=studioDraft().blocks.find(b=>b.id===input.dataset[attr]);b[key]=input.value;setText('#block-label-'+b.id,b.title||'새 항목');studioPersist();});
  document.querySelectorAll('[data-move-block]').forEach(button=>button.onclick=()=>{const list=studioDraft().blocks,index=list.findIndex(b=>b.id===button.dataset.moveBlock),next=index+Number(button.dataset.direction);if(next<0||next>=list.length)return;[list[index],list[next]]=[list[next],list[index]];studioPersist();rerenderStudioParts();document.querySelector(`[data-move-block="${button.dataset.moveBlock}"][data-direction="${button.dataset.direction}"]`)?.focus({preventScroll:true});});
  document.querySelectorAll('[data-delete-block]').forEach(button=>button.onclick=()=>{const draft=studioDraft(),block=draft.blocks.find(b=>b.id===button.dataset.deleteBlock);if(block.body.trim()&&!window.confirm('이 구성에서 항목을 삭제할까요? 공통 정보와 다른 저장본은 유지됩니다.'))return;draft.blocks=draft.blocks.filter(b=>b.id!==block.id);syncStudioPreferences();studioPersist();rerenderStudioParts();});
}
function rerenderStudioParts(){
  const drawers=new Map(Array.from(document.querySelectorAll('[data-studio-drawer]'),node=>[node.dataset.studioDrawer,node.open]));
  const expanded=new Map(Array.from(document.querySelectorAll('[data-block-card]'),node=>[node.dataset.blockCard,Array.from(node.querySelectorAll('details'),detail=>detail.open)]));
  Viewport.keep(()=>{
    renderStudioImports();renderStudioBlocks();
    document.querySelectorAll('[data-studio-drawer]').forEach(node=>{if(drawers.has(node.dataset.studioDrawer))node.open=drawers.get(node.dataset.studioDrawer);});
    document.querySelectorAll('[data-block-card]').forEach(node=>{if(expanded.has(node.dataset.blockCard))node.querySelectorAll('details').forEach((detail,index)=>detail.open=expanded.get(node.dataset.blockCard)[index]??detail.open);});
    updateStudioPreview();
  });
}
function updateStudioPreview(){
  if(!studioEditor||!$('#studio-output'))return;
  const draft=studioDraft();if(!draft)return;
  const output=$('#studio-output'),text=PromptStudio.output(draft);
  if(output.value!==text){const top=output.scrollTop;output.value=text;output.scrollTop=top;}
  const reset=$('#studio-recompose');if(reset)reset.hidden=typeof draft.manual!=='string';
  setText('#studio-output-status',`${text.length}자 · ${typeof draft.manual==='string'?'직접 수정한 최종본을 보관 중입니다. 항목 변경을 반영하려면 다시 조합하세요.':'선택한 항목만 실시간으로 조합합니다.'}`);
  const sourceList=$('#studio-source-list');if(sourceList)sourceList.innerHTML=draft.blocks.filter(b=>b.enabled&&b.body.trim()).map(b=>`<li><span>${esc(b.title||'항목')}</span> <span class="badge">${studioSourceLabel(b.source)}</span></li>`).join('');
  const result=PromptStudio.diagnostics(draft,studioValue());
  $('#studio-diagnostics').innerHTML=`${result.messages.map(message=>`<p class="studio-notice">${esc(message)}</p>`).join('')}${result.updates.map(update=>`<div class="studio-notice"><span>${esc(update.title)} · ${update.missing?'공통 정보에서 삭제되었지만 현재 복사본은 유지됩니다.':'공통 정보와 이 구성의 내용이 다릅니다. 현재 복사본은 유지됩니다.'}</span>${update.missing?'':`<button class="secondary" type="button" data-refresh-block="${update.id}">최신 내용 가져오기</button>`}</div>`).join('')}`;
  document.querySelectorAll('[data-refresh-block]').forEach(button=>button.onclick=()=>{const update=result.updates.find(u=>u.id===button.dataset.refreshBlock);if(!update?.entry)return;const b=studioDraft().blocks.find(b=>b.id===update.id);if(!window.confirm('이 구성의 복사본을 공통 정보의 최신 내용으로 바꿀까요? 저장된 원본은 저장 버튼을 누르기 전까지 유지됩니다.'))return;b.title=update.entry.title;b.body=update.entry.body;studioPersist();rerenderStudioParts();});
}

function syncStudioPreferences(){
  const draft=studioDraft(),pref={profileKeys:[],ruleIds:[]};
  for(const b of draft.blocks.filter(b=>b.enabled)){if(b.source==='profile')pref.profileKeys.push(b.ref);if(b.source==='rule')pref.ruleIds.push(b.ref);}
  studioValue().preferences[draft.courseId]=pref;
}
