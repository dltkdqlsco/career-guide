'use strict';
// Step 4: based on the supplied company-analysis PDF, pages 6–9.
// The worksheets and fictional practice cases are supplementary material.
window.CompanyResearch=(()=>{
  const cases=[
    {
      title:'사업보고서 · 링크에서 다시 찾을 수 있는 근거로',
      weak:'다온테크는 B2B가 유망하다. DART에서 봤다.',
      data:{target:'다온테크 / 신입 백엔드 / 주요 서비스와 주문 API 업무는 어떻게 연결될까?',source:'자료 A / 2025년 가상 사업보고서 / 작성 주체: 다온테크 / 자료 종류: 기업 공시',location:'학습용 가상 문서: 다온테크-2025-사업보고서.pdf. 실제 조사에서는 확인한 원문 URL이나 보관 위치로 바꾼다.',dates:'발행: 2026-03-10 / 대상: 2025년 / 확인: 2026-10-16 / 정정 여부: 미확인',evidence:'Ⅱ. 사업의 내용 - 주요 제품 및 서비스, 12쪽: 기업 고객용 주문 관리 서비스 제공. 연구개발 활동, 28쪽: 주문 처리 안정화 연구 계획. 기술 스택과 실제 채용 확대는 이 내용만으로 알 수 없음.',questions:'현재 공고의 주문 API 업무가 어느 서비스에 해당하는지 미확인. 해당 법인의 채용 공고와 후속 사업 자료를 확인한다.'},
      why:['보고서의 항목과 페이지를 남겨 같은 내용을 다시 찾을 수 있습니다.','사업 설명과 연구 계획을 채용 확대나 이미 달성한 성과로 바꾸지 않았습니다.']
    },
    {
      title:'증권사 리포트 · 전망과 확인된 사실 나누기',
      weak:'모아서비스는 내년에 매출이 늘어난다. 리포트가 그렇게 말했다.',
      data:{target:'모아서비스 / 고객 운영 / 주력 서비스와 앞으로 확인할 사업 변화는 무엇인가?',source:'자료 B / 모아서비스 산업 동향 가상 리포트 / 작성 주체: 가상 리서치팀 / 자료 종류: 증권사 리포트',location:'학습용 가상 문서: 모아서비스-산업동향.pdf. 실제 조사에서는 한경컨센서스 등에서 직접 확인한 리포트의 원문 위치를 기록한다.',dates:'발행: 2026-09-01 / 대상: 2026년 현황과 2027년 전망 / 확인: 2026-10-16 / 후속 리포트: 미확인',evidence:'요약 1쪽: 작성자는 기업 고객용 서비스 수요 확대를 예상한다. 이는 전망이며 실제 매출 증가를 확인한 수치가 아니다. 주요 서비스 설명은 회사의 공식 자료와 추가 대조가 필요하다.',questions:'전망의 전제와 회사의 최근 실적은 미확인. 같은 기간의 회사 공시·공식 발표를 찾아 사실과 전망을 구분한다.'},
      why:['리포트를 쓴 주체와 전망의 대상 기간을 함께 남겼습니다.','전망을 실적으로 단정하지 않고 추가로 확인할 회사 자료를 정했습니다.']
    }
  ];
  const weak={target:'좋은 기업 찾기',source:'인터넷 자료',location:'검색해서 찾음',dates:'최근 자료',evidence:'회사가 유망하다.',questions:'더 알아보기'};
  return {cases,weak};
})();

