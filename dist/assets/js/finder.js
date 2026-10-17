'use strict';
// Search curriculum metadata only; user writing is used only to derive progress.
window.StepFinder = (() => {
  const catalog=window.COURSES.flatMap(course=>course.steps.map((step,index)=>({course,step,index})));
  const held=new Set();
  const statuses=['all','not-started','in-progress','done'];
  const labels={'not-started':'미작성','in-progress':'작성 중',done:'완료'};
  const compact=value=>String(value).normalize('NFKC').toLowerCase().replace(/\s+/g,'');
  const hasText=value=>typeof value==='string'&&Boolean(value.trim());
  function criteria(raw={}){
    return {
      query:typeof raw.query==='string'?raw.query.slice(0,120):'',
      course:window.COURSES.some(course=>course.id===raw.course)?raw.course:'all',
      status:statuses.includes(raw.status)?raw.status:'all',
      readyOnly:raw.readyOnly===true
    };
  }
  function progress(id,state={}){
    if(state.done?.[id]===true)return 'done';
    if(hasText(state.notes?.[id]))return 'in-progress';
    const sheet=state.worksheets?.[id]||{};
    if(id===Workbook.collectionId)return Workbook.sourceCards(sheet).some(card=>Workbook.sourceCardText(card).trim())?'in-progress':'not-started';
    if(id===Workbook.verificationId)return hasText(sheet.custom)||Workbook.verificationCards(sheet).some(card=>Workbook.verificationCardText(card).trim())?'in-progress':'not-started';
    const fields=Workbook.fields(id).filter(([key])=>!(window.CareerLessons?.lessons[id]&&(key==='review'||window.CareerLessons.lessons[id].checklist?.some(([check])=>check===key)))).map(([key])=>key);
    if(Workbook.isPrompt(id))fields.push('custom');
    return fields.some(key=>hasText(sheet[key]))?'in-progress':'not-started';
  }
  function availability(id){return Workbook.has(id)?'ready':held.has(id)?'held':'pending';}
  function search(raw={},state={}){
    const filters=criteria(raw);
    const words=filters.query.normalize('NFKC').trim().split(/\s+/).filter(Boolean).map(compact);
    return catalog.flatMap(item=>{
      if(filters.course!=='all'&&item.course.id!==filters.course)return [];
      const status=progress(item.step.id,state),access=availability(item.step.id);
      if(filters.status!=='all'&&status!==filters.status)return [];
      if(filters.readyOnly&&access!=='ready')return [];
      const haystack=compact([item.course.name,item.course.title,item.step.group,item.step.title].join(' '));
      if(!words.every(word=>haystack.includes(word)))return [];
      return [{...item,status,availability:access,href:`#course/${item.course.id}/${item.index}/${status==='in-progress'?'write':'guide'}`}];
    });
  }
  return {criteria,progress,availability,search,labels,total:catalog.length};
})();

