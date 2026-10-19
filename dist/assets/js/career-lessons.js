'use strict';
function renderCareerPreparation(lesson){
  if(lesson.externalPractice){const {tool,url,help,result}=lesson.externalPractice;return `<div class="tip-box"><strong>${esc(tool)} 실습 안내·기록</strong><p>아래에서 준비 자료와 요청문을 작성한 뒤 외부 도구에서 직접 실행하고 돌아와 기록하세요. 이 단계의 완료는 작성 기록을 검토했다는 뜻입니다. ${esc(result)} 여부는 별도로 남기고, 실행 전이면 미실행·미수신으로 적으세요.</p><p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(tool)} 열기 · 새 탭 ↗</a>${help?` · <a href="${esc(help)}" target="_blank" rel="noopener noreferrer">공식 사용 안내 · 새 탭 ↗</a>`:''}</p></div>`;}

  if(lesson.practiceTool)return `<div class="tip-box"><strong>${esc(lesson.practiceTool)} 모의 면접 준비·기록</strong><p>이 단계의 완료는 준비 계획과 작성 기록을 검토했다는 뜻입니다. 실제 진행·녹음·촬영·업로드·리포트 수신 여부는 별도로 기록하세요. 아직 하지 않았다면 미실행·미수신으로 남기고 결과를 채우지 마세요.</p></div>`;
  return lesson.preparationOnly?`<div class="tip-box"><strong>${esc(lesson.preparationOnly)} 제작용 준비안</strong><p>이 단계의 완료는 원고와 점검 계획을 검토했다는 뜻입니다. 실제 파일 제작·페이지 생성·게시·공유 상태는 별도로 기록하세요.</p></div>`:'';
}
function renderCareerExtras(lesson){
  let html='';
  if(lesson.referenceTable){const {caption,headers,rows}=lesson.referenceTable;html+=`<section class="skill-reference"><table class="skill-example"><caption>${esc(caption)}</caption><thead><tr>${headers.map(label=>`<th scope="col">${esc(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((value,i)=>i?`<td data-label="${esc(headers[i])}">${esc(value)}</td>`:`<th scope="row">${esc(value)}</th>`).join('')}</tr>`).join('')}</tbody></table></section>`;}
  if(lesson.comparisonExample){const {title,before,after,scope}=lesson.comparisonExample;html+=`<figure class="skill-reference"><figcaption><strong>${esc(title)}</strong></figcaption><dl class="metric-comparison"><div><dt>수정 전</dt><dd>${esc(before)}</dd></div><div><dt>수정 후</dt><dd>${esc(after)}</dd></div></dl><p>${esc(scope)}</p></figure>`;}
  return html;
}
function renderCareerSkillReference(lesson,example=false){
  if(!lesson.skillRubric)return '';
  const scale=(value,symbol,empty)=>value===null?'미확인':`${symbol.repeat(value)}${empty.repeat(5-value)} ${value}/5`;
  if(example)return `<section class="skill-reference"><h3>중요도와 숙련도를 구분한 표시 예시</h3><p>별은 직무 중요도에 대한 내 판단, 막대는 행동 기준에 따른 숙련도입니다. 숫자·단계·이유를 함께 읽으세요. 공인 점수나 백분율이 아닙니다.</p><table class="skill-example"><caption>가상 기술 스택 · 실제 사용 범위에 한정한 자기평가</caption><thead><tr><th scope="col">기술·구분</th><th scope="col">직무 중요도</th><th scope="col">숙련도</th><th scope="col">판단 이유·한계</th></tr></thead><tbody>${lesson.skillExample.map(([name,importance,level,reason])=>`<tr><th scope="row">${esc(name)}</th><td data-label="직무 중요도">${scale(importance,'★','☆')}</td><td data-label="숙련도">${scale(level,'■','□')}${level===null?'':` · ${esc(lesson.skillRubric[level-1][0])}`}</td><td data-label="판단 이유·한계">${esc(reason)}</td></tr>`).join('')}</tbody></table></section>`;
  return `<section class="skill-reference"><h3>숙련도 판단 기준 · 1–5단계</h3><ol>${lesson.skillRubric.map(([name,description],i)=>`<li><strong>${i+1}/5 · ${esc(name)}</strong><p>${esc(description)}</p></li>`).join('')}</ol><p><strong>미확인</strong>은 판단 근거가 부족한 상태입니다. 기초나 초급으로 바꾸지 말고 확인할 자료를 남기세요. 중요도는 공고 관련성에 대한 별도 판단입니다.</p></section>`;
}
function renderCareerChecklist(lesson,data){
  if(!lesson.checklist)return '';
  const groups=[...new Set(lesson.checklist.map(([, ,group])=>group))];
  return `<section class="career-checklist"><h3>최종 점검 ${lesson.checklist.length}개 항목</h3><p>최종 글과 자료를 직접 대조해 하나씩 확인하세요. 문항에 해당하지 않는 세부 요구는 적용 여부를 판단하고 ‘수정·재확인 기록’에 이유를 남기세요.</p>${data?'<p id="career-check-count" class="tiny" role="status"></p>':''}${groups.map(group=>`<fieldset class="final-checks"><legend>${esc(group)}</legend>${lesson.checklist.filter(([, ,g])=>g===group).map(([key,label,,help])=>data?`<label><input type="checkbox" data-career-check="${key}" ${data[key]==='confirmed'?'checked':''}><span><strong>${esc(label)}</strong><br><span class="tiny">${esc(help)}</span></span></label>`:`<p><strong>${esc(label)}</strong> · ${esc(help)}</p>`).join('')}</fieldset>`).join('')}</section>`;
}
function careerReferences(lesson){
  return lesson.refs.map(id=>{const step=allSteps.find(s=>s.id===id);if(!step)return '';const course=COURSES.find(c=>c.steps.some(s=>s.id===id));const text=recordText(step);return `<details class="prompt-reference"><summary>${esc(step.title)} · 내 기록 참고</summary><p>읽기 전용 참고입니다. 필요한 근거를 골라 아래에 직접 옮기세요.</p>${text?`<pre class="company-reference-text">${esc(text)}</pre>`:'<p>아직 작성한 기록이 없습니다.</p>'}<a href="#course/${course.id}/${course.steps.findIndex(s=>s.id===id)}/write">이 기록 작성하기 →</a></details>`;}).join('');
}
function renderPracticeFlow(lesson,example=false){
  return lesson.practiceFlow.map(group=>`<section class="practice-form"><h3>${esc(group.title)}</h3>${example?`<dl class="example-fields">${group.keys.map(key=>{const [,label,help,value]=lesson.fields.find(f=>f[0]===key);return `<div><dt>${esc(label)}</dt><dd>${formatExampleText(value)}</dd></div>`;}).join('')}</dl>`:`<div class="worksheet-grid">${group.keys.map((key,i)=>renderField(currentStep.id,lesson.fields.find(f=>f[0]===key),i)).join('')}</div>`}${group.after?`<p class="practice-action">${esc(group.after)}</p>`:''}</section>`).join('');
}
function renderPracticeLesson(lesson){
  const id=currentStep.id,el=document.querySelector('#tab-content');
  const intro=`<div class="lesson-lead"><h3>${esc(lesson.lead)}</h3></div>`;
  const tools=`<div class="tip-box"><a class="text-button" href="${esc(lesson.externalPractice.url)}" target="_blank" rel="noopener noreferrer">${esc(lesson.externalPractice.tool)} 열기 ↗</a><p>여기서는 외부 도구에 입력할 내용을 준비하고 복사합니다. 실행한 결과를 돌아와 보관하는 것은 선택 사항입니다.</p></div>`;
  const samples=lesson.promptExamples||[];
  const inlineSamples=id==='0-3'?[]:samples;
  if(selectedTab==='guide'){
    el.innerHTML=`${intro}<ol class="instruction-list">${lesson.steps.map(([title,body])=>`<li><strong>${esc(title)}</strong><p>${esc(body)}</p></li>`).join('')}</ol>${inlineSamples.length?`<h3>바로 사용할 요청문</h3>${renderPromptSamples(inlineSamples)}`:''}${tools}<div class="next-action">${lessonButton('실습 예시 살펴보기','example')}${lessonButton('내 실습 내용 작성하기','write')}</div>`;
  }else if(selectedTab==='example'){
    el.innerHTML=`${intro}<p>외부 도구의 입력 순서에 맞춘 연습용 예시입니다. 내 자료로 바꾸어 사용하세요.</p>${renderPracticeFlow(lesson,true)}${id==='0-4'?renderCareerExtras(lesson):''}${inlineSamples.length?`<h3>이어서 요청하기</h3>${renderPromptSamples(inlineSamples)}`:''}<div class="next-action">${lessonButton('내 실습 내용 작성하기','write')}</div>`;
  }else{
    const data=worksheetData(id),optional=lesson.fields.filter(f=>f[4]&&f[0]!=='original'&&!(id==='0-3'&&f[0]==='draft'));
    el.innerHTML=`${intro}${tools}<p id="worksheet-status" class="tiny" role="status">${storageOK?'이 브라우저에 자동 저장':'저장 불가 · 내려받기로 보관하세요'}</p><span id="filled-count" class="badge"></span>${renderPracticeFlow(lesson)}${id==='0-3'?`<section class="practice-form"><h3>3. 프로젝트 안에서 스크립트 요청하기</h3><p>Claude의 프로젝트 대화에 아래 요청문을 붙여 넣으세요. 내 문항과 필요한 분량에 맞게 수정할 수 있습니다.</p>${renderPromptSamples(samples)}${renderField(id,lesson.fields.find(f=>f[0]==='draft'),0)}</section>`:''}<div class="practice-copy-actions">${lesson.copyFields.map(([key,label])=>`<button type="button" class="primary" data-copy-practice-field="${key}">${esc(label)}</button>`).join('')}</div><details class="prompt-reference practice-results"><summary>실행한 결과 가져와 기록하기 · 선택</summary><p>외부에서 실제 답변·차트·리포트를 받은 뒤 보관하고 싶을 때만 작성하세요. 실행하지 않았다면 비워 두어도 됩니다.</p><div class="worksheet-grid">${optional.map((f,i)=>renderField(id,f,i)).join('')}${renderField(id,lesson.fields.find(f=>f[0]==='original'),optional.length)}</div></details><details class="prompt-reference"><summary>추가 요청문 편집·기존 요청문 확인 · 선택</summary>${renderPromptEditor().replace('id="worksheet-status"','id="prompt-save-status"')}</details><fieldset class="final-checks"><legend>완료 전 확인</legend><label><input type="checkbox" id="career-review" ${data.review==='confirmed'?'checked':''}>${esc(lesson.review)}</label><p class="tiny">완료 표시는 입력 내용을 검토한 기록입니다. 외부 도구의 실행 여부는 별도로 남길 수 있습니다.</p></fieldset><section class="output-panel"><h3>내 실습 기록</h3><label class="sr-only" for="analysis-record">실습 기록 미리보기</label><textarea id="analysis-record" rows="8" readonly></textarea><div class="output-actions"><button type="button" class="secondary" id="copy-career-record">기록 복사</button><button type="button" class="secondary" id="copy-career-final">${esc(lesson.finalTextLabel)}</button></div></section><details class="legacy-note"><summary>자유 메모·기존 기록</summary><label class="note-label" for="previous-note">추가 메모</label><textarea id="previous-note">${esc(state.notes[id]||'')}</textarea></details>`;
    bindPromptEditor(id);
    document.querySelectorAll('[data-copy-practice-field]').forEach(button=>button.onclick=()=>copyText(worksheetData(id)[button.dataset.copyPracticeField]||'',document.querySelector('#field-'+button.dataset.copyPracticeField)));
    document.querySelector('#career-review').onchange=e=>{saveWorksheet(id,'review',e.target.checked?'confirmed':'');updatePromptPreview(id);};
    document.querySelector('#copy-career-record').onclick=()=>copyText(Workbook.exportText(id,worksheetData(id)),document.querySelector('#analysis-record'));
    document.querySelector('#copy-career-final').onclick=()=>copyText(worksheetData(id)[lesson.finalTextKey]||'',document.querySelector('#field-'+lesson.finalTextKey));
    document.querySelector('#previous-note').oninput=e=>{state.notes[id]=e.target.value;save();};
  }
  bindLessonButtons();bindPromptSamples(samples);return true;
}
function renderCareerLesson(){
  const id=currentStep.id,lesson=CareerLessons.lessons[id],el=document.querySelector('#tab-content');
  if(lesson.practiceFlow)return renderPracticeLesson(lesson);
  const fields=lesson.fields.filter(f=>!['original','review'].includes(f[0])&&!lesson.checklist?.some(([key])=>key===f[0]));
  if(selectedTab==='guide')el.innerHTML=`${renderCareerPreparation(lesson)}<div class="lesson-lead"><span class="eyebrow">${esc(currentStep.group)}</span><h3>${esc(lesson.lead)}</h3></div><ol class="instruction-list">${lesson.steps.map(([title,body])=>`<li><strong>${esc(title)}</strong><p>${esc(body)}</p></li>`).join('')}</ol>${renderCareerSkillReference(lesson)}${renderCareerExtras(lesson)}${renderCareerChecklist(lesson)}<div class="check-note"><strong>이 단계에서 남길 것</strong><p>${fields.filter(f=>!f[4]).map(f=>esc(f[1])).join(' · ')}</p></div><div class="next-action">${lessonButton('작성 예시 살펴보기','example')}</div>`;
  else if(selectedTab==='example')el.innerHTML=`${renderCareerPreparation(lesson)}<h3>막연한 표현을 실제 행동과 근거로 바꾸세요.</h3><div class="tip-box">학습용 가상 사례입니다. 실제 기업 정보나 사용자 경험이 아니며 입력칸에 자동으로 넣지 않습니다.</div><div class="weak-prompt"><span class="eyebrow">피할 표현</span><p>${esc(lesson.weak||'저는 뛰어난 역량을 갖췄으며 모든 요구를 충족합니다. 자세한 근거는 없습니다.')}</p></div><dl class="example-fields">${fields.map(([key,label,help,example],i)=>`<div><dt><span>${i+1}</span>${esc(label)}</dt><dd>${formatExampleText(example)}<p class="tiny">${esc(help)}</p></dd></div>`).join('')}</dl>${renderCareerSkillReference(lesson,true)}${renderCareerExtras(lesson)}${renderCareerChecklist(lesson)}<div class="adapt-note"><strong>내 자료에 적용하기</strong><p>예시의 기업·기술·결과를 내 정보로 바꾸세요. 아직 확인할 수 없는 항목은 미확인 이유와 다음 확인 행동을 적으세요.</p></div>${lessonButton('내 내용 작성하기','write')}`;
  else{
    const data=worksheetData(id);
    el.innerHTML=`${renderCareerPreparation(lesson)}<div class="worksheet-heading"><div><h3>${esc(lesson.lead)}</h3><p>필수 항목을 작성하고 최종 확인 후 완료하세요. 입력 내용은 현재 브라우저에 자동 저장됩니다.</p></div><span class="badge" id="filled-count"></span></div><p id="worksheet-status" class="tiny" role="status">${storageOK?'이 브라우저에 자동 저장':'저장 불가 · 내려받기로 보관하세요'}</p>${careerReferences(lesson)}<div class="worksheet-grid">${fields.map((f,i)=>renderField(id,f,i)).join('')}</div><details class="prompt-reference"><summary>AI 도움받기 · 요청문과 답변 보관 (선택)</summary><p>입력한 자료를 요청문으로 조합합니다. 복사 후 선택한 외부 도구에서 직접 실행하세요. 답변 없이 직접 작성해도 완료할 수 있습니다.</p>${renderPromptEditor().replace('id="worksheet-status"','id="prompt-save-status"')}${renderField(id,lesson.fields.find(f=>f[0]==='original'),fields.length)}</details>${renderCareerChecklist(lesson,data)}<fieldset class="final-checks"><legend>완료 전 확인</legend><label><input type="checkbox" id="career-review" ${data.review==='confirmed'?'checked':''}>${esc(lesson.review)}</label><p class="tiny">작성 내용이나 요청문을 수정하면 확인 표시가 해제됩니다.</p></fieldset><section class="output-panel"><div class="output-heading"><h3>이 단계의 작성 기록</h3></div><label class="sr-only" for="analysis-record">작성 기록 미리보기</label><textarea id="analysis-record" rows="10" readonly></textarea><div class="output-actions"><button class="secondary" type="button" id="copy-career-record">기록 복사</button>${lesson.finalTextKey?`<button class="primary" type="button" id="copy-career-final">${esc(lesson.finalTextLabel||'수정본만 복사')}</button>`:''}</div></section><details class="legacy-note"><summary>이 단계의 자유 메모</summary><label class="note-label" for="previous-note">추가 메모 · 기존 메모 확인</label><textarea id="previous-note" rows="5">${esc(state.notes[id]||'')}</textarea></details><div class="next-action"><a class="secondary" href="#notes">내 기록 모아보기 →</a></div>`;
    bindPromptEditor(id);
    document.querySelectorAll('[data-career-check]').forEach(input=>input.onchange=e=>{saveWorksheet(id,e.target.dataset.careerCheck,e.target.checked?'confirmed':'');updatePromptPreview(id);});
    document.querySelector('#career-review').onchange=e=>{saveWorksheet(id,'review',e.target.checked?'confirmed':'');updatePromptPreview(id);};
    document.querySelector('#copy-career-record').onclick=()=>copyText(Workbook.exportText(id,worksheetData(id)),document.querySelector('#analysis-record'));
    if(lesson.finalTextKey)document.querySelector('#copy-career-final').onclick=()=>copyText(worksheetData(id)[lesson.finalTextKey]||'',document.querySelector('#field-'+lesson.finalTextKey));
    document.querySelector('#previous-note').oninput=e=>{state.notes[id]=e.target.value;save();};
  }
  bindLessonButtons();return true;
}