function researchGuide(){
  return `<div class="lesson-lead"><span class="eyebrow">질문에 맞는 자료 찾기</span><h3>회사의 사업을 이해하고, 다시 확인할 근거를 남기세요.</h3><p>기업 유형과 분석 질문에 맞는 경로를 고르세요. 주요 제품·서비스, 매출 구성, 연구개발과 사업 방향을 살펴본 뒤 필요한 문단과 출처를 자료 카드에 기록합니다.</p></div>

  <div class="research-paths">
    <article class="stage-card"><span class="badge">공시 원문</span><h3>DART 전자공시시스템</h3><p>사업·분기·감사보고서를 찾아 기업의 사업과 실적을 확인합니다. 지원 법인과 대상 기간을 먼저 맞추세요.</p><ol><li>회사명과 필요한 보고서 유형으로 자료를 찾습니다.</li><li>‘Ⅱ. 사업의 내용’에서 주요 제품 및 서비스, 주요 계약 및 연구개발 활동, 기타 참고사항을 살펴봅니다.</li><li>질문에 필요한 내용과 페이지·항목을 기록합니다.</li></ol><p class="tiny">실제 보고서의 항목명과 정정 여부도 확인하세요.</p><a class="text-button" href="https://dart.fss.or.kr/dsab001/main.do" target="_blank" rel="noopener noreferrer">DART 회사별 검색 ↗</a></article>
    <article class="stage-card"><span class="badge">공시 분석 보조</span><h3>DartPoint AI</h3><p>공시 정보를 분석하는 서비스입니다. 기업명·종목 코드 검색, 공시 분석 화면, AI 어시스턴트와 엑셀 다운로드를 안내합니다.</p><ol><li>서비스명 ‘DartPoint AI’로 찾아 관심 기업을 검색합니다.</li><li>기업의 전략·리스크·기회 요인처럼 필요한 질문을 정합니다.</li><li>답변에 연결된 근거 페이지를 열어 실제 문장과 대조합니다.</li></ol><p class="tiny">회원 가입 여부와 현재 기능·이용 조건은 서비스에서 확인하세요.</p></article>
    <article class="stage-card"><span class="badge">산업·기업 전망</span><h3>증권사 리포트 · 한경컨센서스</h3><p>기업 실적, 산업 동향과 전망을 읽고 지원 동기·입사 후 포부에 쓸 조사 질문을 찾습니다.</p><ol><li>‘한경컨센서스’를 찾아 기업명과 필요한 기간으로 리포트를 검색합니다. 예를 들어 최근 1년처럼 조사할 기간을 정하세요.</li><li>리포트 PDF의 요약, 작성 주체와 발행일을 확인합니다.</li><li>실적·작성자의 해석·향후 전망을 나누어 기록합니다.</li></ol><p class="tiny">전망이 실제로 달성됐다는 뜻은 아닙니다. 회사 공시와 동일한 기준으로 대조하세요.</p></article>
  </div>
  <h3>비상장기업을 조사한다면</h3><p>투자·사업 모델·채용 중 지금 필요한 정보에 맞춰 고르세요.</p>
  <dl class="research-directory">
    <div><dt>혁신의 숲 · TheVC</dt><dd>국내 스타트업 투자 정보와 분석 리포트</dd></div>
    <div><dt>원티드</dt><dd>SW 기업·스타트업 정보와 직무별 채용 정보</dd></div>
    <div><dt>스타트업얼라이언스 · 넥스트유니콘 · 삼성전자 C-Lab</dt><dd>스타트업 투자, 기업과 사업 모델 정보</dd></div>
    <div><dt>중소벤처기업부 · 예비 유니콘 기업 지원 정보</dt><dd>기술보증기금과 중소벤처기업부의 관련 지원 리스트를 살펴보세요.</dd></div>
    <div><dt>스타트업 위클리</dt><dd>스타트업 업계 주요 소식을 담은 주간 뉴스레터</dd></div>
  </dl>
  <p class="tiny">자료의 제공 여부와 기준일은 직접 확인하세요.</p>
  <details class="prompt-reference"><summary>추가 조사 경로 · KIND와 기업 공식 홈페이지</summary><p>KIND에서 공시·IR 자료를 추가로 찾을 수 있습니다. 기업 공식 홈페이지에서는 사업 소개와 채용 정보를 확인하세요.</p><p>같은 공시를 여러 곳에서 보았다고 독립된 근거가 늘어나는 것은 아닙니다.</p><a class="text-button" href="https://kind.krx.co.kr/disclosure/todaydisclosure.do?method=searchTodayDisclosureMain" target="_blank" rel="noopener noreferrer">KIND 공식 사이트 ↗</a></details>
  <div class="check-note"><strong>이 단계에서 남길 것</strong><p>자료별로 분석 질문, 작성 주체, 원문 위치, 날짜, 확인한 내용, 다음 질문을 기록합니다. 출처를 적는 것과 사실을 검증하는 것은 별개의 작업입니다.</p></div>
  <div class="next-action">${lessonButton('자료 기록 예시 보기','example')}</div>`;
}

