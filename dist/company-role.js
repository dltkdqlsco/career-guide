'use strict';
// PDF pp.15–16 structure; forms, fictional examples and evidence safeguards are supplementary.
window.CompanyRole=(()=>{
  const cases=[
    {title:'백엔드 · 공고 문구에서 키워드와 경험 후보 연결',weak:'백엔드 개발자는 확장성 전문가여야 하니, 내가 대규모 트래픽을 개선했다고 써줘.',data:{
      target:'다온테크 / 신입 백엔드 / 가상 공고 A / 주문 API 개발·운영 업무를 이해하려고 선택',
      posting:'학습용 가상 지원 공고 A / 보관 파일 A.html / 확인 2026-10-16 / 담당 업무 1항: 주문 API 개발·운영 / 자격 요건: Java 개발 및 SQL 활용 / 우대 사항: API 문서화 경험',
      experience:'팀 프로젝트에서 주문 API 구현과 SQL 쿼리 작성을 담당했다. API 명세를 작성했다. 실제 운영 트래픽과 성능 개선 수치는 측정하지 않았다.',
      comparison:'',
      original:'[학습용 가상 답변]\n공고는 API 개발·운영과 Java·SQL을 명시한다. 키워드 후보는 API 구현·데이터 처리와 API 문서화다. 직접 맡은 API 기능과 작성한 명세를 근거로 경험 연결을 검토할 수 있다. 운영 성능 성과는 미확인이다.',
      features:'관찰: 개발·운영을 담당 업무로 명시(A 담당 업무 1항), 문서화 경험을 우대로 제시(A 우대 사항). 해석: 코드뿐 아니라 기능 설명·협업 기록도 준비할 가치가 있음. 비교 공고 미제공으로 타사 대비 차별성은 미확인.',
      keyword1:'키워드: API 구현·데이터 처리\n원문 근거: A 담당 업무의 주문 API 개발·운영, 자격 요건의 Java·SQL\n역량 해석: API 기능 구현과 데이터 처리 방식을 설명할 수 있어야 함. 대규모 트래픽 처리 경험이 필수라는 근거는 없음.',
      keyword2:'키워드: API 문서화\n원문 근거: A 우대 사항의 API 문서화 경험\n역량 해석: API 사용법과 협업을 위한 문서 작성 경험을 보여줄 수 있음. 필수 조건은 아님.',
      experienceTypes:'필요한 경험 유형: 맡은 API 기능, SQL 사용 이유, 테스트 결과·코드·API 명세를 설명하는 경험. 운영 개선 성과를 주장하려면 별도 측정 근거가 필요함.',
      matches:'연결 후보: 직접 구현한 주문 API와 작성한 SQL·명세. 근거 자료: 해당 코드와 문서. 운영 성능 개선율이나 대규모 서비스 운영 경험은 제공되지 않았으므로 강점으로 쓰지 않음.',
      questions:'실제 운영 환경·트래픽·업무 비중은 공고에서 미확인. 공식 상세 설명 확인. 다음 자기분석에서 직접 한 역할과 산출물 위치를 정리.'
    },why:'업무·자격·우대의 원문을 키워드에 연결했고, 필요 경험과 실제 경험을 구분했습니다. 측정하지 않은 성과를 덧붙이지 않았습니다.'},
    {title:'고객 운영 · 경험 미제공과 경력직 참고의 한계',weak:'경력직 공고에 데이터 분석이 있으니 이 신입 공고도 SQL 전문가를 원하고, 나는 그런 인재라고 써줘.',data:{
      target:'모아서비스 / 신입 고객 운영 / 가상 공고 B / 문의 분류·안내 개선 업무를 알아보려고 선택',
      posting:'학습용 가상 지원 공고 B / 보관 파일 B.html / 확인 2026-10-16 / 담당 업무: 고객 문의 분류, 반복 문의 안내 개선, 유관 부서 협의. 자격·우대의 상세 조건은 제공된 발췌에 없음.',
      experience:'',
      comparison:'학습용 가상 참고 R / 모아서비스 고객 운영 경력직 / R.html / 확인 2026-10-16 / 자격: SQL 분석 경험. 지원 기업은 같지만 경력 수준·업무 범위가 다를 수 있어 신입 B의 필수 요건으로 옮기지 않음.',
      original:'',
      features:'관찰: 문의를 분류하고 반복 안내를 개선하는 업무(B 담당 업무). 해석: 문의를 구조화해 개선안을 전달하는 역량이 필요할 수 있음. 참고 R의 SQL 조건은 경력직에 명시된 것으로 신입 적용은 미확인.',
      keyword1:'키워드: 문의 구조화·개선 소통\n원문 근거: B의 문의 분류, 안내 개선, 유관 부서 협의\n역량 해석: 문의 유형을 정리하고 개선 필요를 관련 부서에 설명하는 능력. 실제 기업 내부 도구는 미확인.',
      keyword2:'',
      experienceTypes:'필요한 경험 유형: 문의를 유형별로 정리하거나 안내를 수정하고 관련자와 확인한 경험. 분류표·안내문·수정 전후 기록처럼 직접 한 일을 보여줄 자료.',
      matches:'실제 경험 미제공으로 아직 미연결. 다음 단계에서 활동·프로젝트 중 문의 정리나 설명 자료 개선을 직접 맡은 경험이 있는지 찾아본다.',
      questions:'신입 자격·우대 전체, 실제 분석 도구·업무 범위는 미확인. 공식 공고 전체를 확인. 참고 R의 SQL 경험을 신입 필수나 내 강점으로 단정하지 않음.'
    },why:'경력직 공고의 조건을 신입 필수 요건으로 바꾸지 않았습니다. 근거가 있는 키워드 하나만 남겼고, 실제 경험이 없을 때 연결을 만들어내지 않았습니다.'}
  ];
  return {cases};
})();
function roleGuide(){
  return `<div class="lesson-lead"><span class="eyebrow">타깃 직무 선택 및 분석</span><h3>공고의 업무에서 필요한 역량과 경험을 찾으세요.</h3><p>직무 하나를 선택한 뒤 주요 수행 업무와 필요 역량을 파악하고, 어떤 경험을 강조할 수 있을지 검토합니다. 직무명만으로 판단하기보다 공고 원문과 업무·역량의 연결 근거를 남기세요.</p></div><div class="stage-cards three"><article class="stage-card"><span class="stage-index">01</span><h3>공고 특징</h3><p>강조한 업무·특이한 문구·조건을 원문 위치와 함께 정리합니다. 다른 공고와의 차이는 실제 비교 자료가 있을 때만 판단하세요.</p></article><article class="stage-card"><span class="stage-index">02</span><h3>강점 키워드 1~2개</h3><p>공고의 업무 문구를 근거로 필요한 역량을 해석합니다. 키워드마다 원문과 연결 이유를 붙이세요. 아직 지원자 개인의 강점이 입증된 것은 아닙니다.</p></article><article class="stage-card"><span class="stage-index">03</span><h3>필요 경험 유형</h3><p>그 역량을 보여주려면 어떤 역할·행동·결과·산출물이 필요한지 구체화합니다. 내가 실제로 한 경험은 제공한 사실 안에서만 연결합니다.</p></article></div><h3>직접 분석하거나 외부 AI의 도움을 받으세요</h3><ol class="instruction-list"><li><strong>분석할 직무와 원문 선택</strong><p>7단계의 지원 공고를 참고해 기업·직무·채용 수준·선택 이유를 적고 필요한 원문을 직접 옮깁니다. 참고 공고는 별도로 표시하세요.</p></li><li><strong>요청문과 실제 자료 전달 · 선택</strong><p>외부 AI를 사용한다면 작성 공간에서 지침을 검토·복사하고 채용 공고 파일이나 원문을 함께 전달하세요. 경험 연결을 원하면 내가 실제로 한 역할과 근거도 제공합니다. 이 웹은 조합·복사만 지원합니다.</p></li><li><strong>답변 원문 보관과 직접 수정</strong><p>받은 답변은 선택적으로 보관하고, 공고 특징·키워드·경험 유형을 내 분석 칸에 정리하세요. 공고의 명시 내용과 내 해석, 지원 공고와 참고 공고를 구분합니다.</p></li><li><strong>연결 후보와 부족한 근거 남기기</strong><p>실제 경험을 제공하지 않았다면 미연결로 남깁니다. 다음 자기분석 단계에서 후보 경험의 역할·행동·결과를 더 구체적으로 정리할 수 있습니다.</p></li></ol><div class="next-action">${lessonButton('직무 분석 사례 보기','example')}</div>`;
}
function roleExamples(){
  return `<div class="gallery-heading"><h3>업무 문구와 경험의 근거를 연결하기</h3><span class="badge">2가지 비교 사례</span></div><div class="tip-box">기업·공고·경험·답변은 모두 학습용 가상 사례입니다. 내 입력값에 자동으로 넣지 않습니다.</div><div class="example-gallery">${CompanyRole.cases.map((item,i)=>exampleDetail(i,item.title,`<div class="weak-prompt"><span class="eyebrow">근거가 부족한 요청</span><p>${esc(item.weak)}</p></div><dl class="example-fields">${Workbook.fields(Workbook.roleId).map(([key,label],n)=>`<div><dt><span>${n+1}</span>${esc(label)}</dt><dd>${esc(item.data[key]||({experience:'미제공 · 경험 연결을 만들지 않음',comparison:'미제공 · 비교 우위를 단정하지 않음',original:'외부 AI 답변 없음 · 직접 분석',keyword2:'추가 근거가 없어 두 번째 키워드는 생략'}[key]||''))}</dd></div>`).join('')}</dl><details class="full-prompt"><summary>이 입력으로 조합한 요청문 보기</summary><pre class="company-reference-text">${esc(Workbook.compose(item.data,Workbook.roleId))}</pre></details><div class="adapt-note"><strong>무엇이 달라졌나요?</strong><p>${esc(item.why)}</p></div>${lessonButton('내 직무 분석 작성하기','write')}`)).join('')}</div>`;
}
function rolePostingReference(){
  const step=allSteps.find(item=>item.id===Workbook.postingId),text=recordText(step);
  return `<details class="prompt-reference"><summary>7단계 지원 공고·참고 공고 기록 보기 · 읽기 전용</summary><p>필요한 지원 공고 원문과 출처를 아래에 직접 옮기세요. 참고 공고의 내용은 비교 자료로 따로 구분합니다. 7단계 기록은 변경되지 않습니다.</p><pre class="company-reference-text">${esc(text||'아직 저장한 채용 공고 기록이 없습니다. 준비한 공고가 있다면 아래에서 바로 작성할 수 있습니다.')}</pre><a href="#course/company/6/write">7단계 공고 확인 기록 보기 →</a></details>`;
}
function renderCompanyRoleLesson(){
  const id=Workbook.roleId,el=document.querySelector('#tab-content');
  if(selectedTab==='guide')el.innerHTML=roleGuide();
  else if(selectedTab==='example')el.innerHTML=roleExamples();
  else{
    const fields=Workbook.fields(id),d=worksheetData(id);
    const section=(title,items,start)=>`<h3 class="analysis-section">${title}</h3><div class="worksheet-grid">${items.map((field,i)=>renderField(id,field,start+i)).join('')}</div>`;
    el.innerHTML=`<div class="worksheet-heading"><div><h3>선택한 직무의 업무·역량·경험을 연결하세요.</h3><p>작성 필수 7개 항목과 선택 4개 항목이 있습니다. 입력 내용은 이 브라우저에 자동 저장됩니다. 외부 AI를 쓰지 않아도 공고를 직접 읽고 분석을 작성할 수 있습니다.</p></div><span class="badge" id="filled-count"></span></div>${rolePostingReference()}${section('1. 직무 선택과 분석 자료 준비',fields.slice(0,4),0)}${renderPromptEditor()}<div class="tip-box">위 네 입력칸만 요청문에 조합합니다. 직접 수정한 요청문은 입력 변경으로 덮어쓰지 않습니다. 아래 답변과 내 분석을 제공 자료로 자동 사용하지 않습니다.</div><h3 class="analysis-section">2. 받은 답변 보관 · 외부 AI 사용 시 선택</h3>${renderField(id,fields[4],4)}${section('3. 공고의 특징과 핵심 키워드',fields.slice(5,8),5)}${section('4. 필요한 경험과 내 연결 후보',fields.slice(8),8)}<section class="output-panel"><h3>나의 직무 분석 기록</h3><label class="sr-only" for="analysis-record">요청문·답변 원문과 직접 작성한 직무 분석 기록</label><textarea id="analysis-record" rows="12" readonly>${esc(Workbook.exportText(id,d))}</textarea><div class="output-actions"><button class="primary" id="copy-role-record" type="button">직무 분석 기록 전체 복사</button><a class="secondary" href="#notes">내 기록 모아보기 →</a><a class="secondary" href="#backup">백업·복원 →</a></div></section><div class="check-note"><strong>완료하기 전에</strong><p>선택한 직무·공고, 공고 특징, 키워드 하나 이상, 필요한 경험 유형, 내 경험 연결 후보·부족한 근거, 다음 질문을 작성하세요. 경험을 아직 제공하지 않았다면 미연결과 다음에 정리할 내용을 남겨도 됩니다. 완료는 분석 기록 점검이며 직무 적합도나 합격 가능성 평가가 아닙니다.</p></div><details class="legacy-note"><summary>이 단계의 자유 메모</summary><label class="note-label" for="previous-note">추가 메모 · 기존 메모 확인과 수정</label><textarea id="previous-note" rows="5">${esc(state.notes[id]||'')}</textarea></details>`;
    bindPromptEditor(id);
    document.querySelector('#copy-role-record').onclick=()=>copyText(Workbook.exportText(id,worksheetData(id)),document.querySelector('#analysis-record'));
    document.querySelector('#previous-note').oninput=event=>{state.notes[id]=event.target.value;save();};
  }
  bindLessonButtons();return true;
}
