'use strict';
// PDF pp.10–12 structure, with explicitly supplementary forms and fictional examples.
window.CompanyAnalysis=(()=>{
  const questions=[
    ['position','산업 내 위치·강점','이 기업의 산업 내 위치와 강점은 무엇인가요?'],
    ['investment','집중 사업·투자','최근 집중 사업·신사업·투자와 연구개발 방향은 무엇인가요? 계획과 실제 성과를 나눠 주세요.'],
    ['competition','경쟁사와 차별점','[경쟁사명]과 비교했을 때 어떤 차별점이 있나요? 같은 기간·단위·비교 기준으로 정리해 주세요.'],
    ['workplace','근무 환경·기업 문화','근무 환경과 기업 문화에서 확인 가능한 특징은 무엇인가요? IT 업계의 [비교 기업]과 같은 기준으로 비교하고, 회사의 소개와 확인된 사실을 구분해 주세요.']
  ];
  const followup=key=>{const question=questions.find(([id])=>id===key);return question?`[대상 기업 / 기준일 / 비교 기간 / 사용할 자료·근거 위치를 직접 작성하세요]\n\n${question[2]}\n\n제공 자료의 근거 위치, 해석, 미확인을 나누어 답해 주세요. 근거가 없으면 추정해서 채우지 말고 필요한 자료를 알려 주세요. 추가 검색을 원하면 검색할 기간과 자료 범위를 별도로 지정하겠습니다.`:'';};
  const example={
    title:'다온테크 · 수익 구조에서 SWOT까지 연결하기',
    sources:'학습용 가상 자료 A: 사업보고서 12쪽 “기업 고객용 주문 관리 서비스와 유지보수 제공.”\n자료 B: 공식 뉴스룸 3문단 “물류 연동 기능을 개발할 계획.”\n자료 C: 채용 소개 2문단 “문서로 결정 과정을 공유하는 인재 지향.”',
    overview:'사실·출처: 자료 A 12쪽에 주문 관리 서비스와 유지보수가 사업으로 소개됨.\n해석: 서비스 운영과 지속적인 유지보수 관점에서 수익 구조를 살펴볼 수 있음.\n미확인·다음 질문: 매출·영업이익 수치와 서비스별 비중은 제공되지 않음. 같은 기간의 재무제표와 부문별 자료 필요.',
    market:'사실·출처: 자료 A는 기업 고객용 서비스임을 설명함.\n해석: 기업 고객 시장을 우선 조사할 수 있음.\n미확인·다음 질문: 점유율·주요 경쟁사·차별점은 이 자료로 확인 불가. 같은 기간의 산업 보고서와 비교 기업 자료 필요.',
    business:'사실·출처: 자료 B 3문단은 물류 연동 기능의 개발 계획을 발표함.\n해석: 기존 주문 관리 서비스와의 연계 가능성을 조사할 수 있음.\n미확인·다음 질문: 출시·투자 금액·성과는 미확인. 후속 공식 발표와 실제 출시 기록 필요.',
    culture:'사실·출처: 자료 C 2문단은 문서로 결정 과정을 공유하는 인재를 지향한다고 소개함.\n해석: 문서화 경험을 묻는 면접 질문에 대비할 수 있음.\n미확인·다음 질문: 실제 팀 문화·근무 환경·복지는 이 문구만으로 확인 불가. 채용 설명과 인터뷰에서 추가 확인.',
    swot:'강점 후보(내부·해석): 서비스와 유지보수를 함께 제공함(자료 A). 실제 경쟁 우위인지는 비교 자료 필요.\n약점(내부): 미확인. 운영·재무 리스크 자료 필요.\n기회(외부): 미확인. 물류 연동 계획(자료 B)만으로 시장 수요 증가를 단정하지 않음. 산업 수요 자료 필요.\n위협(외부): 미확인. 경쟁 환경·규제 등 같은 기간의 근거 필요.'
  };
  return {questions,followup,example};
})();
function analysisGuide(){
  return `<div class="lesson-lead"><span class="eyebrow">수집 정보 요약 및 분석</span><h3>모은 자료를 다섯 영역으로 연결하세요.</h3><p>사업보고서와 증권사 리포트, 공식 뉴스룸·대표 신년사·최근 주요 언론 보도 중 실제로 확보한 자료를 정리합니다. 자기소개서·면접에서 기업을 설명할 수 있도록 전체 분석을 먼저 하고, 직무·경험 연결은 마지막에 덧붙이세요.</p></div><div class="stage-cards">${Workbook.analysisAreas.map(([,label,help],i)=>`<article class="stage-card"><span class="stage-index">0${i+1}</span><h3>${esc(label)}</h3><p>${esc(help)}</p></article>`).join('')}</div><h3>지침 준비부터 검증까지</h3><ol class="instruction-list"><li><strong>지침과 자료 준비</strong><p>3단계에서 직접 수정한 지침을 확인하고 4단계 자료 카드에서 필요한 원문과 출처를 고릅니다. 뉴스룸·신년사·언론 보도도 발행일과 대상 기간을 함께 적으세요.</p></li><li><strong>외부 AI에 직접 전달</strong><p>작성 공간에서 분석 요청문을 검토·복사하고 실제 자료를 함께 전달합니다. Claude나 Gemini 등 선택한 도구에 자료를 전달하세요. 현재 메뉴·파일 입력·검색 기능은 선택한 도구에서 확인하세요. 이 웹은 요청문 작성·복사만 지원합니다.</p></li><li><strong>원문 보관과 분석 메모</strong><p>받은 답변을 그대로 보관하고, 다섯 영역마다 사실·출처 위치 / 내 해석 / 미확인·다음 질문을 나누어 직접 정리하세요. 수치·키워드·불릿을 활용하되 자료가 없는 항목은 미확인으로 남깁니다.</p></li><li><strong>추가 질문과 검증</strong><p>산업 내 위치, 집중 사업, 경쟁사 차이, 근무 환경 중 필요한 질문을 고릅니다. 비교 기업과 기간을 지정하고, 답변은 근거 원문과 직접 대조하세요.</p></li></ol><div class="next-action">${lessonButton('다섯 영역 분석 예시 보기','example')}</div>`;
}
function analysisExamples(){
  const item=CompanyAnalysis.example;
  return `<div class="gallery-heading"><h3>${esc(item.title)}</h3><span class="badge">학습용 가상 사례</span></div><div class="tip-box">자료와 기업은 모두 가상입니다. 예시는 내 작성칸에 자동 입력되지 않습니다.</div><div class="weak-prompt"><span class="eyebrow">근거가 부족한 분석</span><p>신사업을 추진하니 시장 1위이고, 자유로운 기업 문화에 성장성이 높은 회사다.</p></div><h4>실제로 제공한 자료</h4><pre class="company-reference-text">${esc(item.sources)}</pre><div class="example-gallery">${Workbook.analysisAreas.map(([key,label],i)=>exampleDetail(i,label,`<pre class="company-reference-text">${esc(item[key])}</pre>`)).join('')}</div><div class="adapt-note"><strong>무엇이 달라졌나요?</strong><p>개발 계획을 성과로, 채용 소개를 실제 근무 환경으로 확대하지 않았습니다. SWOT의 모든 칸을 억지로 채우지 않고 판단 근거와 필요한 자료를 남겼습니다.</p></div><div class="next-action">${lessonButton('내 기업 분석 작성하기','write')}</div>`;
}
function analysisReference(){
  const prompt=Workbook.output(state.worksheets['1-2']||{},'1-2');
  const sources=recordText(allSteps.find(step=>step.id===Workbook.collectionId));
  return `<details class="prompt-reference"><summary>3단계 지침과 4단계 자료 기록 참고하기</summary><p>기존 기록은 읽기 전용입니다. 사용할 부분만 골라 아래 자료 칸에 직접 옮기세요.</p><h4>직접 수정한 지침</h4><pre class="company-reference-text">${esc(prompt||'아직 저장한 지침이 없습니다.')}</pre><a href="#course/company/2/write">3단계 지침 보기 →</a><h4>수집한 자료</h4><pre class="company-reference-text">${esc(sources||'아직 저장한 자료 기록이 없습니다.')}</pre><a href="#course/company/3/write">4단계 자료 카드 보기 →</a></details>`;
}
function renderCompanyAnalysisLesson(){
  const id=Workbook.analysisId,el=document.querySelector('#tab-content');
  if(selectedTab==='guide')el.innerHTML=analysisGuide();
  else if(selectedTab==='example')el.innerHTML=analysisExamples();
  else{
    const fields=Workbook.fields(id),d=worksheetData(id);
    el.innerHTML=`<div class="worksheet-heading"><div><h3>기업 전체를 분석하고, 근거와 질문을 남기세요.</h3><p>입력 내용은 이 브라우저에 자동 저장됩니다. 요청문을 직접 복사해 외부 AI에서 실행한 뒤, 답변과 내 분석을 따로 보관하세요.</p></div><span class="badge" id="filled-count"></span></div>${analysisReference()}<h3 class="analysis-section">1. 분석 요청 준비</h3><div class="worksheet-grid">${fields.slice(0,2).map((field,i)=>renderField(id,field,i)).join('')}</div>${renderPromptEditor()}<div class="tip-box">요청문은 위 두 입력칸과 분석 기준을 조합합니다. 3단계 지침은 필요하면 외부 AI에 함께 전달하세요. 아래 답변·분석 메모를 편집해도 직접 수정한 요청문은 유지됩니다.</div><h3 class="analysis-section">2. 받은 답변 보관</h3>${renderField(id,fields[2],2)}<h3 class="analysis-section">3. 다섯 영역 직접 정리</h3><p>각 영역에서 확인한 내용, 내 해석, 더 알아볼 질문을 정리하세요. 자료가 없는 부분은 미확인과 필요한 자료를 기록하면 됩니다.</p><div class="worksheet-grid analysis-fields">${fields.slice(3).map((field,i)=>renderField(id,field,i+3)).join('')}</div><section class="output-panel"><h3>더 알아볼 질문 고르기</h3><p>질문을 골라 내용을 복사한 뒤 대상 기업·기간·비교 기준과 자료를 직접 채우세요.</p><label class="note-label" for="analysis-question">추가 질문 유형</label><select id="analysis-question">${CompanyAnalysis.questions.map(([key,label])=>`<option value="${key}">${esc(label)}</option>`).join('')}</select><label class="note-label" for="analysis-followup">추가 질문 예시 · 읽기 전용</label><textarea id="analysis-followup" readonly rows="7">${esc(CompanyAnalysis.followup('position'))}</textarea><div class="output-actions"><button class="secondary" id="copy-analysis-followup" type="button">추가 질문 복사</button></div></section><div class="check-note"><strong>완료하기 전에</strong><p>기업·자료·받은 답변과 다섯 분석 영역을 작성하세요. 직무·경험 연결은 선택 항목입니다. 완료 표시는 작성 점검이며 기업 정보의 사실 인증이 아닙니다. 최종 문장은 원문을 직접 열어 대조하세요.</p></div><div class="output-actions"><button class="primary" id="copy-analysis-record" type="button">분석 기록 전체 복사</button><a class="secondary" href="#notes">내 기록 모아보기 →</a><a class="secondary" href="#backup">백업·복원 →</a></div><details class="full-prompt" id="analysis-record-details"><summary>분석 기록 전체 보기 · 복사가 안 되면 직접 선택하세요</summary><label class="sr-only" for="analysis-record">분석 기록 전체</label><textarea id="analysis-record" readonly rows="12">${esc(Workbook.exportText(id,d))}</textarea></details><details class="legacy-note"><summary>이 단계의 자유 메모</summary><label class="note-label" for="previous-note">추가 메모 · 기존 메모 확인과 수정</label><textarea id="previous-note" rows="5">${esc(state.notes[id]||'')}</textarea></details>`;
    bindPromptEditor(id);
    const question=document.querySelector('#analysis-question'),followup=document.querySelector('#analysis-followup');
    question.onchange=()=>{followup.value=CompanyAnalysis.followup(question.value);};
    document.querySelector('#copy-analysis-followup').onclick=()=>copyText(followup.value,followup);
    document.querySelector('#copy-analysis-record').onclick=()=>{const target=document.querySelector('#analysis-record');target.value=Workbook.exportText(id,worksheetData(id));document.querySelector('#analysis-record-details').open=true;return copyText(target.value,target);};
    document.querySelector('#previous-note').oninput=event=>{state.notes[id]=event.target.value;save();};
  }
  bindLessonButtons();return true;
}
