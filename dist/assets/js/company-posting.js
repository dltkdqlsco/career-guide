'use strict';
// PDF p.14 guidance. Forms, application checks and fictional cases are supplementary.
window.CompanyPosting=(()=>{
  const cases=[
    {title:'지원 공고에 적힌 필수·우대·기술 구분',weak:'백엔드 채용이니 Kubernetes 경험도 필수일 것이다. API 문서화 우대도 꼭 갖춰야 지원할 수 있다.',data:{
      target:'다온테크 / 2026년 신입 백엔드 개발자 채용 / 서비스개발팀 / 신입',
      source:'학습용 가상 공식 공고 A / 보관 파일: 다온테크-신입-A.html / 게시 2026-10-01 / 수정 여부 미확인 / 확인 2026-10-16 / 예시 기준 모집 중. 실제 사용 시 공식 URL과 현재 상태를 직접 확인.',
      original:'[가상 공고 A]\n담당 업무: 주문 API 개발·운영\n자격 요건: Java 개발 및 SQL 활용 가능\n우대 사항: API 문서화 경험\n지원 안내: 정규직, 서울, 공식 채용 페이지에서 이력서·포트폴리오 제출. 2026-10-01부터 2026-10-31 18:00(KST)까지. 전형: 서류 → 기술 면접.',
      duties:'주문 API 개발·운영 / 공고 A 담당 업무 1항',
      qualifications:'Java 개발 및 SQL 활용 가능 / 공고 A 자격 요건 1항. 공고에 우대로 적힌 API 문서화 경험은 이 칸에 옮기지 않음.',
      preferred:'API 문서화 경험 / 공고 A 우대 사항 1항. 필수 자격과 구분.',
      technologies:'Java·SQL: 자격 요건에 명시. Kubernetes: 공고에 미기재, 실제 운영 기술인지도 미확인.',
      application:'정규직 / 서울 / 2026-10-01부터 2026-10-31 18:00(KST)까지 / 공식 채용 페이지 / 이력서·포트폴리오 / 서류 → 기술 면접. 모두 가상 조건이며 실제 공고로 교체해야 함.',
      questions:'배치 팀의 상세 업무와 실제 운영 기술은 미확인. 공식 상세 공고·채용 문의에서 확인. 지원 직전에 수정·마감 여부 재확인.',
      references:'',referenceLimits:''
    },why:'필수·우대와 기술이 등장한 맥락을 유지했습니다. 공고에 없는 기술이나 지원 자격을 추가하지 않았습니다.'},
    {title:'정보가 부족할 때 · 경력직·경쟁사 공고는 참고로 보관',weak:'다른 회사의 경력직 공고에 운영 모니터링 경험 3년이 필요하니, 내가 지원할 신입 직무도 같은 조건일 것이다.',data:{
      target:'다온테크 / 서비스 개발 신입 모집 / 백엔드 / 신입',
      source:'학습용 가상 공식 공고 B / 보관 파일: 다온테크-신입-B.html / 확인 2026-10-16 / 게시·수정일 및 현재 모집 상태 미확인. 실제 조사 시 공식 공고에서 확인.',
      original:'[가상 공고 B]\n서비스 개발 신입 모집. 컴퓨터 관련 전공 우대. 구체적인 담당 업무·필수 자격·사용 기술·지원 절차는 제공된 발췌에 없음.',
      duties:'서비스 개발 / 공고 B 본문. 구체적인 담당 업무는 발췌에 미기재, 상세 공고 확인 필요.',
      qualifications:'제공한 발췌에는 필수 자격 미기재. 자격 제한이 없다는 뜻은 아님. 원문 전체 확인 필요.',
      preferred:'컴퓨터 관련 전공 우대 / 공고 B 본문. 전공 필수로 바꾸지 않음.',
      technologies:'지원 공고 B 발췌에는 기술명 미기재. 참고 공고의 기술을 지원 기업의 운영 기술로 간주하지 않음.',
      application:'고용 형태·근무지·접수 기간·마감 시각·지원 방법·제출 서류·전형은 모두 미확인. 공식 공고 전체와 채용 안내 확인 필요.',
      questions:'신입의 실제 업무·필수 자격·운영 업무 참여 여부·마감·지원 방법을 공식 공고 전체 또는 채용 문의에서 확인.',
      references:'모두 학습용 가상 참고 자료.\n참고 R1 / 다온테크 백엔드 경력직 / 보관 파일 R1.html / 확인 2026-10-16 / 담당 업무: API 운영 모니터링, 경력 3년 이상.\n참고 R2 / 경쟁사 모아서비스 백엔드 신입 / 보관 파일 R2.html / 확인 2026-10-16 / 자격 요건: SQL 활용. 실제 조사에서는 공식 URL·게시일·원문 위치 추가.',
      referenceLimits:'R1은 지원 기업과 같지만 경력 수준이 다름. R2는 직무명이 비슷하지만 법인·조직이 다름. 경력 3년과 SQL을 지원 공고 B의 필수 조건으로 옮기지 않음. 운영 업무·사용 기술을 추가 조사할 질문으로만 활용.'
    },why:'지원 공고에서 확인한 내용과 참고 자료를 분리했습니다. 같은 직무명이라도 기업·조직·채용 수준 차이를 남겼습니다.'}
  ];
  const weak={target:'좋은 회사 개발자',source:'채용 사이트에서 봄',original:'인터넷 내용을 대략 요약함',duties:'IT 업무 전반일 것 같다.',qualifications:'우대도 모두 필수일 것 같다.',preferred:'공고에 없으니 우대 사항은 없다.',technologies:'백엔드니까 Kubernetes를 쓸 것이다.',application:'곧 마감할 것 같다.',questions:'미기재 항목을 없음으로 처리',references:'다른 공고의 조건을 그대로 가져오기',referenceLimits:'직무명이 같으니 똑같이 적용'};
  return {cases,weak};
})();
// Reuse the established per-field example disclosure without filling the form.
CompanyLessons.fieldHelp[Workbook.postingId]=Object.fromEntries(Workbook.fields(Workbook.postingId).map(([key,,help])=>[key,{weak:CompanyPosting.weak[key],good:(key==='references'||key==='referenceLimits'?CompanyPosting.cases[1]:CompanyPosting.cases[0]).data[key],tip:help}]));

