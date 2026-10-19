'use strict';
function scrollToContents(){document.querySelector('#lesson-host')?.scrollIntoView({block:'start',behavior:'instant'});}
function openLessonTab(tab,{fromBottom=false}={}){if(!['guide','example','write'].includes(tab))return;Viewport.keep(()=>{selectedTab=tab;if(tabView())document.querySelector(`#tab-${tab}`).focus({preventScroll:true});});if(fromBottom)scrollToContents();}
function lessonButton(label,tab){return `<button type="button" class="primary" data-next-tab="${tab}">${label} →</button>`;}
function bindLessonButtons(){document.querySelectorAll('[data-next-tab]').forEach(b=>b.onclick=()=>openLessonTab(b.dataset.nextTab,{fromBottom:true}));}
function formatExampleText(value){return esc(String(value??'').replace(/ +\/ +/g,'\n'));}
function renderPromptSamples(samples){return `<div class="prompt-samples">${samples.map(([title,text],i)=>`<section class="prompt-sample"><h4>${esc(title)}</h4><div class="example-block"><pre>${esc(text)}</pre></div><button type="button" class="secondary" data-copy-sample="${i}">이 요청문 복사</button></section>`).join('')}</div>`;}
function bindPromptSamples(samples){document.querySelectorAll('[data-copy-sample]').forEach(button=>button.onclick=()=>copyText(samples[Number(button.dataset.copySample)][1]));}
const revisionPromptSamples=[
 ['Step 1. AI다운 표현과 수정 이유 살펴보기','지금까지 나만의 지침 프롬프트로 만든 결과물이야.\n이 글에서 생성형 AI가 쓴 듯한 문장이나 표현을 찾아주고, 그렇게 판단한 이유를 정리해 줘.\n예: “예를 들어”, “이러한 경험을 통해” 같은 상투적 연결어 반복, 균일한 문장 길이, 감정 없는 나열식 구성.\n문체만으로 AI 작성 여부를 확정하지 말고, 더 자연스럽게 다듬을 표현을 제안해 줘.\n\n[검토할 초안 붙여 넣기]'],
 ['Step 2. 나의 말투로 다듬기','방금 찾아준 표현을 다듬고, 아래 내 평소 말투 특징을 참고해서 한 번 더 수정해 줘.\n- 평소 어조: [예: 간결하고 담백한 문장]\n- 자주 쓰는 표현·단어: [내가 자주 쓰는 표현]\n- 피하고 싶은 표현: [예: 지나치게 격식적이거나 진부한 말]\n\n내가 예전에 직접 쓴 글이 있다면 문체 참고용으로 덧붙일게. 없으면 이 항목은 생략해 줘.\n[직접 쓴 글 · 선택]\n\n사실·경험·수치는 바꾸지 말고, 문체 참고 글의 다른 경험이나 감정은 가져오지 마.']
];
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
function updateCourseProgress(){if(!currentCourse)return;const p=progress(currentCourse),bar=document.querySelector('[role="progressbar"]');if(bar){bar.setAttribute('aria-valuenow',p);bar.firstElementChild.style.width=p+'%';}const summary=document.querySelector('#steps-progress');if(summary)summary.textContent=`${currentCourse.steps.indexOf(currentStep)+1}번째 단계 · ${completed(currentCourse)} / ${currentCourse.steps.length} 완료`;const item=document.querySelector('.step-item[aria-current="step"]');if(item){item.classList.toggle('done',state.done[currentStep.id]===true);item.querySelector('.step-num').textContent=state.done[currentStep.id]?'✓':String(currentCourse.steps.indexOf(currentStep)+1).padStart(2,'0');}}
async function copyText(text,target){if(!text.trim()){notify('복사할 내용을 먼저 작성해 주세요.');return;}try{await navigator.clipboard.writeText(text);notify('복사했습니다.');}catch{if(target){Viewport.keep(()=>{target.focus({preventScroll:true});target.select();});notify('내용을 선택했습니다. 복사 단축키를 눌러 주세요.');}else notify('복사를 사용할 수 없어요. 내용을 직접 선택해 복사해 주세요.');}}
function renderField(id,field,i){const [key,label,help,example]=field;if(window.PDFContent?.hidden(id,key))return '';if(id==='1-6')i=PDFContent.visibleFields(id,Workbook.fields(id)).findIndex(([name])=>name===key);const required=Workbook.requiredFields(id).some(([name])=>name===key);const d=worksheetData(id);if(window.ChoiceInputs?.config(id,key))return ChoiceInputs.render(id,field,i,required,d[key]||'',renderFieldExample(key,id));return `<div class="field-block"><label for="field-${key}"><span class="field-number">${String(i+1).padStart(2,'0')}</span>${esc(label)} <span class="required-text">${required?([Workbook.postingId,Workbook.roleId].includes(id)?'작성 필수':'필수'):id===Workbook.postingId&&key==='referenceLimits'?'참고 공고 작성 시 필수':'선택'}</span></label><p id="help-${key}">${esc(help)}</p><textarea id="field-${key}" data-field="${key}" aria-describedby="help-${key}" ${required?'required':''} rows="${(CareerLessons.lessons[id]?.longFields?.includes(key)||key==='draft'||(id==='2-8'&&['before','revised'].includes(key)||id==='2-9'&&['manuscript','finalText'].includes(key)))?8:(id===Workbook.analysisId&&i>=2||id===Workbook.roleId&&i>=4)?6:['evidence','original','revised','sources','experience','facts'].includes(key)?5:3}" placeholder="예: ${esc(example)}">${esc(d[key]||'')}</textarea>${renderFieldExample(key,id)}</div>`;}
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
  if(window.ChoiceInputs)ChoiceInputs.bind(id,()=>{if(Workbook.isPrompt(id))updatePromptPreview(id);else if(id.startsWith('1-'))updateCompanyRecord(id);});
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
function renderApprovedLesson(){if(window.PDFContent&&renderPDFContentLesson())return true;const id=currentStep.id;if(!Workbook.has(id))return false;if(window.CareerLessons?.lessons[id])return renderCareerLesson();if(id.startsWith('1-'))return renderCompanyLesson();const el=document.querySelector('#tab-content');
  if(selectedTab==='example'){el.innerHTML=renderExampleGallery(id);bindLessonButtons();if(id==='0-2')bindPromptSamples(revisionPromptSamples);return true;}
  if(id==='0-0'){
    if(selectedTab==='guide'){
      const rows=[
        ['기업 분석 · 직무 탐색','Gemini, Claude, Perplexity','Gemini · Claude','웹 검색·최신 정보 수집, 출처·근거 확인, 기업과 직무의 핵심 역량 요약','기업의 최근 뉴스·신사업·실적을 조사하고, 지원 동기 소재와 직무별 기술·역량을 정리하기','지원 공고와 공식 기업 자료 · 원문 링크는 필요할 때 함께 준비','인용한 출처를 직접 열고 기업명·시점·공고 조건이 맞는지 확인하세요.'],
        ['자기소개서 · IT 포트폴리오 서류 작성','ChatGPT, Gemini, Claude, 노션 AI(Notion)','Gemini · Claude','문장 구조화·어조 교정, STAR 기반 경험 정리, 기술적 문제 해결 과정 문서화','자기소개서 문항별 초안 구성, 프로젝트의 원인–해결–성과 정리, 기술 스택·회고 문장 다듬기','문항·분량, 직접 한 역할·행동·결과, 프로젝트 기록','팀 성과와 내 기여를 구분하고, 실제로 한 일과 문장이 일치하는지 확인하세요.'],
        ['IT 포트폴리오 · 시각화와 수치화','Gamma, Canva AI, Kling AI','Canva AI','텍스트를 시각적 레이아웃·인포그래픽으로 구성, 템플릿·비주얼 요소 생성, 시연 영상·모션 제작 지원','슬라이드 레이아웃·표지 구성, 성과 그래프·차트·프로젝트 구조 표현, 시연·소개 영상 구성','검증한 프로젝트 설명, 실제 측정값·단위·조건, 화면·도식 자료','차트의 값·단위·축과 원자료를 대조하세요. 측정하지 않은 성과는 만들지 않고 확인 가능한 산출물로 표현하세요.'],
        ['면접 준비 · 모의 면접','Claude, ChatGPT, 뷰인터(ViewInter), 면접톡','ChatGPT · 뷰인터(ViewInter)','제출 서류 기반 예상·후속 질문, 답변 논리와 약점 피드백, 음성·카메라를 활용한 전달력·태도 점검','서류에 근거한 예상 질문과 답변 연습, 기술·인성 꼬리 질문, 텍스트·음성·카메라 모의 면접','지원 직무, 실제 제출 서류, 직접 설명할 경험과 연습 목표','서류에 없는 경험을 답변에 넣지 않았는지 확인하세요. 피드백은 연습 자료로 활용하고 내 말로 다시 답해 보세요.']
      ];
      el.innerHTML=`<div class="lesson-lead"><span class="eyebrow">먼저 이해하기</span><h3>준비 단계에 맞는 AI의 특징과 활용 상황을 살펴보세요.</h3><p>기업 조사, 서류 작성, 시각화, 면접 연습은 필요한 기능이 다릅니다. 지금 할 작업을 정한 뒤 그 작업에 맞는 도구와 자료를 고르세요.</p></div><p class="tiny">도구별 지원 기능과 이용 조건을 확인하고, 지금 필요한 작업에 맞춰 선택하세요.</p><div class="stage-cards">${rows.map((r,i)=>`<article class="stage-card"><span class="stage-index">0${i+1}</span><h3>${esc(r[0])}</h3><dl><dt>도구 예시</dt><dd>${esc(r[1])}</dd><dt>추천 AI</dt><dd class="recommended-tools">★ ${esc(r[2])}</dd><dt>이 단계에 필요한 AI 특징</dt><dd>${esc(r[3])}</dd><dt>활용 상황</dt><dd>${esc(r[4])}</dd><dt>내가 준비할 자료</dt><dd>${esc(r[5])}</dd><dt>내가 확인할 것</dt><dd>${esc(r[6])}</dd></dl></article>`).join('')}</div><div class="adapt-note"><strong>내 작업 하나 고르기</strong><p>지금 준비 중인 단계 → 도움받을 작업 → 필요한 기능·도구 후보 → 제공할 자료 → 결과 확인 기준을 적어보세요. 작성 공간의 기존 메모에 이어서 정리할 수 있습니다.</p></div><div class="next-action">${lessonButton('활용 예시 살펴보기','example')}${lessonButton('내 준비 메모하기','write')}</div>`;
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
    if(selectedTab==='guide')el.innerHTML=`<div class="lesson-lead"><span class="eyebrow">AI 초안을 나의 언어로 완성하기</span><h3>AI가 만든 문장은 그대로 쓰지 말고, 내 말투로 마무리하세요.</h3><p>자기소개서, 기업 분석, 면접 답변 스크립트까지 나만의 지침으로 만든 결과물에도 기계적인 표현이 남을 수 있습니다. 지침으로 내용과 형식을 정리했다면, 마지막에는 평소 내가 쓰는 말과 문장으로 다듬는 작업이 필요합니다.</p><p>먼저 상투적인 연결어 반복, 비슷한 문장 길이, 감정 없이 나열한 구성을 살펴보고 수정할 이유를 정리하세요. 그다음 평소 어조·자주 쓰는 단어·피할 표현을 알려 주어 내 말투로 다시 쓰도록 요청합니다. 직접 쓴 글이 있다면 짧은 문체 예시로 함께 제공할 수 있습니다.</p><p>목적에 맞는 도구 선택 → 나만의 지침 설계 → 내 말투로 마무리하기의 세 단계를 거쳐 결과물을 완성하세요. 수정 과정에서도 실제 경험과 수치는 바꾸지 않고, 마지막 문장은 직접 읽어 확인합니다.</p></div><ol class="instruction-list"><li><strong>Step 1. 표현 살펴보기</strong><p>초안에서 어색하거나 획일적인 표현을 찾고 이유를 정리합니다. 문체만으로 AI 작성 여부를 확정하는 검사는 아닙니다.</p></li><li><strong>Step 2. 내 말투로 다듬기</strong><p>평소 어조·자주 쓰는 말·피할 표현을 반영해 수정합니다. 구체적인 요청문은 예시 살펴보기에서 확인하세요.</p></li></ol><div class="next-action">${lessonButton('2단계 요청 예시 살펴보기','example')}${lessonButton('내 초안 다듬기','write')}</div>`;
    else{const d=worksheetData(id);el.innerHTML=`<h3>내가 설명할 수 있는 문장으로 완성해 보세요.</h3><p>AI 원문 보관 → 문제 표현·이유·수정 방향 → 실제 행동·결과와 근거 → 내 말로 쓴 수정본 순서로 작성하세요. 네 칸의 입력 예시와 ‘예시 비교’는 하나의 API 협업 사례로 이어집니다. 네 칸을 채우고 마지막 점검 3개를 확인하면 완료할 수 있습니다.</p><div class="worksheet-grid revision-grid">${Workbook.revisionFields.map((f,i)=>renderField(id,f,i)).join('')}</div><fieldset class="final-checks"><legend>마지막 점검</legend><p>수정본이 문항에 답하는지, 요구한 형식·분량을 지켰는지도 확인하세요.</p>${Workbook.checks.map(([key,label])=>`<label><input type="checkbox" data-review="${key}" ${d[key]?'checked':''}>${label}</label>`).join('')}</fieldset><div class="output-actions"><button class="primary" id="copy-revision">수정한 문장 복사</button><span class="tiny" id="worksheet-status" role="status">${storageOK?'이 브라우저에 자동 저장':'저장 불가 · 내려받기로 보관하세요'}</span></div>`;bindWorksheetFields(id);document.querySelectorAll('[data-review]').forEach(input=>input.onchange=e=>saveWorksheet(id,e.target.dataset.review,e.target.checked));document.querySelector('#copy-revision').onclick=()=>copyText(worksheetData(id).revised||'',document.querySelector('#field-revised'));}
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

// Keep copy actions attached to the input they copy, including optional records.
function attachAICopyControls(){
  if(!currentStep?.id.startsWith('0-')||selectedTab!=='write')return;
  const panel=document.querySelector('#tab-content');
  const existing={'note':'copy-note','prompt-output':'copy-prompt','saved-prompt':'copy-saved-prompt','field-revised':'copy-revision','analysis-record':'copy-career-record'};
  panel.querySelectorAll('textarea').forEach(input=>{
    if(input.parentElement?.classList.contains('input-copy'))return;
    const wrapper=document.createElement('div');wrapper.className='input-copy';
    input.before(wrapper);wrapper.appendChild(input);
    let button=existing[input.id]?document.getElementById(existing[input.id]):null;
    if(!button){button=document.createElement('button');button.type='button';button.className='secondary';}
    button.classList.add('input-copy-button');button.textContent='복사하기';
    const label=document.querySelector(`label[for="${input.id}"]`)?.textContent||'입력 내용';
    button.setAttribute('aria-label',`${label.trim()} 복사하기`);
    button.onclick=()=>copyText(input.value,input);wrapper.appendChild(button);
  });
  panel.querySelectorAll('[data-copy-practice-field], #copy-career-final').forEach(button=>button.remove());
}
function updateMemoCompletion(){
  if(currentStep?.id!=='0-0')return;
  const complete=document.querySelector('#complete');if(!complete)return;
  complete.disabled=!String(state.notes['0-0']||'').trim();
  complete.title=complete.disabled?'작성 공간의 나의 메모를 먼저 입력해 주세요.':'';
}