// Search filters stay in this open page only, never in localStorage or backups.
let finderFilters=StepFinder.criteria();
function renderFinderEntry(){
  return `<section class="finder-entry" aria-labelledby="finder-entry-title"><div><h2 id="finder-entry-title">목차에서 바로 찾기</h2><p>45개 단계 중 지금 필요한 주제를 찾아보세요.</p></div><form id="home-finder-form" role="search" aria-label="목차 검색"><label class="sr-only" for="home-finder-query">목차 검색어</label><input id="home-finder-query" type="search" maxlength="120" autocomplete="off" placeholder="예: 지원 동기, 프롬프트" value="${esc(finderFilters.query)}"><button class="primary" type="submit">찾기 →</button></form><a class="text-button" href="#find">진행 상태로 찾아보기 →</a></section>`;
}
function bindFinderEntry(){
  let composing=false;
  $('#home-finder-query').oncompositionstart=()=>{composing=true;};
  $('#home-finder-query').oncompositionend=()=>{composing=false;};
  $('#home-finder-form').onsubmit=event=>{
    event.preventDefault();
    if(composing||event.isComposing)return;
    finderFilters=StepFinder.criteria({query:$('#home-finder-query').value});
    navigateTo('#find');
  };
}
function finderView(){
  nav('find');$('#breadcrumb').innerHTML='나의 워크스페이스 <span>/</span> 단계 찾기';
  finderFilters=StepFinder.criteria(finderFilters);
  const readyCount=StepFinder.search({readyOnly:true}).length;
  $('#main').innerHTML=`<div class="page-heading"><div><div class="eyebrow">FIND YOUR NEXT STEP</div><h1>지금 필요한 단계 찾기.</h1><p class="sub">목차를 검색하거나, 작성 중인 단계부터 이어가세요.</p></div><span class="badge">5개 가이드 · ${StepFinder.total}개 단계</span></div>
  <section class="finder-toolbar" aria-label="검색과 필터"><form id="finder-form" role="search" aria-label="목차 검색"><label for="finder-query">목차 검색</label><div class="finder-search-row"><input id="finder-query" type="search" maxlength="120" autocomplete="off" aria-describedby="finder-help" placeholder="예: 지원 동기, IT 기술, 면접 질문" value="${esc(finderFilters.query)}"><button type="submit" class="primary">검색</button></div></form>
  <div class="finder-filters"><div><label for="finder-course">가이드</label><select id="finder-course"><option value="all">전체 가이드</option>${courses.map(course=>`<option value="${course.id}" ${finderFilters.course===course.id?'selected':''}>${esc(course.name)}</option>`).join('')}</select></div><div><label for="finder-status">내 진행 상태</label><select id="finder-status">${[['all','전체 상태'],['not-started','미작성'],['in-progress','작성 중'],['done','완료']].map(([value,label])=>`<option value="${value}" ${finderFilters.status===value?'selected':''}>${label}</option>`).join('')}</select></div><label class="finder-ready"><input type="checkbox" id="finder-ready" ${finderFilters.readyOnly?'checked':''}>학습 가능한 단계만 <span class="tiny">현재 ${readyCount}개</span></label><button type="button" id="finder-reset" class="secondary">검색·필터 초기화</button></div>
  <p id="finder-help" class="finder-help">가이드명·섹션·목차 제목만 검색합니다. 메모 내용은 검색하지 않으며, 검색어는 저장하거나 외부로 보내지 않습니다.</p></section>
  <div class="finder-results-heading"><h2>찾은 단계</h2><p id="finder-count" role="status" aria-live="polite" aria-atomic="true"></p></div><p class="finder-legend">‘작성 중’은 메모나 입력한 글이 있고 아직 완료 표시하지 않은 단계입니다. 완료 표시는 작성 기록을 검토했다는 뜻입니다. 외부 도구의 실제 실행 여부는 각 단계에 별도로 기록하세요.</p><div id="finder-results"></div>`;
  const input=$('#finder-query');
  let composing=false;
  const search=()=>{finderFilters.query=input.value;renderFinderResults();};
  input.oncompositionstart=()=>{composing=true;};
  input.oncompositionend=()=>{composing=false;search();};
  input.oninput=event=>{if(!composing&&!event.isComposing)search();};
  input.onsearch=()=>{if(!composing)search();};
  input.onkeydown=event=>{if(event.key==='Escape'&&!composing&&!event.isComposing){event.preventDefault();input.value='';search();}};
  $('#finder-form').onsubmit=event=>{event.preventDefault();if(!composing&&!event.isComposing)search();};
  $('#finder-course').onchange=event=>{finderFilters.course=event.target.value;renderFinderResults();};
  $('#finder-status').onchange=event=>{finderFilters.status=event.target.value;renderFinderResults();};
  $('#finder-ready').onchange=event=>{finderFilters.readyOnly=event.target.checked;renderFinderResults();};
  $('#finder-reset').onclick=()=>{
    finderFilters=StepFinder.criteria();input.value='';$('#finder-course').value='all';$('#finder-status').value='all';$('#finder-ready').checked=false;
    renderFinderResults();input.focus({preventScroll:true});
  };
  renderFinderResults();
}
function renderFinderResults(){
  return Viewport.keep(updateFinderResults);
}
function updateFinderResults(){
  finderFilters=StepFinder.criteria(finderFilters);
  const results=StepFinder.search(finderFilters,state);
  $('#finder-count').textContent=`전체 ${StepFinder.total}개 중 ${results.length}개`;
  if(!results.length){
    $('#finder-results').innerHTML='<div class="empty-state finder-empty"><span class="placeholder-icon" aria-hidden="true">⌕</span><h2>검색 조건에 맞는 단계가 없어요.</h2><p>검색어를 짧게 바꾸거나 가이드·진행 상태 필터를 풀어보세요.<br>위의 ‘검색·필터 초기화’를 누르면 전체 목차로 돌아갑니다.</p></div>';
    return;
  }
  $('#finder-results').innerHTML=courses.map(course=>{
    const rows=results.filter(result=>result.course.id===course.id);
    if(!rows.length)return '';
    return `<section class="finder-group" aria-labelledby="finder-group-${course.id}"><div class="finder-group-heading"><h2 id="finder-group-${course.id}">${esc(course.name)}</h2><span>${rows.length}개 단계</span></div><ul class="finder-list">${rows.map(row=>`<li><a class="finder-result" href="${row.href}"><span class="finder-step-number">${String(row.index+1).padStart(2,'0')}</span><div class="finder-result-copy"><span class="finder-section">${esc(row.step.group)}</span><h3>${esc(row.step.title)}</h3><div class="finder-badges"><span class="badge progress-${row.status}">${StepFinder.labels[row.status]}</span><span class="badge ${row.availability==='ready'?'':'pending'}">${{ready:'학습 가능',pending:'준비 중',held:'진행 보류'}[row.availability]}</span></div></div><span class="finder-result-action">${row.status==='in-progress'?'이어서 작성':'단계 보기'} <span aria-hidden="true">→</span></span></a></li>`).join('')}</ul></section>`;
  }).join('');
}
