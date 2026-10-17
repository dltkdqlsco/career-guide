'use strict';
// PDF p.13 supplies the direct-verification principle. Cards and cases are supplementary.
window.CompanyVerification=(()=>{
  const cases=[
    {title:'단위·기간·범위 · 같은 기준의 자료로 수정',data:{
      claim:'다온테크 매출은 120억 원에서 1,380억 원으로 증가했다.',
      source:'모두 학습용 가상 자료. 처음 본 별도 상반기 표의 단위는 백만 원, 값은 13,800. 추가로 직접 확인한 자료 A(2026-03-10 사업보고서, 파일 A.pdf, 3쪽)는 연간 연결 매출 2024년 120억 원, 2025년 138억 원. 확인일 2026-10-16.',
      comparison:'13,800백만 원은 138억 원. 처음의 별도 상반기와 연간 연결 값을 직접 비교하면 안 됨. 자료 A의 같은 법인·연간·연결·억원 기준으로 다시 대조. 자료 A의 정정 공시 없음도 가상 사례의 조건.',
      reason:'단위 오류를 고치고 같은 기간·범위의 원문을 다시 확보해 최종 문장을 대조했다.',
      final:'자료 A에 따르면 다온테크의 연간 연결 매출은 2024년 120억 원에서 2025년 138억 원으로 증가했다[2026-03-10 사업보고서, 3쪽; 확인 2026-10-16].',
      next:'이 비교에 남은 질문 없음. 지원 직전에는 정정·갱신 여부를 다시 확인한다.',verdict:'corrected'}},
    {title:'출처에 없는 기술 · 확인 불가와 오류는 다름',data:{
      claim:'다온테크는 Kubernetes로 모든 서비스를 운영한다.',
      source:'학습용 가상 자료 B / 공식 채용 공고 / 파일 B.html, 담당 업무 / 발행 2026-10-01, 확인 2026-10-16 / 원문: 주문 API 개발, SQL 활용. 기술 블로그는 열지 못함.',
      comparison:'법인 일치 / 수치·단위 해당 없음 / Kubernetes와 모든 서비스라는 범위가 공고에 없음. 공식 기술 자료와 최신 관련 기사는 확인하지 못함.',
      reason:'공고만으로 기술 사용 여부를 판단할 수 없다. 자료에 없다는 것이 사용하지 않는다는 뜻은 아니다.',
      final:'',next:'원래 주장은 지원 문서에서 제외. 회사의 공개 기술 자료를 확인하고 운영 범위를 추가 질문한다.',verdict:'unverified'}},
    {title:'계획·후속 발표 · 최신 변경 사항까지 확인',data:{
      claim:'모아서비스는 2026년 하반기 해외 서비스를 성공적으로 출시했다.',
      source:'모두 학습용 가상 자료. 자료 D / IR 발표 / D.pdf 5쪽 / 2026-04-01: 하반기 출시 추진. 자료 E / 공식 뉴스룸 / E.html 2문단 / 2026-10-10: 해당 서비스의 2026년 출시 계획 철회, 미출시. 확인일 2026-10-16.',
      comparison:'동일 법인·동일 해외 서비스. D는 계획이며 실적이 아님. 최신 공식 발표 E에서 계획 철회와 미출시를 직접 확인. 처음 분석에 이 후속 변경이 빠져 있었음.',
      reason:'계획만으로 성공적 출시를 단정했고, 후속 공식 발표는 기준일 현재 미출시라고 명시하므로 원래 주장에 오류가 있다.',
      final:'',next:'성공적 출시라는 문장은 제외한다. 철회 발표 내용을 사용하려면 별도 카드에서 그 문장과 근거를 대조한다.',verdict:'error'}}
  ];
  return {cases};
})();

