'use strict';
function openLessonTab(tab){if(!['guide','example','write'].includes(tab))return;Viewport.keep(()=>{selectedTab=tab;if(tabView())document.querySelector(`#tab-${tab}`).focus({preventScroll:true});});}
function lessonButton(label,tab){return `<button type="button" class="primary" data-next-tab="${tab}">${label} →</button>`;}
function bindLessonButtons(){document.querySelectorAll('[data-next-tab]').forEach(b=>b.onclick=()=>openLessonTab(b.dataset.nextTab));}
function worksheetData(id){return state.worksheets[id]||(state.worksheets[id]={});}
function resetCareerChecks(id){
  const checks=window.CareerLessons?.lessons[id]?.checklist;
  if(!checks)return;
  const data=worksheetData(id);
  for(const [key] of checks)if(Object.prototype.hasOwnProperty.call(data,key))data[key]='';
  document.querySelectorAll('[data-career-check]').forEach(input=>{input.checked=false;});
}
function saveWorksheet(id,key,value){
  const d=worksheetData(id);
  // Duplicate input/compositionend events must not reset progress or rewrite UI.
  if(d[key]===value&&storageOK)return false;
  d[key]=value;
  const checklist=window.CareerLessons?.lessons[id]?.checklist;
  if(checklist&&key!=='review'&&!checklist.some(([check])=>check===key))resetCareerChecks(id);
  if(window.CareerLessons?.lessons[id]&&key!=='review'){d.review='';const check=document.querySelector('#career-review');if(check)check.checked=false;}
  if(id==='0-2'&&Workbook.revisionFields.some(([field])=>field===key)){
    for(const [check] of Workbook.checks)d[check]=false;
    document.querySelectorAll('[data-review]').forEach(input=>{if(input.checked)input.checked=false;});
  }
  if(state.done[id]){state.done[id]=false;const checkbox=document.querySelector('#complete');if(checkbox)checkbox.checked=false;updateCourseProgress();}
  save();setText('#worksheet-status',storageOK?'이 브라우저에 저장됨':'저장되지 않음 · 내려받기로 보관하세요');
  return true;
}
function renderLocalWorkflow(active){return `<section class="local-workflow" aria-label="AI API 없이 사용하는 순서"><div class="workflow-title"><h3>이 웹에서 준비하고, 외부 AI에서 실행하세요.</h3><span class="badge">자동 생성·자동 전송 없음</span></div><ol><li ${active==='prompt'?'aria-current="step"':''}><span class="workflow-number">01</span><div><a href="#course/ai/1/write">내 정보로 프롬프트 조합</a><p>입력한 내용을 정해진 양식으로 모아요. AI가 내용을 분석하거나 초안을 쓰는 기능은 아닙니다.</p></div></li><li><span class="workflow-number">02</span><div><strong>외부 AI에 직접 붙여넣기</strong><p>복사한 프롬프트를 사용하는 AI 도구에 붙여 넣으세요. 보내기 전에 이름·연락처와 회사의 비공개 자료를 확인하고 제외하세요.</p></div></li><li ${active==='revision'?'aria-current="step"':''}><span class="workflow-number">03</span><div><a href="#course/ai/2/write">받은 초안을 내 문장으로 수정</a><p>AI의 응답을 가져와 사실·내 역할·말투를 직접 점검하고 저장하세요.</p></div></li></ol><p class="workflow-footnote">입력 내용은 현재 브라우저에만 저장됩니다. 복사는 전송이 아니며, 외부 도구에 붙여 넣어 전송할 때만 해당 서비스에 내용을 제공하게 됩니다.</p></section>`;}
function renderSavedPromptReference(){const text=Workbook.output(state.worksheets['0-1']||{});if(!text.trim())return `<div class="tip-box">아직 만든 프롬프트가 없나요? <a href="#course/ai/1/write"><strong>앞 단계에서 지침을 작성</strong></a>한 뒤 외부 AI 도구에 직접 요청해 보세요. 이미 받은 초안이 있다면 바로 아래에서 검토해도 됩니다.</div>`;return `<details class="prompt-reference"><summary>앞 단계에서 만든 내 지침 확인하기</summary><p>요청한 조건과 AI의 초안이 일치하는지 비교하세요. 여기서는 지침을 읽기만 하며, 초안 입력칸에 자동으로 넣지 않습니다.</p><label class="note-label" for="saved-prompt">저장한 지침 프롬프트</label><textarea id="saved-prompt" rows="8" readonly>${esc(text)}</textarea><div class="output-actions"><button type="button" class="secondary" id="copy-saved-prompt">지침 프롬프트 복사</button><a class="text-button" href="#course/ai/1/write">앞 단계에서 지침 수정하기 →</a></div></details>`;}
function updateCourseProgress(){if(!currentCourse)return;const p=progress(currentCourse),bar=document.querySelector('[role="progressbar"]');if(bar){bar.setAttribute('aria-valuenow',p);bar.firstElementChild.style.width=p+'%';}const summary=document.querySelector('.steps-panel summary .tiny');if(summary)summary.textContent=`${currentCourse.steps.indexOf(currentStep)+1}번째 단계 · ${completed(currentCourse)} / ${currentCourse.steps.length} 완료`;const item=document.querySelector('.step-item[aria-current="step"]');if(item){item.classList.toggle('done',state.done[currentStep.id]===true);item.querySelector('.step-num').textContent=state.done[currentStep.id]?'✓':String(currentCourse.steps.indexOf(currentStep)+1).padStart(2,'0');}}
async function copyText(text,target){if(!text.trim()){notify('복사할 내용을 먼저 작성해 주세요.');return;}try{await navigator.clipboard.writeText(text);notify('복사했습니다.');}catch{if(target){Viewport.keep(()=>{target.focus({preventScroll:true});target.select();});notify('내용을 선택했습니다. 복사 단축키를 눌러 주세요.');}else notify('복사를 사용할 수 없어요. 내용을 직접 선택해 복사해 주세요.');}}
function renderField(id,field,i){const [key,label,help,example]=field;const required=Workbook.requiredFields(id).some(([name])=>name===key);const d=worksheetData(id);return `<div class="field-block"><label for="field-${key}"><span class="field-number">${String(i+1).padStart(2,'0')}</span>${esc(label)} <span class="required-text">${required?([Workbook.postingId,Workbook.roleId].includes(id)?'작성 필수':'필수'):id===Workbook.postingId&&key==='referenceLimits'?'참고 공고 작성 시 필수':'선택'}</span></label><p id="help-${key}">${esc(help)}</p><textarea id="field-${key}" data-field="${key}" aria-describedby="help-${key}" ${required?'required':''} rows="${(CareerLessons.lessons[id]?.longFields?.includes(key)||key==='draft'||(id==='2-8'&&['before','revised'].includes(key)||id==='2-9'&&['manuscript','finalText'].includes(key)))?8:(id===Workbook.analysisId&&i>=2||id===Workbook.roleId&&i>=4)?6:['evidence','original','revised','sources','experience','facts'].includes(key)?5:3}" placeholder="예: ${esc(example)}">${esc(d[key]||'')}</textarea>${renderFieldExample(key,id)}</div>`;}
function bindWorksheetFields(id){
  document.querySelectorAll('[data-field]').forEach(input=>{
    let composing=false;
    const refresh=()=>{if(currentStep?.id!==id||selectedTab!=='write')return;if(Workbook.isPrompt(id))updatePromptPreview(id);else if(id.startsWith('1-'))updateCompanyRecord(id);};
    const finish=()=>{composing=false;saveWorksheet(id,input.dataset.field,input.value);refresh();};
    input.addEventListener('compositionstart',()=>{composing=true;});
    input.oninput=event=>{
      composing=composing||Boolean(event.isComposing);
      // Keep every input saved, but wait for a complete Korean syllable before
      // changing dependent content. Never replace the active input element.
      const changed=saveWorksheet(id,input.dataset.field,input.value);
      if(changed&&!composing)refresh();
    };
    input.addEventListener('compositionend',finish);
    input.onblur=()=>{if(composing)finish();};
  });
}
function updatePromptPreview(id='0-1'){
  const output=document.querySelector('#prompt-output');if(!output)return;
  const d=worksheetData(id),text=Workbook.output(d,id);
  // A manual draft does not change when source fields change. Avoid setting its
  // value again, and preserve textarea scroll when updating an automatic draft.
  if(output.value!==text){
    const top=output.scrollTop,left=output.scrollLeft;
    output.value=text;output.scrollTop=top;output.scrollLeft=left;
  }
  if([Workbook.analysisId,Workbook.roleId].includes(id)||window.CareerLessons?.lessons[id]){const record=document.querySelector('#analysis-record');const text=Workbook.exportText(id,d);if(record&&record.value!==text){const top=record.scrollTop;record.value=text;record.scrollTop=top;}}
  const fields=Workbook.fields(id).filter(([key])=>!(window.CareerLessons?.lessons[id]&&(key==='review'||window.CareerLessons.lessons[id].checklist?.some(([check])=>check===key)))),filled=fields.filter(([key])=>typeof d[key]==='string'&&d[key].trim()).length;
  setText('#filled-count',`${filled} / ${fields.length}개 항목 작성`);
  const checklist=window.CareerLessons?.lessons[id]?.checklist;if(checklist)setText('#career-check-count',`${checklist.filter(([key])=>d[key]==='confirmed').length} / ${checklist.length}개 항목 확인`);
  setText('#output-count',text.length+'자');
  setText('#custom-status',typeof d.custom==='string'?'직접 수정한 완성본을 보관하고 있어요. 입력칸을 바꿔도 이 글은 덮어쓰지 않습니다.':'입력한 내용만 조합한 프롬프트입니다. 여기서 직접 수정할 수 있어요.');
}
function renderPromptEditor(){return `<section class="output-panel"><div class="output-heading"><h3>나의 완성 프롬프트</h3><span id="output-count" class="tiny"></span></div><label class="sr-only" for="prompt-output">완성 프롬프트 수정</label><textarea id="prompt-output" aria-describedby="custom-status" rows="13" placeholder="위 항목을 입력하면 프롬프트가 여기에 정리됩니다."></textarea><p id="custom-status"></p><div class="output-actions"><button class="primary" id="copy-prompt" type="button">프롬프트 복사</button><button class="secondary" id="recompose" type="button">입력값으로 다시 조합</button><span id="worksheet-status" class="tiny" role="status">${storageOK?'이 브라우저에 자동 저장':'저장 불가 · 내려받기로 보관하세요'}</span></div></section>`;}
function bindPromptEditor(id){
  bindWorksheetFields(id);updatePromptPreview(id);
  document.querySelector('#prompt-output').oninput=e=>{saveWorksheet(id,'custom',e.target.value);if([Workbook.analysisId,Workbook.roleId].includes(id)||window.CareerLessons?.lessons[id])updatePromptPreview(id);setText('#output-count',e.target.value.length+'자');setText('#custom-status','직접 수정한 완성본을 보관하고 있어요. 입력칸을 바꿔도 이 글은 덮어쓰지 않습니다.');};
  document.querySelector('#copy-prompt').onclick=()=>copyText(Workbook.output(worksheetData(id),id),document.querySelector('#prompt-output'));
  document.querySelector('#recompose').onclick=()=>Viewport.keep(()=>{const d=worksheetData(id);if(typeof d.custom==='string'&&d.custom!==Workbook.compose(d,id)&&!window.confirm('직접 수정한 완성본을 입력칸의 내용으로 바꿀까요?'))return;delete d.custom;resetCareerChecks(id);if(window.CareerLessons?.lessons[id]){d.review='';const check=document.querySelector('#career-review');if(check)check.checked=false;}state.done[id]=false;document.querySelector('#complete').checked=false;save();updateCourseProgress();updatePromptPreview(id);notify('현재 입력값으로 다시 조합했습니다.');});
}
function renderApprovedLesson(){const id=currentStep.id;if(!Workbook.has(id))return false;if(window.CareerLessons?.lessons[id])return renderCareerLesson();if(id.startsWith('1-'))return renderCompanyLesson();const el=document.querySelector('#tab-content');
  if(selectedTab==='example'){el.innerHTML=renderExampleGallery(id);bindLessonButtons();return true;}
  if(id==='0-0'){
    if(selectedTab==='guide'){
      const rows=[
        ['기업 분석 · 직무 탐색','Gemini, Claude, Perplexity','Gemini · Claude','웹 검색·최신 정보 수집, 출처·근거 확인, 기업과 직무의 핵심 역량 요약','기업의 최근 뉴스·신사업·실적을 조사하고, 지원 동기 소재와 직무별 기술·역량을 정리하기','지원 공고, 공식 기업 자료, 출처·발행일·확인일','인용한 출처를 직접 열고 기업명·시점·공고 조건이 맞는지 확인하세요.'],
        ['자기소개서 · IT 포트폴리오 서류 작성','ChatGPT, Gemini, Claude, 노션 AI(Notion)','Gemini · Claude','문장 구조화·어조 교정, STAR 기반 경험 정리, 기술적 문제 해결 과정 문서화','자기소개서 문항별 초안 구성, 프로젝트의 원인–해결–성과 정리, 기술 스택·회고 문장 다듬기','문항·분량, 직접 한 역할·행동·결과, 프로젝트 기록','팀 성과와 내 기여를 구분하고, 실제로 한 일과 문장이 일치하는지 확인하세요.'],
        ['IT 포트폴리오 · 시각화와 수치화','Gamma, Canva AI, Kling AI','Canva AI','텍스트를 시각적 레이아웃·인포그래픽으로 구성, 템플릿·비주얼 요소 생성, 시연 영상·모션 제작 지원','슬라이드 레이아웃·표지 구성, 성과 그래프·차트·프로젝트 구조 표현, 시연·소개 영상 구성','검증한 프로젝트 설명, 실제 측정값·단위·조건, 화면·도식 자료','차트의 값·단위·축과 원자료를 대조하세요. 측정하지 않은 성과는 만들지 않고 확인 가능한 산출물로 표현하세요.'],
        ['면접 준비 · 모의 면접','Claude, ChatGPT, 뷰인터(ViewInter), 면접톡','ChatGPT · 뷰인터(ViewInter)','제출 서류 기반 예상·후속 질문, 답변 논리와 약점 피드백, 음성·카메라를 활용한 전달력·태도 점검','서류에 근거한 예상 질문과 답변 연습, 기술·인성 꼬리 질문, 텍스트·음성·카메라 모의 면접','지원 직무, 실제 제출 서류, 직접 설명할 경험과 연습 목표','서류에 없는 경험을 답변에 넣지 않았는지 확인하세요. 피드백은 연습 자료로 활용하고 내 말로 다시 답해 보세요.']
      ];
      el.innerHTML=`<div class="lesson-lead"><span class="eyebrow">먼저 이해하기</span><h3>준비 단계에 맞는 AI의 특징과 활용 상황을 살펴보세요.</h3><p>기업 조사, 서류 작성, 시각화, 면접 연습은 필요한 기능이 다릅니다. 지금 할 작업을 정한 뒤 그 작업에 맞는 도구와 자료를 고르세요.</p></div><p class="tiny">도구별 지원 기능과 이용 조건을 확인하고, 지금 필요한 작업에 맞춰 선택하세요.</p><div class="stage-cards">${rows.map((r,i)=>`<article class="stage-card"><span class="stage-index">0${i+1}</span><h3>${esc(r[0])}</h3><dl><dt>도구 예시</dt><dd>${esc(r[1])}</dd><dt>이 단계에 필요한 AI 특징</dt><dd>${esc(r[3])}</dd><dt>활용 상황</dt><dd>${esc(r[4])}</dd><dt>내가 준비할 자료</dt><dd>${esc(r[5])}</dd><dt>내가 확인할 것</dt><dd>${esc(r[6])}</dd></dl></article>`).join('')}</div><div class="adapt-note"><strong>내 작업 하나 고르기</strong><p>지금 준비 중인 단계 → 도움받을 작업 → 필요한 기능·도구 후보 → 제공할 자료 → 결과 확인 기준을 적어보세요. 작성 공간의 기존 메모에 이어서 정리할 수 있습니다.</p></div><div class="next-action">${lessonButton('활용 예시 살펴보기','example')}${lessonButton('내 준비 메모하기','write')}</div>`;
    }else return false;
  }else if(id==='0-1'){
    if(selectedTab==='guide'){
      el.innerHTML=`<div class="lesson-lead"><span class="eyebrow">나에게 맞는 지침 만들기</span><h3>내 정보와 작업 조건으로 구체적인 지침을 만드세요.</h3><p>“너는 취업 전문가야”라는 역할 지정만으로는 내 상황과 경험을 알 수 없습니다. 해결할 문제, 실제 자료, 원하는 결과와 검증 기준을 구체적으로 알려주세요.</p></div><ol class="instruction-list"><li><strong>재사용할 나의 정보 정리</strong><p>학력·교육, 기술·어학 자격, 주요·보조 기술을 실제 사용 범위와 함께 정리하세요. 프로젝트는 2~3개를 고를 수 있다면 이름·담당 역할·핵심 기술·문제 해결·결과로 나눕니다. 하나뿐이면 그 경험부터 시작하고, 없는 자격이나 측정하지 않은 성과를 채워 넣지 마세요.</p></li><li><strong>이번 작업의 조건 바꾸기</strong><p>지원 기업·직무와 현재 상황, 필요한 도움, 제약 조건을 적습니다. 결과의 형식·순서·분량·문체와 마무리 지침은 작업마다 다시 정하세요.</p></li><li><strong>조합한 요청문 검토</strong><p>내 정보 → 해결할 문제 → 출력 방법 → 마무리 순서로 확인합니다. 지원 대상과 자료가 이번 작업에 맞는지 살피고, 금지 사항과 확인할 자료를 명시하세요.</p></li><li><strong>받은 답변과 근거 대조</strong><p>추상적인 강점 대신 직접 한 행동이 드러나는지, 경험과 직무 기여가 연결되는지 확인하세요. 회사명·직무명·기술명과 성과를 제공 자료에 대조하고, 내 문장으로 다듬는 작업은 다음 단계에서 진행합니다.</p></li></ol><div class="stage-cards">${Workbook.promptGroups.map((g,i)=>`<article class="stage-card"><span class="stage-index">0${i+1}</span><h3>${esc(g.title)}</h3><p>${esc(g.help)}</p></article>`).join('')}</div><div class="next-action">${lessonButton('완성 예시 살펴보기','example')}${lessonButton('내 지침 작성하기','write')}</div>`;
    }else{
      let number=0;
      el.innerHTML=`<div class="worksheet-heading"><div><h3>내 정보와 이번 작업을 나누어 지침을 완성하세요.</h3><p>여섯 입력칸을 네 부분으로 정리합니다. 배경·경험을 재사용하되, 이번에 제공할 자료와 작업 조건은 다시 확인하세요. 입력 내용은 자동 저장됩니다.</p></div><span class="badge" id="filled-count"></span></div>${Workbook.promptGroups.map(g=>`<section class="prompt-group"><h3>${esc(g.title)}</h3><p>${esc(g.help)}</p><div class="worksheet-grid">${g.keys.map(key=>renderField(id,Workbook.promptFields.find(f=>f[0]===key),number++)).join('')}</div></section>`).join('')}${renderPromptEditor()}<div class="tip-box">입력값을 요청문으로 조합합니다. 직접 수정한 요청문은 입력칸을 바꿔도 유지되며, ‘입력값으로 다시 조합’을 누르면 현재 내용으로 갱신할 수 있습니다. 검토한 요청문을 복사해 사용하는 AI 도구에서 실행하세요.</div>`;
      bindPromptEditor(id);
    }
  }else if(id==='0-2'){
    if(selectedTab==='guide')el.innerHTML=`<div class="lesson-lead"><span class="eyebrow">초안을 내 글로 바꾸기</span><h3>내 경험으로 확인하고, 내가 설명할 수 있는 문장으로 고치세요.</h3><p>자연스럽게 읽히는 문장도 경험·수치·역할이 틀릴 수 있습니다. 단어만 바꾸기 전에 내용과 근거를 확인하고, 지원 문항에 맞춰 직접 수정하세요.</p></div><ol class="instruction-list"><li><strong>원문과 요청 조건 함께 보기</strong><p>검토할 문장이나 문단을 원문 칸에 남깁니다. 앞 단계의 지침에서 문항, 지원 대상, 형식·분량 조건을 확인하세요. 이미 받은 초안이 있다면 바로 시작해도 됩니다.</p></li><li><strong>문제 표현과 이유 표시하기</strong><p>하지 않은 경험, 측정하지 않은 수치, 확인하지 않은 회사 정보에 표시하세요. “탁월한”, “주도했다” 같은 표현은 뒷받침할 행동이 있는지 확인하고, 팀 성과가 내 성과로 바뀌지 않았는지 살핍니다.</p></li><li><strong>실제 행동과 기록으로 대조하기</strong><p>내가 맡은 범위, 직접 한 행동, 확인한 결과를 정리하세요. 프로젝트 문서·코드·테스트 기록이나 공고와 대조합니다. 확인할 수 없는 내용은 삭제하거나 확인 전으로 남기고, 제출할 문장에 사실처럼 넣지 마세요.</p></li><li><strong>내 문장으로 다시 쓰고 읽어보기</strong><p>문제 → 내 행동 → 확인한 결과 순서로 문항에 답하세요. 수치가 없다면 실제 산출물과 확인한 동작을 적습니다. 소리 내어 읽으며 낯선 표현을 고치고, 분량은 최종 제출 화면의 기준으로 다시 확인하세요.</p></li></ol><div class="stage-cards three"><article class="stage-card"><span class="stage-index">01</span><h3>사실과 근거</h3><p>경험·회사명·기술명·수치가 기록과 일치하나요? 측정 조건이나 확인 범위를 넘어서 말하지 않았나요?</p></article><article class="stage-card"><span class="stage-index">02</span><h3>내 역할과 행동</h3><p>팀이 이룬 결과와 내가 맡은 일이 구분되나요? 무엇을 왜, 어떻게 했는지 말할 수 있나요?</p></article><article class="stage-card"><span class="stage-index">03</span><h3>문항과 내 말투</h3><p>질문에 답하고 분량 조건을 지켰나요? 면접에서 같은 내용을 내 말로 설명할 수 있나요?</p></article></div><div class="tip-box">AI에 다시 수정을 요청해도 새 답변을 같은 기준으로 확인하세요. 근거가 부족하면 질문할 내용과 확인할 자료를 먼저 정리합니다.</div><div class="next-action">${lessonButton('수정 전후 비교하기','example')}${lessonButton('내 초안 검토하기','write')}</div>`;
    else{const d=worksheetData(id);el.innerHTML=`<h3>내가 설명할 수 있는 문장으로 완성해 보세요.</h3><p>원문 → 문제 표현과 수정 이유 → 실제 행동과 근거 → 수정본 순서로 작성하세요. 네 칸을 채우고 마지막 점검 3개를 확인하면 완료할 수 있습니다.</p><div class="worksheet-grid revision-grid">${Workbook.revisionFields.map((f,i)=>renderField(id,f,i)).join('')}</div><fieldset class="final-checks"><legend>마지막 점검</legend><p>수정본이 문항에 답하는지, 요구한 형식·분량을 지켰는지도 확인하세요.</p>${Workbook.checks.map(([key,label])=>`<label><input type="checkbox" data-review="${key}" ${d[key]?'checked':''}>${label}</label>`).join('')}</fieldset><div class="output-actions"><button class="primary" id="copy-revision">수정한 문장 복사</button><span class="tiny" id="worksheet-status" role="status">${storageOK?'이 브라우저에 자동 저장':'저장 불가 · 내려받기로 보관하세요'}</span></div>`;bindWorksheetFields(id);document.querySelectorAll('[data-review]').forEach(input=>input.onchange=e=>saveWorksheet(id,e.target.dataset.review,e.target.checked));document.querySelector('#copy-revision').onclick=()=>copyText(worksheetData(id).revised||'',document.querySelector('#field-revised'));}
  }
  if(selectedTab==='write'&&id!=='0-0'){
    el.insertAdjacentHTML('afterbegin',renderLocalWorkflow(id==='0-1'?'prompt':'revision'));
    if(id==='0-1')el.insertAdjacentHTML('beforeend',`<div class="next-action"><div><h3>외부 AI에서 답변을 받았나요?</h3><p>받은 초안을 복사해 다음 단계의 ‘AI가 작성한 원문’에 붙여 넣으세요. 이 버튼은 화면만 이동하며, 어떤 내용도 외부로 보내지 않습니다.</p></div><a class="primary" href="#course/ai/2/write">받은 초안 검토하러 가기 →</a></div>`);
    if(id==='0-2'){
      const workflow=el.querySelector('.local-workflow');
      workflow.insertAdjacentHTML('afterend',renderSavedPromptReference());
      const button=document.querySelector('#copy-saved-prompt');
      if(button)button.onclick=()=>copyText(Workbook.output(state.worksheets['0-1']||{}),document.querySelector('#saved-prompt'));
      el.insertAdjacentHTML('beforeend',`<div class="tip-box">이 화면은 자동 첨삭이나 AI 평가를 하지 않습니다. 내용을 바꾸면 마지막 점검이 해제되니, 수정한 글을 기준으로 다시 확인해 주세요.</div>`);
    }
    el.insertAdjacentHTML('beforeend',`<div class="tip-box">작성한 내용은 상단 <a href="#notes"><strong>내 메모</strong></a>에서도 확인하고 파일로 내려받을 수 있어요.</div>`);
    if(typeof state.notes[id]==='string'&&state.notes[id].trim()){
      el.insertAdjacentHTML('beforeend',`<details class="legacy-note"><summary>이 단계에서 이전에 작성한 자유 메모</summary><label class="note-label" for="previous-note">기존 메모 확인·수정</label><textarea id="previous-note">${esc(state.notes[id])}</textarea></details>`);
      document.querySelector('#previous-note').oninput=e=>{state.notes[id]=e.target.value;save();};
    }
  }
  bindLessonButtons();return true;
}