function researchExamples(){
  return `<div class="gallery-heading"><h3>자료를 읽은 흔적을 남기는 방법</h3><span class="badge">2가지 비교 사례</span></div><div class="tip-box example-disclosure">기업·문서·날짜·내용은 모두 학습용 가상 사례입니다. 예시는 내 기록에 자동으로 입력되지 않습니다.</div><div class="example-gallery">${CompanyResearch.cases.map((item,index)=>exampleDetail(index,item.title,`<div class="weak-prompt"><span class="eyebrow">부족한 기록</span><p>${esc(item.weak)}</p></div><h4>출처와 근거를 남긴 기록</h4><dl class="example-fields">${Workbook.sourceFields.map(([key,label],i)=>`<div><dt><span>${i+1}</span>${esc(label)}</dt><dd>${esc(item.data[key])}</dd></div>`).join('')}</dl><h4>무엇이 좋아졌나요?</h4>${examplePoints(item.why)}<div class="adapt-note"><strong>내 기록에 적용하기</strong><p>원문을 다시 찾을 수 있는지, 확인한 사실과 전망을 구분했는지 살펴보세요.</p></div>${lessonButton('내 자료 카드 작성하기','write')}`)).join('')}</div>`;
}

function researchReference(){
  const records=['1-0','1-1','1-2'].map(id=>({id,text:recordText(allSteps.find(step=>step.id===id))})).filter(record=>record.text.trim());
  if(!records.length)return '';
  return `<details class="prompt-reference"><summary>앞 단계의 분석 질문·도구·지침 참고하기</summary><p>내가 준비한 기록을 읽고 필요한 내용만 직접 옮겨 적으세요.</p>${records.map(({id,text})=>`<h4>${esc(allSteps.find(step=>step.id===id).title)}</h4><pre class="company-reference-text">${esc(text)}</pre>`).join('')}</details>`;
}

function updateResearchRecord(){
  const data=worksheetData(Workbook.collectionId),cards=Workbook.sourceCards(data),text=Workbook.exportText(Workbook.collectionId,data),output=document.querySelector('#research-record');
  if(output&&output.value!==text){const top=output.scrollTop,left=output.scrollLeft;output.value=text;output.scrollTop=top;output.scrollLeft=left;}
  const complete=cards.filter(card=>Workbook.sourceFields.every(([key])=>typeof card[key]==='string'&&card[key].trim())).length;
  setText('#research-count',`자료 ${cards.length} / ${Workbook.maxSourceCards}개 · 항목 작성 ${complete}개 완료`);
  setText('#research-record-count',`${text.length}자`);
  document.querySelector('#add-source-card').disabled=cards.length>=Workbook.maxSourceCards;
}

function saveResearchField(index,key,value){
  const id=Workbook.collectionId,cards=Workbook.sourceCards(worksheetData(id));
  if(!cards[index]||!Workbook.sourceFields.some(([field])=>field===key))return false;
  if(cards[index][key]===value&&storageOK)return false;
  return saveWorksheet(id,'cards',cards.map((card,i)=>i===index?{...card,[key]:value}:card));
}

function renderResearchCards(){
  const cards=Workbook.sourceCards(worksheetData(Workbook.collectionId));
  document.querySelector('#source-cards').innerHTML=cards.length?cards.map((card,index)=>`<article class="research-card" aria-labelledby="source-title-${index}"><div class="research-card-heading"><h4 id="source-title-${index}">자료 ${index+1}</h4><button type="button" class="secondary" data-remove-source="${index}" aria-label="자료 ${index+1} 삭제">카드 삭제</button></div><div class="worksheet-grid">${Workbook.sourceFields.map(([key,label,help,example],i)=>`<div class="field-block"><label for="source-${index}-${key}"><span class="field-number">${i+1}</span>${esc(label)} <span class="required-text">완료 시 필수</span></label><p id="source-help-${index}-${key}">${esc(help)}</p><textarea id="source-${index}-${key}" data-source-card="${index}" data-source-field="${key}" aria-describedby="source-help-${index}-${key}" rows="4" placeholder="예: ${esc(example)}">${esc(card[key]||'')}</textarea><details class="field-example"><summary>작성 예시 비교</summary><div><p><strong>부족한 예시</strong> ${esc(CompanyResearch.weak[key])}</p><p><strong>구체적인 예시</strong> ${esc(CompanyResearch.cases[0].data[key])}</p></div></details></div>`).join('')}</div></article>`).join(''):'<div class="research-empty"><p>아직 자료 카드가 없습니다. 직접 확인한 자료 한 건부터 기록해 보세요.</p></div>';
  document.querySelectorAll('[data-source-field]').forEach(input=>{
    let composing=false;
    const saveInput=()=>saveResearchField(Number(input.dataset.sourceCard),input.dataset.sourceField,input.value);
    const refresh=()=>{if(currentStep?.id===Workbook.collectionId&&selectedTab==='write')updateResearchRecord();};
    const finish=()=>{composing=false;saveInput();refresh();};
    input.oncompositionstart=()=>{composing=true;};
    input.oninput=event=>{composing=composing||Boolean(event.isComposing);const changed=saveInput();if(changed&&!composing)refresh();};
    input.oncompositionend=finish;
    input.onblur=()=>{if(composing)finish();};
  });
  document.querySelectorAll('[data-remove-source]').forEach(button=>button.onclick=()=>Viewport.keep(()=>{
    const index=Number(button.dataset.removeSource),current=Workbook.sourceCards(worksheetData(Workbook.collectionId));
    if(!current[index])return;
    if(Workbook.sourceCardText(current[index]).trim()&&!window.confirm(`자료 ${index+1} 카드의 작성 내용을 삭제할까요? 다른 카드와 자유 메모는 보존됩니다.`))return;
    saveWorksheet(Workbook.collectionId,'cards',current.filter((_,i)=>i!==index));
    renderResearchCards();updateResearchRecord();
    document.querySelector('#add-source-card').focus({preventScroll:true});
    notify('자료 카드를 삭제했습니다.');
  }));
}

