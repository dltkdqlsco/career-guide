'use strict';
const courses = window.COURSES;
const icons = ['✳','▤','✎','▧','☏'];
const descriptions = ['AI를 이해하고, 나에게 맞게 활용하는 첫 단계','기업과 직무를 이해하며 지원의 방향 찾기','나의 경험을 설득력 있는 문장으로 정리하기','프로젝트 속 나의 역할과 강점을 보여주기','내 이야기로 답하고, 실전처럼 준비하기'];
const storageKey = 'one-step-career-workbook-v1';
const allSteps = courses.flatMap(c => c.steps);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state = {notes:{},done:{},worksheets:{},last:null};
let storageOK = true;
let persistedSnapshot = null;
try { persistedSnapshot=localStorage.getItem(storageKey);const s = JSON.parse(persistedSnapshot); if(s && typeof s === 'object'){state.notes=s.notes&&typeof s.notes==='object'?s.notes:{};state.done=s.done&&typeof s.done==='object'?s.done:{};state.last=typeof s.last==='string'?s.last:null;state.worksheets=Workbook.clean(s.worksheets);} } catch {storageOK=false;}
let selectedTab = 'guide';
let currentCourse = null;
let currentStep = null;
let activePage = null;
let activeNav = null;
let renderedTab = null;
const tabPanels = new Map();
let pendingNavigationPosition=null;
let toastTimer;
const $ = s => document.querySelector(s);
function setText(selector,value){const el=$(selector);if(el&&el.textContent!==value)el.textContent=value;}
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2700);}
function save(){try{const text=JSON.stringify(state);localStorage.setItem(storageKey,text);persistedSnapshot=text;storageOK=true;setText('#save-status','● 이 기기에 저장됨');}catch{storageOK=false;setText('#save-status','저장 불가 · 메모 내려받기');notify('브라우저 저장이 불가능합니다. 메모를 내려받아 보관해 주세요.');}}
function recordText(s){const parts=[];const form=Workbook.exportText(s.id,state.worksheets[s.id]||{});if(form)parts.push(form);const note=state.notes[s.id];if(typeof note==='string'&&note.trim())parts.push('[자유 메모]\n'+note);return parts.join('\n\n');}
function completed(c){return c.steps.filter(s=>state.done[s.id]===true).length;}
function totalDone(){return allSteps.filter(s=>state.done[s.id]===true).length;}
function progress(c){return Math.round(completed(c)/c.steps.length*100);}
function validLast(){return RecordBackup.validRoute(state.last)?state.last:'#course/ai/0';}
function nav(active){
  if(activeNav===active)return;
  if(activeNav===null)$('#nav').innerHTML=`<a class="nav-item" data-nav="home" href="#home"><span class="nav-icon">⌂</span>전체 가이드</a><div class="nav-divider"></div>${courses.map((c,i)=>`<a class="nav-item" data-nav="${c.id}" href="#course/${c.id}/0"><span class="nav-icon">${icons[i]}</span>${esc(c.name)}<span class="nav-number">0${i+1}</span></a>`).join('')}<div class="nav-divider"></div><a class="nav-item" data-nav="find" href="#find"><span class="nav-icon" aria-hidden="true">⌕</span>단계 찾기</a><a class="nav-item" data-nav="notes" href="#notes"><span class="nav-icon">▱</span>내 메모</a>`;
  document.querySelectorAll('[data-nav]').forEach(link=>{
    const selected=link.dataset.nav===active;
    link.classList.toggle('active',selected);
    if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
  activeNav=active;
}
function art(){return '<div class="hero-art" aria-hidden="true"><div class="art-ring"></div><div class="paper"><div class="paper-check">✓</div><div class="paper-line"></div><div class="paper-line short"></div><div class="paper-line"></div></div><span class="art-sticker">↗</span><span class="art-star">✳</span></div>';}
function home(){nav('home');$('#breadcrumb').innerHTML='나의 워크스페이스 <span>/</span> 전체 가이드';const done=totalDone(),pct=Math.round(done/allSteps.length*100);const notes=allSteps.filter(s=>recordText(s).trim()).length;
$('#main').innerHTML=`<div class="page-heading"><div><div class="eyebrow">YOUR NEXT CHAPTER</div><h1>취업 준비, 한 걸음씩.</h1><p class="sub">막막했던 준비를 작은 단계로. 나만의 이야기로 완성해 보세요.</p></div><span class="date-pill">나의 속도로 만드는 다음 시작</span></div>
<section class="hero"><div><div class="eyebrow">LEARN · WRITE · GROW</div><h2>읽고, 써보고,<br>나의 것으로 만드는 시간.</h2><p>설명부터 예시, 직접 작성까지.<br>필요한 가이드를 골라 한 단계씩 따라가 보세요.</p><a class="primary" href="${validLast()}">${state.last?'이어서 준비하기':'첫 번째 가이드 시작하기'} <span>→</span></a></div>${art()}</section>
<section class="local-mode-notice" aria-label="현재 사용 방식"><span class="badge">AI API 미연결</span><div><strong>이곳은 직접 작성하는 로컬 워크북입니다.</strong><p>설명·예시를 읽고 프롬프트를 조합한 뒤, AI 실행은 외부 도구에서 직접 진행하세요. 입력 내용과 메모는 자동 전송되지 않으며, 현재 브라우저에 저장됩니다.</p><a class="text-button" href="#course/ai/1/write">내 프롬프트 작성하기 →</a></div></section>
${renderFinderEntry()}
<div class="home-columns"><section><div class="section-heading"><h2>나의 준비 가이드</h2><small>5개의 가이드 · ${allSteps.length}개의 단계</small></div><div class="course-list">${courses.map((c,i)=>`<a class="course-card" href="#course/${c.id}/0"><span class="course-icon c${i}">${icons[i]}</span><div class="course-copy"><span class="label">GUIDE 0${i+1}</span><h3>${esc(c.title)}</h3><p>${descriptions[i]}</p></div><div class="course-meta">${c.steps.length}개 단계<span class="arrow">→</span>${completed(c)?`${completed(c)}개 완료`:''}</div></a>`).join('')}</div></section>
<aside class="home-aside"><section class="panel"><h3>나의 준비 현황</h3><div class="progress-ring" style="--progress:${pct}%"><div class="ring-text">${pct}<span style="font-size:13px">%</span><small>전체 진행률</small></div></div><div class="progress-detail"><span>완료한 단계</span><strong>${done} / ${allSteps.length}</strong></div><div class="progress-detail"><span>작성한 메모</span><strong>${notes}개</strong></div><div class="fine-divider"></div><p class="tiny">학습하고 완료 표시한 단계가<br>진행률에 반영됩니다.</p></section><section class="panel note-panel"><div class="eyebrow">A LITTLE REMINDER</div><h3>완벽한 문장보다<br>나만의 경험부터.</h3><p>떠오르는 생각을 메모해 두세요.<br>작은 기록이 다음 단계의<br>좋은 출발점이 됩니다.</p><a class="text-button" href="#notes">내 메모 살펴보기 ↗</a></section></aside></div>
<div class="review-banner"><span>ⓘ</span><div><strong>${courses.length}개 가이드의 ${allSteps.filter(step=>Workbook.has(step.id)).length}개 단계를 사용할 수 있어요.</strong> 설명·비교 예시·작성 양식을 따라 준비하세요. 내 자료와 경험을 정리하고, 확인한 근거로 자기소개서와 면접을 준비하세요.</div></div>`;bindFinderEntry();}
function courseView(c,index){
const reuseShell=currentCourse===c;
nav(c.id);const s=c.steps[index];currentCourse=c;currentStep=s;resetLessonTabs();
if(!reuseShell){
$('#breadcrumb').innerHTML=`전체 가이드 <span>/</span> ${esc(c.name)}`;const ci=courses.indexOf(c);let prevGroup='';
$('#main').innerHTML=`<a class="back-link" href="#home">← 전체 가이드로</a><div class="course-header"><div class="eyebrow">GUIDE 0${ci+1} · ${c.steps.length} STEPS</div><h1>${esc(c.title)}</h1><p class="sub">${descriptions[ci]}</p><div class="progress-track" role="progressbar" aria-label="가이드 진행률" aria-valuenow="${progress(c)}" aria-valuemin="0" aria-valuemax="100"><div style="width:${progress(c)}%"></div></div></div>
<label for="mobile-step" class="mobile-course-select" style="border:0;padding:0;margin-bottom:6px">단계 선택</label><select id="mobile-step" class="mobile-course-select">${c.steps.map((x,j)=>`<option value="${j}" ${j===index?'selected':''}>${j+1}. ${esc(x.group==='시작하기'?'':x.group+' · ')}${esc(x.title)}</option>`).join('')}</select>
<div class="course-layout"><details class="steps-panel"><summary><span class="steps-summary-title">세부 목차 펼쳐보기</span><span class="tiny">${index+1}번째 단계 · ${completed(c)} / ${c.steps.length} 완료</span></summary><nav class="step-grid" aria-label="가이드 세부 단계">${c.steps.map((x,j)=>{let group='';if(x.group!==prevGroup){prevGroup=x.group;if(x.group!=='시작하기')group=`<p class="step-group">${esc(x.group)}</p>`;}return `${group}<a class="step-item ${j===index?'active':''} ${state.done[x.id]?'done':''}" ${j===index?'aria-current="step"':''} href="#course/${c.id}/${j}"><span class="step-num">${state.done[x.id]?'✓':String(j+1).padStart(2,'0')}</span><span>${esc(x.title)}</span></a>`;}).join('')}</nav></details>
<section class="lesson" id="lesson-host" tabindex="-1" aria-label="현재 단계"></section></div>`;
$('#mobile-step').onchange=e=>navigateTo(`#course/${c.id}/${e.target.value}`);
}
// The course header and expanded table of contents stay mounted between steps.
$('#lesson-host').innerHTML=`<div class="lesson-card"><div class="lesson-badges"><span class="badge">STEP ${String(index+1).padStart(2,'0')}</span>${Workbook.has(s.id)?'<span class="badge">학습 · 작성 가능</span>':'<span class="badge pending">준비 중</span>'}${s.kind==='external'?'<span class="badge">외부 도구 실습</span>':''}</div><h2>${esc(s.title)}</h2>${s.group!=='시작하기'?`<p class="lesson-intro">${esc(s.group)}</p>`:''}<div class="tabs" role="tablist" aria-label="단계 내용"><button class="tab" role="tab" id="tab-guide" aria-controls="tab-content" data-tab="guide">${s.kind==='external'?'실습 안내':'핵심 설명'}</button><button class="tab" role="tab" id="tab-example" aria-controls="tab-content" data-tab="example">${s.kind==='external'?'실습 예시':'예시 살펴보기'}</button><button class="tab" role="tab" id="tab-write" aria-controls="tab-content" data-tab="write">${s.kind==='external'?'실습 기록':'작성 공간'}</button></div><div id="tab-content" class="tab-content" role="tabpanel"></div><label class="complete-control"><input id="complete" type="checkbox" ${state.done[s.id]?'checked':''}>${Workbook.has(s.id)?'내용을 확인하고 이 단계를 완료했어요':'내용을 확인하고 이 단계를 완료했어요'}</label></div><div class="lesson-controls"><button class="secondary" id="prev" ${index===0?'disabled':''}>← 이전 단계</button><span class="tiny">${index+1} / ${c.steps.length}</span><a class="primary" href="${index<c.steps.length-1?`#course/${c.id}/${index+1}`:'#home'}">${index<c.steps.length-1?'다음 단계':'전체 가이드'} →</a></div>`;
$('#mobile-step').value=String(index);
document.querySelectorAll('.step-item').forEach((item,j)=>{
  item.classList.toggle('active',j===index);
  if(j===index)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');
});
updateCourseProgress();
$('#prev').onclick=()=>{if(index>0)navigateTo(`#course/${c.id}/${index-1}`);};
$('#complete').onchange=e=>{if(e.target.checked&&Workbook.has(s.id)&&Workbook.worksheetIds.includes(s.id)){const problem=Workbook.validate(s.id,state.worksheets[s.id]||{});if(problem){e.target.checked=false;notify(problem);openLessonTab('write');return;}}state.done[s.id]=e.target.checked;save();updateCourseProgress();};
document.querySelectorAll('[data-tab]').forEach(b=>{
  b.onclick=()=>openLessonTab(b.dataset.tab);
  b.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const keys=['guide','example','write'];openLessonTab(keys[(keys.indexOf(b.dataset.tab)+(e.key==='ArrowRight'?1:2))%3]);}};
});
tabView();
}
function resetLessonTabs(){renderedTab=null;tabPanels.clear();}
function tabView(){
  if(!currentStep||renderedTab===selectedTab)return false;
  return Viewport.keep(renderLessonTab);
}
function renderLessonTab(){
  const c=currentCourse,s=currentStep,el=$('#tab-content');
  // Keep the actual nodes (including event handlers and expanded examples),
  // not an HTML snapshot. Only one panel is connected, so IDs remain unique.
  if(renderedTab)tabPanels.set(renderedTab,{
    nodes:Array.from(el.childNodes),
    inputs:Array.from(el.querySelectorAll('textarea'),input=>({input,top:input.scrollTop,left:input.scrollLeft,start:input.selectionStart,end:input.selectionEnd,direction:input.selectionDirection}))
  });
  const cached=tabPanels.get(selectedTab);
  el.replaceChildren(...(cached?cached.nodes:[]));
  renderedTab=selectedTab;
  document.querySelectorAll('[data-tab]').forEach(b=>{const active=b.dataset.tab===selectedTab;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;});
  el.setAttribute('aria-labelledby',`tab-${selectedTab}`);
  if(!cached)renderTabContent();
  else cached.inputs.forEach(({input,top,left,start,end,direction})=>{
    input.setSelectionRange(start,end,direction);
    input.scrollTop=top;input.scrollLeft=left;
  });
  const last=`#course/${c.id}/${c.steps.indexOf(s)}/${selectedTab}`;
  if(state.last!==last){state.last=last;save();}
  // A tab change is not a new page/history entry and must not fire hashchange.
  if(location.hash!==last){try{window.history.replaceState(null,'',last);}catch{/* Storage still remembers the tab when history is unavailable. */}}
  return true;
}
function renderTabContent(){const c=currentCourse,s=currentStep,el=$('#tab-content');
if(renderApprovedLesson())return;
const source=`<a class="source-link" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">관련 자료 열기 ↗</a>`;
if(selectedTab==='guide')el.innerHTML=`<div class="placeholder-icon">▤</div><h3>${s.kind==='external'?'외부에서 따라 할 수 있는 안내가 들어갑니다.':'이 단계의 핵심 설명이 들어갑니다.'}</h3><p>${s.kind==='external'?'사용할 도구와 준비할 자료, 실행 순서와 완료 기준을 준비하고 있습니다.':'핵심 설명과 작성 안내를 준비하고 있습니다. 작성 공간에 필요한 내용을 미리 메모해 두세요.'}</p>${source}`;
else if(selectedTab==='example')el.innerHTML=`<div class="placeholder-icon">◈</div><h3>${s.kind==='external'?'준비할 자료와 실행 순서를 확인합니다.':'예시를 읽고, 좋은 점을 짚어봅니다.'}</h3><p>${s.kind==='external'?'실습에 필요한 준비 자료와 사용 순서를 준비하고 있습니다.':'이 단계에 맞는 예시와 작성 포인트를 준비하고 있습니다.'}</p>${source}`;
else{el.innerHTML=`<h3>${s.kind==='external'?'실습하면서 떠오른 내용을 기록하세요.':'지금 떠오르는 생각부터 남겨두세요.'}</h3><p>${s.id==='0-0'?'지금 준비 중인 단계 → 도움받을 작업 → 필요한 기능·도구 후보 → 제공할 자료 → 결과 확인 기준을 메모해 보세요. 다음 단계에서 지침 프롬프트로 정리할 수 있어요.':`현재는 자유 메모를 사용할 수 있습니다.${s.kind==='external'?'':' 단계별 입력 양식은 준비 중입니다.'}`}</p><label class="note-label" for="note">나의 메모</label><textarea id="note" placeholder="기억하고 싶은 내용이나 내 경험을 편하게 적어보세요.">${esc(state.notes[s.id]||'')}</textarea><div class="textarea-meta"><span id="char-count">${String(state.notes[s.id]||'').length}자</span><span id="note-state">${storageOK?'이 브라우저에 자동 저장':'저장 불가 · 내려받기 권장'}</span></div><div style="margin-top:14px"><button class="secondary" id="copy-note">메모 복사하기</button></div>`;$('#note').oninput=e=>{state.notes[s.id]=e.target.value;save();setText('#char-count',e.target.value.length+'자');setText('#note-state',storageOK?'저장됨':'저장되지 않음 · 내려받기 권장');};$('#copy-note').onclick=()=>copyText($('#note').value,$('#note'));}}
function notesView(){nav('notes');$('#breadcrumb').innerHTML='나의 워크스페이스 <span>/</span> 내 메모';const records=courses.flatMap(c=>c.steps.filter(s=>recordText(s).trim()).map(s=>({c,s})));$('#main').innerHTML=`<div class="page-heading"><div><div class="eyebrow">YOUR OWN WORDS</div><h1>작은 기록, 나의 이야기.</h1><p class="sub">각 단계에서 작성한 메모를 한곳에서 확인하세요.</p></div><button class="secondary" id="download-notes">메모 내려받기 ↗</button></div>${records.length?`<div class="notes-list">${records.map(({c,s})=>`<article class="saved-note"><div class="eyebrow">${esc(c.name)}</div><h3>${esc(s.title)}</h3><p class="tiny">${esc(s.group)}</p><pre>${esc(recordText(s))}</pre><a class="text-button" href="#course/${c.id}/${c.steps.indexOf(s)}">이 단계에서 수정하기 →</a></article>`).join('')}</div>`:'<div class="empty-state"><div class="mini-plant">✳</div><h2>첫 번째 기록을 기다리고 있어요.</h2><p>가이드의 작성 공간에 메모를 남기면 이곳에 모입니다.</p><a class="primary" href="#course/ai/0">가이드 둘러보기 →</a></div>'}<div class="review-banner"><span>ⓘ</span><div>메모는 현재 기기의 브라우저에 저장됩니다. 다른 기기와 자동 동기화되지 않으니, 필요한 기록은 내려받아 보관하세요.</div></div>`;$('#download-notes').onclick=download;}
function download(){const lines=['# 나의 취업 준비 메모',''];for(const c of courses){const notes=c.steps.filter(s=>recordText(s).trim());if(!notes.length)continue;lines.push(`## ${c.title}`,'');for(const s of notes)lines.push(`### ${s.group!=='시작하기'?s.group+' / ':''}${s.title}`,'',recordText(s),'');}if(lines.length===2){notify('아직 내려받을 메모가 없습니다.');return;}const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/markdown;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='나의-취업준비-메모.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('메모 파일을 내려받았습니다.');}
function parseRoute(hash){
  const parts=hash.replace(/^#/,'').split('/');
  if(parts[0]==='course'){
    const c=courses.find(course=>course.id===parts[1]),index=Number(parts[2]||0);
    if(c&&Number.isInteger(index)&&c.steps[index])return {page:'course',course:c,index,tab:['guide','example','write'].includes(parts[3])?parts[3]:'guide',explicitTab:Boolean(parts[3])};
    return null;
  }
  return ['home','notes','backup','find'].includes(parts[0])?{page:parts[0]}:null;
}
function route(){return Viewport.keep(renderRoute);}
function renderRoute(){
  // Native skip links must not replace the current page with the home screen.
  if(location.hash==='#main'&&activePage!==null)return null;
  const next=parseRoute(location.hash)||{page:'home'};
  const sameCourse=next.page==='course'&&currentCourse===next.course;
  if(sameCourse&&currentStep===next.course.steps[next.index]){
    selectedTab=next.tab;
    return tabView()?$(`#tab-${selectedTab}`):null;
  }
  if(next.page!=='course'&&activePage===next.page)return null;
  clearBackupPreview();
  activePage=next.page;
  $('#backup-link').setAttribute('aria-current',next.page==='backup'?'page':'false');
  if(next.page==='course'){
    selectedTab=next.tab;
    courseView(next.course,next.index);
  }else{
    currentCourse=null;currentStep=null;selectedTab='guide';resetLessonTabs();
    if(next.page==='notes')notesView();
    else if(next.page==='backup')backupPage();
    else if(next.page==='find')finderView();
    else home();
  }
  document.title=(currentCourse?currentCourse.name+' — ':next.page==='backup'?'백업·복원 — ':next.page==='find'?'단계 찾기 — ':'')+'한 걸음 · 취업 준비 워크북';
  return sameCourse?$('#lesson-host'):$('#main');
}
function navigateTo(hash){
  if(!parseRoute(hash))return;
  const position=Viewport.capture();
  Viewport.keep(()=>{
    if(location.hash!==hash){
      try{window.history.pushState(null,'',hash);}
      catch{
        // Some local-file browsers restrict history writes. The hashchange
        // fallback must restore the position from BEFORE the native navigation.
        pendingNavigationPosition=position;location.hash=hash;return;
      }
    }
    const target=route();if(target)target.focus({preventScroll:true});
  },position);
}
document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[href]');
  if(!link){
    const summary=event.target.closest?.('summary');
    if(summary&&$('#main').contains(summary)&&summary.parentElement?.tagName==='DETAILS'){
      event.preventDefault();
      Viewport.keep(()=>{summary.parentElement.open=!summary.parentElement.open;summary.focus({preventScroll:true});});
    }
    return;
  }
  if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  const href=link.getAttribute('href');
  if(href==='#main'){
    event.preventDefault();$('#main').focus({preventScroll:true});$('#main').scrollIntoView({block:'start'});return;
  }
  if(!href?.startsWith('#'))return;
  const next=parseRoute(href);
  if(!next)return;
  const sameStep=next.page==='course'&&currentCourse===next.course&&currentStep===next.course.steps[next.index];
  event.preventDefault();
  if(sameStep){if(next.explicitTab)openLessonTab(next.tab);}
  else if(next.page==='course'||activePage!==next.page)navigateTo(href);
});
window.addEventListener('hashchange',()=>{
  const position=pendingNavigationPosition||Viewport.capture();pendingNavigationPosition=null;
  Viewport.keep(()=>{const target=route();if(target)target.focus({preventScroll:true});},position);
});
route();
if(!storageOK)$('#save-status').textContent='저장 불가 · 메모 내려받기';