function verificationGuide(){
  return `<div class="lesson-lead"><span class="eyebrow">정보 정확성 확인 및 검증</span><h3>출처를 직접 열고, 문장 하나씩 대조하세요.</h3><p>자료를 제공했어도 AI 답변에 오류나 누락이 있을 수 있습니다. 5단계 분석에서 사용할 주장을 골라 공식 홈페이지와 최신 기사를 확인하고, 확인한 근거와 자신의 판단을 남기세요.</p></div><ol class="instruction-list"><li><strong>주장 하나씩 나누기</strong><p>“매출이 늘고 채용도 확대됐다”는 두 주장입니다. 원래 문장을 카드별로 기록하고, 어떤 법인과 시점을 말하는지 적으세요.</p></li><li><strong>근거 원문 직접 열기</strong><p>자료명·작성자·URL 또는 파일·발행일·대상 기간·확인일·페이지/문단과 필요한 원문을 남깁니다. 열지 못했거나 근거를 찾지 못했다면 미확인으로 기록하세요.</p></li><li><strong>비교 기준 맞추기</strong><p>회사·기간·단위·연결/별도 범위와 정정 여부를 확인하세요. 계획을 실적으로, 채용 소개 문구를 실제 근무 환경으로 확대하지 않았는지 살펴봅니다.</p></li><li><strong>변경·누락 정보 확인</strong><p>공식 홈페이지·뉴스룸과 최신 기사에서 후속 발표, 정정, 취소나 변경이 있는지 찾습니다. 기사의 원래 발표도 확인하고, 자료끼리 다르면 시점과 차이를 기록하세요. 확인하지 못한 항목은 다음 질문으로 남깁니다.</p></li><li><strong>판단과 사용할 문장 정리</strong><p>판단 이유와 최종 문장 또는 제외 이유를 적은 뒤 상태를 선택합니다. AI 검토 답변을 받아도 최종 판단은 직접 원문을 대조해 내리세요.</p></li></ol><div class="stage-cards">${[
    ['확인됨','원래 주장과 사용할 문장을 근거가 뒷받침합니다.'],['수정 후 확인','잘못되거나 과한 표현을 고친 뒤, 수정 문장을 원문과 직접 대조했습니다.'],['오류 확인·제외','반박하는 근거를 확인했으며 이 주장은 사용하지 않습니다.'],['미확인','근거가 부족하거나 접근하지 못했습니다. 틀렸다고 단정하지 않습니다.']
  ].map(([label,help])=>`<article class="stage-card"><h3>${label}</h3><p>${help}</p></article>`).join('')}</div><div class="next-action">${lessonButton('검증 사례 비교하기','example')}</div>`;
}
function verificationExamples(){
  return `<div class="gallery-heading"><h3>어떤 근거로 판단했는지 남기세요.</h3><span class="badge">3가지 비교 사례</span></div><div class="tip-box">아래 기업·자료·날짜·수치는 모두 학습용 가상 사례입니다. 내 작성칸에 자동으로 입력되지 않습니다.</div><div class="example-gallery">${CompanyVerification.cases.map((item,index)=>exampleDetail(index,item.title,`<dl class="example-fields">${Workbook.verificationFields.map(([key,label],i)=>`<div><dt><span>${i+1}</span>${esc(label)}</dt><dd>${esc(key==='verdict'?Workbook.verdictLabel(item.data[key]):item.data[key]||'사용할 문장 없음 · 원래 주장 제외')}</dd></div>`).join('')}</dl>${lessonButton('내 주장 검증하기','write')}`)).join('')}</div>`;
}
function verificationReference(){
  return `<details class="prompt-reference"><summary>4단계 자료와 5단계 분석 참고하기 · 읽기 전용</summary><p>검증할 문장과 자료를 골라 카드에 직접 옮기세요. 이 화면에서 수정해도 앞 단계의 지침·답변 원문·분석 메모는 유지됩니다.</p>${[Workbook.collectionId,Workbook.analysisId].map(id=>{const step=allSteps.find(item=>item.id===id);return `<h4>${esc(step.title)}</h4><pre class="company-reference-text">${esc(recordText(step)||'아직 작성한 기록이 없습니다.')}</pre><a href="#course/company/${id===Workbook.collectionId?3:4}/write">이 단계에서 기록 보기 →</a>`;}).join('')}</details>`;
}
function updateVerificationRecord(){
  const id=Workbook.verificationId,data=worksheetData(id),cards=Workbook.verificationCards(data);
  for(const [selector,text] of [['#verification-record',Workbook.exportText(id,data)],['#verified-sentences',Workbook.verifiedSentences(data)],['#verification-prompt',Workbook.output(data,id)]]){
    const output=document.querySelector(selector);
    if(output&&output.value!==text){const top=output.scrollTop,left=output.scrollLeft;output.value=text;output.scrollTop=top;output.scrollLeft=left;}
  }
  const complete=cards.filter(card=>!Workbook.validateVerificationCard(card)).length;
  setText('#verification-count',`주장 ${cards.length} / ${Workbook.maxVerificationCards}개 · 기록 작성 ${complete}개 완료`);
  setText('#verification-prompt-status',typeof data.custom==='string'?'직접 수정한 요청문을 보관합니다. 카드 수정으로 덮어쓰지 않습니다.':'카드의 주장·원문·비교 메모를 조합한 요청문입니다. 기업명·기준일·검색 기간을 채워 직접 수정하세요.');
  setText('#verified-count',`사용자 판단으로 선택한 문장 ${cards.filter(card=>['confirmed','corrected'].includes(card.verdict)&&!Workbook.validateVerificationCard(card)).length}개`);
  cards.forEach((card,i)=>setText(`#verification-status-${i}`,`내 판단: ${Workbook.verdictLabel(card.verdict)}${Workbook.validateVerificationCard(card)?' · 작성·대조 필요':''}`));
  document.querySelector('#add-verification-card').disabled=cards.length>=Workbook.maxVerificationCards;
}
function saveVerificationField(index,key,value){
  const id=Workbook.verificationId,cards=Workbook.verificationCards(worksheetData(id));
  if(!cards[index]||!Workbook.verificationFields.some(([name])=>name===key))return false;
  if(key==='verdict'&&value!==''&&!Workbook.verdicts.some(([name])=>name===value))return false;
  if(cards[index][key]===value&&storageOK)return false;
  const changed=cards[index][key]!==value;
  const updated={...cards[index],[key]:value};
  if(changed&&key!=='verdict')updated.verdict='';
  const saved=saveWorksheet(id,'cards',cards.map((card,i)=>i===index?updated:card));
  if(changed&&key!=='verdict'){
    const select=document.querySelector(`#verification-${index}-verdict`);if(select)select.value='';
    setText(`#verification-status-${index}`,'내 판단: 판단 전 · 수정한 내용으로 다시 대조하세요.');
    // Remove stale accepted text immediately, even while an IME syllable is forming.
    const accepted=document.querySelector('#verified-sentences');if(accepted)accepted.value=Workbook.verifiedSentences(worksheetData(id));
  }
  return saved;
}
function renderVerificationCards(){
  const cards=Workbook.verificationCards(worksheetData(Workbook.verificationId));
  document.querySelector('#verification-cards').innerHTML=cards.length?cards.map((card,index)=>`<article class="research-card" aria-labelledby="verification-title-${index}"><div class="research-card-heading"><h4 id="verification-title-${index}">주장 ${index+1}</h4><button type="button" class="secondary" data-remove-verification="${index}" aria-label="주장 ${index+1} 삭제">카드 삭제</button></div><div class="worksheet-grid">${Workbook.verificationFields.map(([key,label,help,example],i)=>`<div class="field-block"><label for="verification-${index}-${key}"><span class="field-number">${i+1}</span>${esc(label)}</label><p id="verification-help-${index}-${key}">${esc(help)}</p>${key==='verdict'?`<select id="verification-${index}-${key}" data-verification-card="${index}" data-verification-field="${key}" aria-describedby="verification-help-${index}-${key}"><option value="" ${!card.verdict?'selected':''}>판단 전 · 대조 후 선택</option>${Workbook.verdicts.map(([value,label])=>`<option value="${value}" ${card.verdict===value?'selected':''}>${label}</option>`).join('')}</select>`:`<textarea id="verification-${index}-${key}" data-verification-card="${index}" data-verification-field="${key}" aria-describedby="verification-help-${index}-${key}" rows="4" placeholder="예: ${esc(example)}">${esc(card[key]||'')}</textarea>`}</div>`).join('')}</div><p class="tiny" id="verification-status-${index}" role="status"></p></article>`).join(''):'<div class="research-empty"><p>아직 검증 카드가 없습니다. 분석에서 실제로 사용할 주장 하나부터 골라보세요.</p></div>';
  document.querySelectorAll('[data-verification-field]').forEach(input=>{
    const saveInput=()=>saveVerificationField(Number(input.dataset.verificationCard),input.dataset.verificationField,input.value);
    const refresh=()=>{if(currentStep?.id===Workbook.verificationId&&selectedTab==='write')updateVerificationRecord();};
    if(input.dataset.verificationField==='verdict'){input.onchange=()=>{saveInput();refresh();};return;}
    let composing=false;const finish=()=>{composing=false;saveInput();refresh();};
    input.oncompositionstart=()=>{composing=true;};
    input.oninput=event=>{composing=composing||Boolean(event.isComposing);const changed=saveInput();if(changed&&!composing)refresh();};
    input.oncompositionend=finish;input.onblur=()=>{if(composing)finish();};
  });
  document.querySelectorAll('[data-remove-verification]').forEach(button=>button.onclick=()=>Viewport.keep(()=>{
    const index=Number(button.dataset.removeVerification),cards=Workbook.verificationCards(worksheetData(Workbook.verificationId));
    if(!cards[index])return;
    if(Workbook.verificationCardText(cards[index]).trim()&&!window.confirm(`주장 ${index+1}의 검증 기록을 삭제할까요?`))return;
    saveWorksheet(Workbook.verificationId,'cards',cards.filter((_,i)=>i!==index));renderVerificationCards();updateVerificationRecord();
    document.querySelector('#add-verification-card').focus({preventScroll:true});notify('검증 카드를 삭제했습니다.');
  }));
}
function renderCompanyVerificationLesson(){
  const id=Workbook.verificationId,el=document.querySelector('#tab-content');
  if(selectedTab==='guide')el.innerHTML=verificationGuide();
  else if(selectedTab==='example')el.innerHTML=verificationExamples();
  else{
    el.innerHTML=`<div class="worksheet-heading"><div><h3>주장과 근거를 대조하고, 내 판단을 기록하세요.</h3><p>카드 내용은 이 브라우저에 자동 저장됩니다. 카드 내용을 바꾸면 이전 판단과 완료 표시가 해제되므로, 직접 대조한 뒤 판단을 마지막에 선택하세요.</p></div></div>${verificationReference()}<div class="research-toolbar"><button class="primary" id="add-verification-card" type="button">검증 카드 추가 +</button><span id="verification-count" class="tiny" role="status"></span></div><div id="verification-cards"></div><section class="output-panel"><div class="output-heading"><h3>내가 원문 대조 후 선택한 문장</h3><span id="verified-count" class="tiny" role="status"></span></div><p>필수 기록을 채우고 ‘확인됨’ 또는 ‘수정 후 확인’으로 선택한 카드만 모읍니다. 웹이 사실을 인증한 결과는 아닙니다. 미확인·오류 확인·판단 전 카드는 아래 전체 기록에 보존됩니다.</p><label class="sr-only" for="verified-sentences">원문 대조 후 선택한 문장</label><textarea id="verified-sentences" rows="8" readonly placeholder="직접 대조한 뒤 판단을 선택하면 문장과 근거가 여기에 모입니다."></textarea><div class="output-actions"><button class="secondary" id="copy-verified-sentences" type="button">선택한 문장 복사</button></div></section><details class="prompt-reference verification-request"><summary>AI에 정확성·누락 정보 재검토 요청하기 · 선택</summary><p>필요하면 요청문을 수정·복사해 외부 AI에 직접 전달하세요. 이 웹은 검색하거나 AI에 전송하지 않습니다. 받은 검토 답변도 직접 원문과 대조한 뒤 카드에 반영하세요.</p><label class="note-label" for="verification-prompt">검증 요청문 · 직접 수정 가능</label><textarea id="verification-prompt" rows="14" aria-describedby="verification-prompt-status"></textarea><p id="verification-prompt-status"></p><div class="output-actions"><button class="primary" id="copy-verification-prompt" type="button">검증 요청문 복사</button><button class="secondary" id="recompose-verification-prompt" type="button">현재 카드로 다시 조합</button></div></details><section class="output-panel"><h3>전체 검증 기록</h3><label class="sr-only" for="verification-record">미확인·제외한 주장을 포함한 전체 검증 기록</label><textarea id="verification-record" rows="10" readonly placeholder="모든 상태의 검증 기록을 함께 보관합니다."></textarea><div class="output-actions"><button class="secondary" id="copy-verification-record" type="button">전체 검증 기록 복사</button><span id="worksheet-status" class="tiny" role="status">${storageOK?'이 브라우저에 자동 저장':'저장 불가 · 내려받기로 보관하세요'}</span></div></section><div class="check-note"><strong>완료하기 전에</strong><p>검증 카드 한 개 이상에서 주장·원문·비교 기준·판단 이유·다음 확인과 상태를 작성하세요. 확인됨·수정 후 확인은 최종 문장도 필요합니다. 미확인이 남아 있어도 조사 기록을 완료할 수 있으며, 완료는 모든 주장이 사실이라는 뜻이 아닙니다.</p></div><details class="legacy-note"><summary>이 단계의 자유 메모</summary><label class="note-label" for="previous-note">추가 메모 · 기존 메모 확인과 수정</label><textarea id="previous-note" rows="5">${esc(state.notes[id]||'')}</textarea></details><div class="next-action"><a class="secondary" href="#notes">내 기록 모아보기 →</a><a class="secondary" href="#backup">백업·복원 →</a></div>`;
    renderVerificationCards();updateVerificationRecord();
    document.querySelector('#add-verification-card').onclick=()=>Viewport.keep(()=>{
      const cards=Workbook.verificationCards(worksheetData(id));if(cards.length>=Workbook.maxVerificationCards)return;
      saveWorksheet(id,'cards',[...cards,{}]);renderVerificationCards();updateVerificationRecord();document.querySelector(`#verification-${cards.length}-claim`).focus({preventScroll:true});
    });
    const prompt=document.querySelector('#verification-prompt');
    let composing=false;prompt.oncompositionstart=()=>{composing=true;};
    prompt.oninput=event=>{composing=composing||Boolean(event.isComposing);saveWorksheet(id,'custom',prompt.value);if(!composing)updateVerificationRecord();};
    const finish=()=>{composing=false;saveWorksheet(id,'custom',prompt.value);updateVerificationRecord();};prompt.oncompositionend=finish;prompt.onblur=()=>{if(composing)finish();};
    document.querySelector('#recompose-verification-prompt').onclick=()=>Viewport.keep(()=>{
      const data=worksheetData(id);if(typeof data.custom==='string'&&data.custom!==Workbook.compose(data,id)&&!window.confirm('직접 수정한 검증 요청문을 현재 카드로 다시 조합할까요?'))return;
      // Recompose only the optional request. The user's card judgments remain intact.
      if(typeof data.custom==='string'){delete data.custom;save();}updateVerificationRecord();notify('현재 카드로 검증 요청문을 조합했습니다.');
    });
    for(const [button,selector,get] of [
      ['#copy-verified-sentences','#verified-sentences',()=>Workbook.verifiedSentences(worksheetData(id))],
      ['#copy-verification-prompt','#verification-prompt',()=>Workbook.output(worksheetData(id),id)],
      ['#copy-verification-record','#verification-record',()=>Workbook.exportText(id,worksheetData(id))]
    ])document.querySelector(button).onclick=()=>copyText(get(),document.querySelector(selector));
    document.querySelector('#previous-note').oninput=event=>{state.notes[id]=event.target.value;save();};
  }
  bindLessonButtons();return true;
}