function renderCompanyResearchLesson(){
  const el=document.querySelector('#tab-content'),id=Workbook.collectionId;
  if(selectedTab==='guide')el.innerHTML=researchGuide();
  else if(selectedTab==='example')el.innerHTML=researchExamples();
  else{
    el.innerHTML=`<div class="worksheet-heading"><div><h3>확인한 자료를 한 건씩 기록하세요.</h3><p>자료마다 카드 하나를 만드세요. 입력한 내용은 이 브라우저에 자동 저장됩니다.</p></div></div>${researchReference()}<div class="research-toolbar"><button class="primary" id="add-source-card" type="button">자료 카드 추가 +</button><span id="research-count" class="tiny" role="status"></span></div><div id="source-cards"></div><section class="output-panel"><div class="output-heading"><h3>나의 자료 수집 기록</h3><span id="research-record-count" class="tiny"></span></div><label class="sr-only" for="research-record">자료 수집 기록 전체</label><textarea id="research-record" rows="10" readonly placeholder="작성한 자료 카드 내용을 모아 보여드립니다."></textarea><div class="output-actions"><button class="secondary" id="copy-research-record" type="button">전체 자료 기록 복사</button><span id="worksheet-status" class="tiny" role="status">${storageOK?'이 브라우저에 자동 저장':'저장 불가 · 내려받기로 보관하세요'}</span></div></section><div class="check-note"><strong>완료하기 전에</strong><p>자료 카드 한 개 이상을 만들고 각 카드의 여섯 항목을 작성하세요. 모르는 내용은 미확인으로 남기고, 사용하지 않는 빈 카드는 삭제하세요. 완료 표시는 기록 작성 점검이며 사실 인증이 아닙니다.</p></div><details class="legacy-note"><summary>이 단계의 자유 메모</summary><label class="note-label" for="previous-note">추가 메모 · 기존 메모 확인과 수정</label><textarea id="previous-note" rows="5" placeholder="추가로 확인할 자료나 질문을 적어보세요.">${esc(state.notes[id]||'')}</textarea></details><div class="next-action"><p>자료 카드와 자유 메모를 내 메모에서 함께 확인하거나 전체 기록으로 백업할 수 있습니다.</p><a class="secondary" href="#notes">내 기록 모아보기 →</a><a class="secondary" href="#backup">백업·복원 →</a></div>`;
    renderResearchCards();updateResearchRecord();
    document.querySelector('#add-source-card').onclick=()=>Viewport.keep(()=>{
      const cards=Workbook.sourceCards(worksheetData(id));
      if(cards.length>=Workbook.maxSourceCards)return;
      saveWorksheet(id,'cards',[...cards,{}]);renderResearchCards();updateResearchRecord();
      document.querySelector(`#source-${cards.length}-target`).focus({preventScroll:true});
    });
    document.querySelector('#copy-research-record').onclick=()=>copyText(Workbook.exportText(id,worksheetData(id)),document.querySelector('#research-record'));
    document.querySelector('#previous-note').oninput=event=>{state.notes[id]=event.target.value;save();};
  }
  bindLessonButtons();return true;
}