function postingGuide(){
  return `<div class="lesson-lead"><span class="eyebrow">채용 공고 확인</span><h3>지원할 공고에서 실제로 요구하는 내용을 찾으세요.</h3><p>채용 사이트와 기업 공식 홈페이지에서 지원하려는 직무의 공고를 확인합니다. 하는 일·필요 역량·우대 사항·사용 기술이 구체적인 공고일수록 다음 직무 분석에 활용하기 좋습니다.</p></div><ol class="instruction-list"><li><strong>지원 기업·직무·채용 수준 확인</strong><p>정확한 법인과 공고명, 신입·경력 구분을 먼저 기록합니다. 채용 사이트에서 발견한 공고는 기업의 공식 채용 페이지에서 동일한 공고인지 대조하세요.</p></li><li><strong>업무·필수·우대·기술 분리</strong><p>공고 원문을 보관한 뒤 담당 업무, 필요 자격·역량, 우대 사항과 사용 기술을 나눕니다. 기술은 어느 항목에 적혀 있는지도 남기세요. 필수인지 구분되지 않는 내용은 원문을 유지하고 미확인으로 표시합니다.</p></li><li><strong>부족한 정보는 다른 공고로 참고</strong><p>경쟁사의 동일 직무 공고와 지원 기업의 경력직 공고를 참고할 수 있습니다. 조직 소개·구체적인 우대 사항 등을 살펴보고 추가로 확인할 질문을 찾으세요.</p></li><li><strong>참고 자료의 적용 범위 표시</strong><p>지원 공고와 참고 공고를 구분하고 기업·직무·조직·경력 수준 차이를 남깁니다. 참고 공고에 적힌 조건만으로 지원 기업의 자격이나 기술을 확정하지 않습니다.</p></li></ol><div class="stage-cards"><article class="stage-card"><h3>채용 공고를 찾는 경로</h3><p>기업 공식 채용 홈페이지, 자소설닷컴, 링커리어 등에서 공고를 찾을 수 있습니다. 신입 공고의 정보가 부족하면 경력직 공고의 조직 소개·우대 사항을 참고하되 차이를 구분하세요.</p><p class="tiny">공고의 현재 모집 여부와 세부 조건은 공식 채용 페이지에서 확인하세요.</p></article><article class="stage-card"><h3>지원 전 일정·절차 점검</h3><p>고용 형태·근무지, 접수 기간·마감 시각과 시간대, 지원 경로·서류·전형도 함께 기록하세요. 마감·수정 여부를 지원 직전에 다시 확인합니다.</p><p class="tiny">지원 전에 공식 안내에서 일정과 절차가 바뀌지 않았는지 다시 확인하세요.</p></article></div><div class="check-note"><strong>이번 단계에서 남길 것</strong><p>지원 공고 원문, 업무·요건 분류와 미확인 질문입니다. 참고 공고는 별도 칸에 출처와 적용 한계를 함께 남깁니다. 직무 선택과 내 경험 비교는 이후 단계에서 이어갑니다.</p></div><div class="next-action">${lessonButton('공고 기록 예시 보기','example')}</div>`;
}
function postingExamples(){
  return `<div class="gallery-heading"><h3>공고의 표현을 유지하며 정리하기</h3><span class="badge">2가지 비교 사례</span></div><div class="tip-box">아래 기업·공고·날짜·조건은 모두 학습용 가상 예시입니다. 예시는 내 작성칸에 자동으로 들어가지 않습니다.</div><div class="example-gallery">${CompanyPosting.cases.map((item,index)=>exampleDetail(index,item.title,`<div class="weak-prompt"><span class="eyebrow">근거가 부족한 판단</span><p>${esc(item.weak)}</p></div><dl class="example-fields">${Workbook.fields(Workbook.postingId).filter(([key])=>item.data[key]).map(([key,label],i)=>`<div><dt><span>${i+1}</span>${esc(label)}</dt><dd>${esc(item.data[key])}</dd></div>`).join('')}</dl><div class="adapt-note"><strong>무엇이 달라졌나요?</strong><p>${esc(item.why)}</p></div>${lessonButton('내 공고 기록하기','write')}`)).join('')}</div>`;
}
function postingReference(){
  const goal=recordText(allSteps.find(step=>step.id==='1-0'));
  const verified=Workbook.verifiedSentences(state.worksheets[Workbook.verificationId]||{});
  return `<details class="prompt-reference"><summary>앞서 정한 목표와 직접 대조한 문장 참고하기 · 읽기 전용</summary><h4>처음 정한 분석 목표</h4><pre class="company-reference-text">${esc(goal||'아직 작성한 분석 목표가 없습니다.')}</pre><h4>6단계에서 내가 원문 대조 후 선택한 문장</h4><pre class="company-reference-text">${esc(verified||'아직 원문 대조 후 선택한 문장이 없습니다.')}</pre><p>위 문장은 사용자의 판단 기록이며 지원 공고의 요건을 대신하지 않습니다. 실제 공고 원문을 확인해 아래 칸에 직접 작성하세요. 앞 단계 기록은 변경되지 않습니다.</p><a href="#course/company/5/write">6단계 검증 기록 보기 →</a></details>`;
}
function renderCompanyPostingLesson(){
  const id=Workbook.postingId,el=document.querySelector('#tab-content');
  if(selectedTab==='guide')el.innerHTML=postingGuide();
  else if(selectedTab==='example')el.innerHTML=postingExamples();
  else{
    const fields=Workbook.fields(id);
    const section=(title,items,start)=>`<h3 class="analysis-section">${title}</h3><div class="worksheet-grid ${start===0?'posting-source-fields':''}">${items.map((field,i)=>renderField(id,field,start+i)).join('')}</div>`;
    el.innerHTML=`<div class="worksheet-heading"><div><h3>지원 공고를 기준으로 정리하세요.</h3><p>필수 9개 항목을 기록하고, 참고 공고를 사용한다면 출처와 적용 한계를 함께 적으세요. 모르는 정보는 추측해 채우지 않고 미확인과 다음 확인 경로를 남깁니다. 입력 내용은 이 브라우저에 자동 저장됩니다.</p></div><span class="badge" id="filled-count"></span></div>${postingReference()}${section('1. 지원 공고와 원문 보관',fields.slice(0,3),0)}${section('2. 지원 공고의 업무와 요건 분류',fields.slice(3,7),3)}${section('3. 지원 조건과 남은 질문',fields.slice(7,9),7)}<div class="check-note"><strong>다른 공고가 필요할 때</strong><p>경쟁사의 동일 직무 또는 지원 기업의 경력직 공고를 활용했다면 아래 두 칸을 함께 작성하세요. 참고 공고의 조건은 위의 지원 공고 요건으로 자동 편입되지 않습니다.</p></div>${section('4. 참고 공고와 적용 한계 · 선택',fields.slice(9),9)}<section class="output-panel"><div class="output-heading"><h3>나의 채용 공고 확인 기록</h3><span id="record-count" class="tiny"></span></div><label class="sr-only" for="company-record">지원 공고와 참고 공고를 구분한 전체 기록</label><textarea id="company-record" rows="12" readonly placeholder="위에서 작성한 내용을 항목별로 모아 보여드립니다."></textarea><div class="output-actions"><button class="primary" id="copy-company-record" type="button">공고 기록 전체 복사</button><span id="worksheet-status" class="tiny" role="status">${storageOK?'이 브라우저에 자동 저장':'저장 불가 · 내려받기로 보관하세요'}</span></div></section><div class="check-note"><strong>완료하기 전에</strong><p>지원 공고의 필수와 우대를 구분했는지, 미기재와 해당 없음을 혼동하지 않았는지 확인하세요. 참고 공고를 썼다면 적용 한계도 기록합니다. 완료는 기록 작성 점검이며 지원 자격 충족이나 현재 모집 여부를 보증하지 않습니다.</p></div><details class="legacy-note"><summary>이 단계의 자유 메모</summary><label class="note-label" for="previous-note">추가 메모 · 기존 메모 확인과 수정</label><textarea id="previous-note" rows="5">${esc(state.notes[id]||'')}</textarea></details><div class="next-action"><a class="secondary" href="#notes">내 기록 모아보기 →</a><a class="secondary" href="#backup">백업·복원 →</a></div>`;
    bindWorksheetFields(id);updateCompanyRecord(id);
    document.querySelector('#copy-company-record').onclick=()=>copyText(Workbook.exportText(id,worksheetData(id)),document.querySelector('#company-record'));
    document.querySelector('#previous-note').oninput=event=>{state.notes[id]=event.target.value;save();};
  }
  bindLessonButtons();return true;
}
