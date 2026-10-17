'use strict';
// Teaching guidance checked against company-source.pdf pages 1–5; examples are fictional.
window.CompanyLessons=(()=>{
  const cases={
    '1-0':[
      {
        title:'백엔드 지원 · 회사 칭찬보다 공고와 경험의 연결 찾기',
        weak:'다온테크는 유망한 회사이니 좋은 점을 찾아줘.',
        data:{target:'다온테크 / 신입 백엔드 개발자',question:'공고의 어떤 요구 사항에 내 API 개발 경험을 연결할 수 있을까?',sources:'학습용 가상 채용 공고: “주문 API 개발 및 운영, SQL을 활용한 데이터 처리.” 실제 지원 시 공식 공고 URL과 확인일을 기록한다.',facts:'확인: 이 공고에는 주문 API와 SQL 관련 업무가 명시되어 있다.\n미확인: 회사가 주문 처리 시스템을 전면 개편하고 있다는 추측.\n다음 행동: 공식 발표와 공고 추가 설명을 확인하고, 근거가 없으면 미확인으로 남긴다.'},
        why:['기업 이름만 던지는 대신 지원 직무와 답할 질문을 정했습니다.','공고에 적힌 업무와 회사 내부 사정에 대한 추측을 구분했습니다.'],
        adapt:'실제 공고의 담당 업무 한 줄을 옮겨 적고, 그 문구만으로는 알 수 없는 내용 한 가지를 분리해 보세요.'
      },
      {
        title:'서비스 기획 지원 · 한 문구를 사업 성과로 확대하지 않기',
        weak:'고객 중심 회사니까 사용자 만족도가 높다고 쓰면 되겠지?',
        data:{target:'모아서비스 / 신입 서비스 기획자',question:'사용자 의견 정리 경험이 공고의 어떤 업무와 연결되는가?',sources:'학습용 가상 공고 발췌: “사용자 피드백 분류, 개선 과제 정리 및 유관 부서 협의.” 확인할 자료: 공식 공고 원문과 회사의 공개 서비스 소개.',facts:'확인: 피드백 분류와 개선 과제 정리가 업무로 제시됐다.\n미확인: 실제 사용자 만족도, 현재 고객 불만의 원인과 규모.\n다음 행동: 공개 조사나 공식 발표가 없으면 만족도·불만 규모를 단정하지 않는다.'},
        why:['관심 있는 업무를 기준으로 분석 범위를 좁혔습니다.','채용 공고의 업무 설명을 검증되지 않은 기업 성과로 바꾸지 않았습니다.'],
        adapt:'공식 자료에서 확인한 한 문장과, 그 문장을 읽고 떠올린 내 해석을 따로 적어 보세요.'
      }
    ],
    '1-1':[
      {
        title:'최신 자료 검색 · 검색이 가능한지부터 확인하기',
        weak:'어떤 AI든 회사 이름을 넣으면 최신 정보가 나올 거야.',
        data:{task:'지원 기업의 최근 공개 사업 자료 찾기',tool:'Gemini 또는 Perplexity를 검색 후보로 비교. 현재 계정에서 검색·관련 출처가 제공되는지 확인한 뒤 선택. 최신 정보라는 설명만으로 신뢰하지 않음.',materials:'기업명, 찾을 자료 종류, 필요한 기준 기간. 계정 정보나 비공개 자료는 제공하지 않는다.',verification:'원문 링크를 직접 열어 해당 기업의 자료인지, 게시일과 대상 기간이 맞는지 확인한다. 원문이 없으면 확인된 사실로 쓰지 않는다.'},
        why:['최신성이 필요한 작업임을 먼저 정했습니다.','그럴듯한 답변보다 실제로 열리는 원문과 날짜를 확인 기준으로 삼았습니다.'],
        adapt:'사용할 도구에서 검색 기능과 출처 링크를 직접 확인하고, 확인한 기능만 선택 이유에 적으세요.'
      },
      {
        title:'자료 요약 · 이미 가진 자료 안에서 정리하기',
        weak:'회사 소개 자료를 넣었으니 매출 성장 원인도 알아서 설명해 줘.',
        data:{task:'확보한 공개 회사 소개와 사업 설명을 핵심 항목으로 요약하기',tool:'Claude를 문서 분석 후보로 검토. 해당 계정에서 필요한 자료 형식·분량을 제공할 수 있는지 확인하고 주장마다 문서 위치를 요청한다.',materials:'공개 자료에서 필요한 부분만 발췌하고 자료명, 출처, 대상 기간을 붙인다.',verification:'요약의 각 주장을 제공 자료와 대조한다. 원문에 없는 “해외 매출 증가”나 기간이 다른 수치는 미확인으로 표시하거나 제외한다.'},
        why:['자료 요약과 추가 조사·추론을 구분했습니다.','입력한 자료에 없는 주장이 섞였는지 점검할 기준을 정했습니다.'],
        adapt:'자료 한 단락을 골라 요약한 뒤, 각 문장을 뒷받침하는 원문이 있는지 직접 짚어 보세요.'
      },
      {
        title:'공고와 경험 비교 · 없는 경험을 채워 넣지 않기',
        weak:'공고를 보고 내가 완벽한 지원자인 것처럼 만들어 줘.',
        data:{task:'공고의 담당 업무·필수 요건과 내 실제 프로젝트 경험 비교하기',tool:'제공한 글을 항목별로 비교할 수 있는 도구를 직접 선택한다. 부족한 경험을 질문으로 남기도록 요청한다.',materials:'공고 원문과 내가 맡은 기능·직접 한 행동·확인한 결과. 팀원의 담당 업무는 내 경험과 분리한다.',verification:'공고의 필수·우대 구분이 유지되는지, 사용하지 않은 기술이나 측정하지 않은 수치를 추가했는지 확인한다.'},
        why:['요구 사항을 맞추기 위해 경험을 만들어 내는 대신 준비할 부분을 찾습니다.','팀 전체 성과와 내 역할을 구분할 기준을 두었습니다.'],
        adapt:'연결 가능한 경험 한 가지와 아직 근거가 부족한 요구 사항 한 가지를 골라 보세요.'
      }
    ],
    '1-2':[
      {
        title:'백엔드 · 공고 요구와 API 개발 경험 비교',
        weak:'다온테크 기업 분석해 줘. 자소서에 쓸 내용도 만들어 줘.',
        data:{target:'다온테크 / 신입 백엔드 개발',question:'공고의 주요 요구와 내 실제 경험을 비교해, 지원 준비에 필요한 근거와 추가 질문을 정리하기',sources:'[학습용 가상 공고]\n담당 업무: 주문 API 개발 및 운영, SQL을 활용한 데이터 처리.\n실제 사용 시 이 칸에 공식 공고의 출처와 확인일, 필요한 원문을 함께 적는다.',experience:'학력·교육: 컴퓨터공학 전공, 웹 개발 교육 수료. 기술·어학 자격: 미취득. Main: SQL 조회 구현 / Sub: Git 공동 작업. 주요 프로젝트 1: 주문 조회 서비스 / 담당: API·SQL·명세 / 문제: 조회 조건 누락 / 행동: 재현 후 SQL 조건 수정 / 결과: 테스트 통과 / 근거: 코드·명세·실행 기록. 추가 프로젝트 없음. 운영 성과 미측정.',format:'공고 요구 / 내 경험과 연결점 / 부족한 근거 / 추가 질문 순서의 표. 근거가 없는 칸은 비워 두지 말고 미확인으로 표시하기.',rules:'제공한 자료만 사용하세요. 없는 기업 정보·기술·성과 수치를 만들지 마세요. 자료에서 확인한 사실과 해석을 구분하고 근거가 없으면 미확인으로 표시하세요. 링크나 파일을 읽지 못하면 읽었다고 가정하지 말고 필요한 내용을 요청하세요.'},
        why:['기업·직무, 목적, 공고와 경험을 각각 제공했습니다.','표의 항목에 부족한 근거와 질문을 포함해 다음 준비로 이어집니다.','측정하지 않은 성과와 읽지 못한 자료를 사실처럼 채우지 않도록 했습니다.'],
        adapt:'기업과 직무를 바꾼 뒤 공고 원문과 내 경험을 모두 교체하세요. 예시의 기술·성과를 내 경험으로 옮기지 마세요.'
      },
      {
        title:'고객 운영 · 행사 안내 개선 경험과 직무 연결',
        weak:'고객 중심 회사에 맞는 멋진 지원 동기를 써줘.',
        data:{target:'모아서비스 / 신입 고객 운영',question:'반복 문의를 정리한 경험과 공고의 업무를 연결하고, 지원 동기를 쓰기 전에 확인할 내용을 찾기',sources:'[학습용 가상 공고]\n고객 문의 분류, 반복 문의 안내 개선, 제품 개선 의견 정리.\n회사의 내부 운영 방식과 실제 문의량은 제공되지 않았다.',experience:'학력·교육: 경영학 전공 / 기술·어학 자격: 미취득 / Main: 스프레드시트 문의 분류 / Sub: 공동 문서 편집. 주요 활동: 동아리 행사 신청 안내 / 담당: 문의 정리·안내문 / 문제: 반복 문의 / 행동: 유형 분류·안내문 수정·운영진 확인 / 결과: 수정 안내문 게시 / 근거: 안내문 변경 이력. 문의 감소량·만족도 미측정. 개발 프로젝트 없음.',format:'공고의 업무 / 내 행동의 근거 / 연결해서 설명할 수 있는 점 / 더 확인할 질문을 항목별로 정리하기. 지원 동기 완성문은 아직 작성하지 않기.',rules:'공고에 없는 회사 전략과 만족도·문의 감소 수치를 만들지 마세요. 동아리 경험을 회사 근무 경험처럼 표현하지 마세요. 연결이 약한 부분은 이유를 설명하고 추가 질문을 해주세요.'},
        why:['추상적인 회사 칭찬을 실제 공고의 업무로 바꿨습니다.','글을 바로 완성하기 전에 사용할 근거부터 점검하게 했습니다.','경험의 범위와 측정하지 않은 결과를 분명히 했습니다.'],
        adapt:'개발 경험이 없어도 괜찮습니다. 실제 활동에서 직접 한 행동과 직무의 업무를 나란히 적어 보세요.'
      }
    ]
  };
  const weak={
    '1-0':{target:'좋은 회사',question:'회사 분석 잘하기',sources:'인터넷에서 본 내용',facts:'회사가 성장 중일 것 같다.'},
    '1-1':{task:'기업 분석',tool:'유명해서 선택',materials:'가지고 있는 자료 전부',verification:'답변이 자연스러우면 사용'},
    '1-2':{target:'취업할 회사',question:'자소서에 쓸 만한 내용',sources:'회사 링크만 붙이기',experience:'프로젝트를 성공적으로 했다.',format:'깔끔하게 정리',rules:'완벽하게 분석해 줘.'}
  };
  const fieldHelp=Object.fromEntries(Object.entries(cases).map(([id,items])=>[id,Object.fromEntries(Workbook.fields(id).map(([key,,help])=>[key,{weak:weak[id][key],good:items[0].data[key],tip:help}]))]));
  const accuracyRules=[
    '근거가 부족하면 내용을 만들지 말고 알 수 없음 또는 확인 필요로 표시하세요.',
    '확인할 수 있는 자료를 차례로 대조하고, 출처가 모호하거나 불확실한 주장은 구분하세요.',
    '확인한 정보로 답변을 구성하고 추정이 필요한 부분은 추정과 그 이유를 따로 밝히세요.',
    '질문이 모호하거나 자료가 부족하면 결론을 내리기 전에 필요한 맥락과 추가 자료를 물어보세요.',
    '확인되지 않은 사실을 단정하지 말고 판단의 근거와 확인하지 못한 범위를 함께 제시하세요.',
    '자료가 있다면 주장별 출처·원문 위치·날짜와 핵심 근거를 적고, 읽지 못한 링크나 파일은 알려 주세요.'
  ];
  const accuracyPrompt='기업 분석을 도와줄 때 다음 기준을 지켜 주세요.\n'+accuracyRules.map((rule,i)=>`${i+1}. ${rule}`).join('\n');
  const tools=[
    ['Gemini','최근 기업 소식·산업 동향을 찾을 때 검색과 관련 출처 제공 여부를 확인할 후보입니다. 답변에 항상 출처가 붙는다고 가정하지 말고 공식 자료의 날짜·대상 기업·원문을 직접 대조하세요.','https://gemini.google.com/?hl=ko'],
    ['Claude','사업보고서·IR 등 확보한 문서를 읽고 항목별로 정리할 때 검토할 후보입니다. 계정의 파일 형식·분량 지원을 확인하고, 문서의 근거 위치와 자료 밖의 해석을 구분하도록 요청하세요.','https://claude.ai/'],
    ['Perplexity','웹 검색과 인용 링크를 바탕으로 조사 경로를 찾을 때 검토할 후보입니다. 원문을 열어 실제 주장을 뒷받침하는지 확인하고 같은 자료의 재인용을 독립 근거로 세지 마세요.','https://www.perplexity.ai/']
  ];
  return {cases,fieldHelp,accuracyRules,accuracyPrompt,tools};
})();

function companyAccuracyGuide(){return `<section class="company-accuracy"><h3>기업 분석 전에 정할 정확성 검증 지침</h3><p>AI는 사고와 자료 정리를 돕는 도구입니다. 할루시네이션으로 존재하지 않는 정보를 사실처럼 말하거나, 제공한 자료를 잘못 해석할 수 있습니다. 검증 지침을 적어도 정확성이 보장되는 것은 아니므로 원문과 다른 근거를 직접 교차 확인하세요.</p><ol class="instruction-list">${CompanyLessons.accuracyRules.map(rule=>`<li>${esc(rule)}</li>`).join('')}</ol><details class="prompt-reference"><summary>복사해서 사용할 검증 지침</summary><label class="sr-only" for="company-accuracy-prompt">기업 분석 정확성 검증 지침</label><textarea id="company-accuracy-prompt" rows="8" readonly>${esc(CompanyLessons.accuracyPrompt)}</textarea><button type="button" class="secondary" id="copy-company-accuracy">검증 지침 복사</button></details></section>`;}
function companyToolGuide(){return `<section><h3>기업 분석에 활용할 도구 후보</h3><div class="stage-cards three">${CompanyLessons.tools.map(([name,description,url])=>`<article class="stage-card"><h3>${esc(name)}</h3><p>${esc(description)}</p><a class="text-button" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)} 열기 ↗</a></article>`).join('')}</div><p>작업에 맞춰 비교하고 현재 계정의 기능·이용 조건을 확인하세요. 특정 도구의 분석 정확도나 최신성을 보장하지 않습니다.</p></section>`;}
function companyPromptFields(id){let number=0;return Workbook.companyPromptGroups.map(group=>`<section class="prompt-group"><h3>${esc(group.title)}</h3><p>${esc(group.help)}</p><div class="worksheet-grid">${group.keys.map(key=>{const i=Workbook.fields(id).findIndex(f=>f[0]===key);return renderField(id,Workbook.fields(id)[i],number++);}).join('')}</div></section>`).join('');}
function companyGuide(id){
  if(id==='1-0')return `<div class="lesson-lead"><span class="eyebrow">분석의 출발점</span><h3>회사 소개를 모으기 전에, 답할 질문 하나를 정하세요.</h3><p>기업 분석의 목적은 지원할 회사와 직무를 이해하고 내 경험과 연결할 근거를 찾는 것입니다. AI는 자료 정리와 질문 만들기에 활용하고, 기업·실적·채용 정보의 사실 여부는 원문으로 직접 확인하세요.</p></div><div class="stage-cards three"><article class="stage-card"><span class="stage-index">01</span><h3>지원 범위 정하기</h3><p>기업, 직무, 채용 수준을 적고 이번에 알아낼 질문 하나를 고릅니다.</p></article><article class="stage-card"><span class="stage-index">02</span><h3>자료에 근거 붙이기</h3><p>공식 자료나 공고의 문구를 출처·기준일과 함께 기록합니다. AI의 답변 자체를 출처로 쓰지 않습니다.</p></article><article class="stage-card"><span class="stage-index">03</span><h3>사실과 추측 나누기</h3><p>확인한 사실, 내 해석, 아직 모르는 점을 분리합니다. 확인할 수 없으면 미확인으로 남깁니다.</p></article></div><div class="check-note"><strong>이 단계에서 남길 것</strong><p>분석 질문 하나와 근거 자료, 사실·미확인 구분입니다. 자료가 아직 없다면 찾을 자료부터 정해도 좋습니다.</p></div>${companyAccuracyGuide()}<div class="next-action">${lessonButton('목표와 사실 구분 예시 보기','example')}</div>`;
  if(id==='1-1')return `<div class="lesson-lead"><span class="eyebrow">작업에 맞는 도구 선택</span><h3>어떤 도구인가보다, 지금 할 일을 지원하는지 확인하세요.</h3><p>최신 공개 자료를 찾는 일과 이미 확보한 자료를 정리하는 일에는 필요한 기능이 다릅니다. 아래 작업별 기준을 읽고 사용할 도구에서 해당 기능을 직접 확인하세요.</p></div><div class="stage-cards three"><article class="stage-card"><span class="stage-index">01</span><h3>최신 자료 찾기</h3><p>웹 검색과 원문 링크 제공 여부를 확인합니다.</p><dl><dt>직접 점검할 것</dt><dd>원문이 열리는지, 해당 기업 자료인지, 게시일과 대상 기간이 맞는지.</dd></dl></article><article class="stage-card"><span class="stage-index">02</span><h3>모은 자료 요약</h3><p>입력 가능한 문서 형식·분량과 자료 근거 표시 방법을 확인합니다.</p><dl><dt>직접 점검할 것</dt><dd>자료 밖의 주장이나 다른 기간의 수치가 섞이지 않았는지.</dd></dl></article><article class="stage-card"><span class="stage-index">03</span><h3>공고와 경험 비교</h3><p>제공한 글을 항목별로 비교할 수 있는지 확인합니다.</p><dl><dt>직접 점검할 것</dt><dd>원래 공고의 요구와 내가 실제로 한 경험을 바꾸지 않았는지.</dd></dl></article></div>${companyToolGuide()}<div class="tip-box">서비스별 기능·이용 조건은 직접 확인하세요. 이 화면에서는 필요한 작업과 선택 이유를 정리합니다. 실제 도구 사용은 선택한 서비스에서 진행하세요.</div><div class="next-action">${lessonButton('작업별 선택 예시 보기','example')}</div>`;
  return `<div class="lesson-lead"><span class="eyebrow">내 자료로 만드는 분석 요청</span><h3>기업·공고와 내 경험을 함께 제공하세요.</h3><p>나의 정보는 재사용할 배경으로 정리하고, 해결하고자 하는 문제·출력 방법·마무리는 작업에 맞춰 바꿉니다. 기업·직무·자료를 제공하고 부족한 정보는 질문하도록 기준을 정하세요.</p></div><ol class="instruction-list">${Workbook.companyPromptGroups.map(group=>`<li><strong>${esc(group.title)}</strong><p>${esc(group.help)}</p></li>`).join('')}</ol><div class="check-note"><strong>작성 후 이어갈 순서</strong><p>프롬프트를 직접 검토·복사 → 선택한 외부 AI에 직접 붙여 넣기 → 받은 답변을 출처·기준일·내 경험과 대조하기. 이 화면은 입력값을 조합하며 자동 기업 조사는 실행하지 않습니다.</p></div><div class="next-action">${lessonButton('직무별 완성 예시 보기','example')}</div>`;
}
function companyExamples(id){
  const items=window.CompanyLessons.cases[id];
  return `<div class="gallery-heading"><h3>예시를 읽고 내 자료로 바꿔 보세요.</h3><span class="badge">${items.length}가지 비교 사례</span></div><p>부족한 요청과 입력칸을 채운 예시를 비교하고, 왜 이렇게 작성했는지 확인하세요.</p><div class="tip-box example-disclosure">학습용 가상 기업·공고·경험입니다. 자신의 실제 자료와 경험으로 바꿔 쓰세요.</div><div class="example-gallery">${items.map((item,index)=>exampleDetail(index,item.title,`<div class="weak-prompt"><span class="eyebrow">정보가 부족한 요청</span><p>${esc(item.weak)}</p></div><h4>입력칸은 이렇게 채웁니다</h4><dl class="example-fields">${Workbook.fields(id).map(([key,label],i)=>`<div><dt><span>${i+1}</span>${esc(label)}</dt><dd>${esc(item.data[key])}</dd></div>`).join('')}</dl>${Workbook.isPrompt(id)?`<details class="full-prompt"><summary>이 입력을 연결한 완성 프롬프트 보기</summary><div class="example-block"><pre>${esc(Workbook.compose(item.data,id))}</pre></div></details>`:''}<h4>무엇이 좋아졌나요?</h4>${examplePoints(item.why)}<div class="adapt-note"><strong>내 정보로 적용하기</strong><p>${esc(item.adapt)}</p></div>${lessonButton('내 내용 작성하기','write')}`)).join('')}</div>`;
}
function companyPreparationReference(){
  const records=['1-0','1-1'].map(id=>({id,text:recordText(allSteps.find(step=>step.id===id))})).filter(item=>item.text.trim());
  if(!records.length)return `<div class="tip-box">아직 분석 목표나 도구 선택을 정리하지 않았나요? <a href="#course/company/0/write">분석 목표 작성</a> 또는 <a href="#course/company/1/write">도구 선택 정리</a>를 먼저 해볼 수 있습니다. 준비한 자료가 있다면 아래에서 바로 작성해도 좋습니다.</div>`;
  return `<details class="prompt-reference"><summary>앞 단계에서 정리한 내 기록 참고하기</summary><p>분석 질문과 선택 기준을 보며 아래 입력칸을 채우세요. 기존 기록은 자동으로 덮어쓰지 않습니다.</p>${records.map(({id,text})=>`<h4>${esc(allSteps.find(step=>step.id===id).title)}</h4><pre class="company-reference-text">${esc(text)}</pre>`).join('')}</details>`;
}
function updateCompanyRecord(id){
  const data=worksheetData(id),text=Workbook.exportText(id,data),output=document.querySelector('#company-record');
  if(output&&output.value!==text){const top=output.scrollTop,left=output.scrollLeft;output.value=text;output.scrollTop=top;output.scrollLeft=left;}
  const fields=Workbook.fields(id),filled=fields.filter(([key])=>typeof data[key]==='string'&&data[key].trim()).length;
  setText('#filled-count',`${filled} / ${fields.length}개 항목 작성`);
  setText('#record-count',text.length+'자');
}
function renderCompanyLesson(){
  const id=currentStep.id,el=document.querySelector('#tab-content');
  if(id===Workbook.collectionId)return renderCompanyResearchLesson();
  if(id===Workbook.analysisId)return renderCompanyAnalysisLesson();
  if(id===Workbook.verificationId)return renderCompanyVerificationLesson();
  if(id===Workbook.postingId)return renderCompanyPostingLesson();
  if(id===Workbook.roleId)return renderCompanyRoleLesson();
  if(!window.CompanyLessons.cases[id])return false;
  if(selectedTab==='guide')el.innerHTML=companyGuide(id);
  else if(selectedTab==='example')el.innerHTML=companyExamples(id);
  else{
    const prompt=Workbook.isPrompt(id),titles={'1-0':'분석의 목적과 확인할 사실부터 적어보세요.','1-1':'작업과 도구 선택 이유를 정리하세요.','1-2':'여섯 가지 정보로 기업 분석 요청문을 만드세요.'};
    el.innerHTML=`<div class="worksheet-heading"><div><h3>${titles[id]}</h3><p>각 입력칸 아래에서 예시 비교를 펼쳐 볼 수 있습니다. 입력 내용은 이 브라우저에 자동 저장됩니다.</p></div><span class="badge" id="filled-count"></span></div>${prompt?companyPreparationReference():''}${id==='1-2'?companyPromptFields(id):`<div class="worksheet-grid">${Workbook.fields(id).map((field,i)=>renderField(id,field,i)).join('')}</div>`}${prompt?renderPromptEditor():`<section class="output-panel"><div class="output-heading"><h3>나의 분석 준비 기록</h3><span id="record-count" class="tiny"></span></div><label class="sr-only" for="company-record">입력 내용을 모은 분석 준비 기록</label><textarea id="company-record" rows="9" readonly placeholder="위 입력칸에 작성한 내용을 모아 보여드립니다."></textarea><div class="output-actions"><button class="secondary" id="copy-company-record" type="button">기록 복사</button><span id="worksheet-status" class="tiny" role="status">${storageOK?'이 브라우저에 자동 저장':'저장 불가 · 내려받기로 보관하세요'}</span></div></section>`}<div class="check-note"><strong>완료하기 전에</strong><p>${id==='1-0'?'분석 질문이 하나로 좁혀졌는지, 사실과 미확인 내용이 나뉘었는지 확인하세요. 자료의 진위는 직접 점검합니다.':id==='1-1'?'할 작업·선택 이유·제공할 자료·결과 확인 기준이 모두 있는지 확인하세요. 아직 선택 전이면 필요한 기능부터 적어도 좋습니다.':'완성본을 읽고 내 자료와 경험만 들어갔는지, 근거가 없는 내용을 처리할 기준이 있는지 확인하세요. 복사 후 선택한 외부 AI에서 직접 실행하세요.'}</p></div><details class="legacy-note"><summary>이 단계의 자유 메모</summary><label class="note-label" for="previous-note">추가 메모 · 기존 메모 확인과 수정</label><textarea id="previous-note" rows="5" placeholder="기억할 내용이나 추가 질문을 적어보세요.">${esc(state.notes[id]||'')}</textarea></details>${id==='1-0'?'<div class="next-action"><p>분석 목적을 정했다면 작업에 맞는 도구 선택 기준을 살펴보세요.</p><a class="primary" href="#course/company/1">도구 선택 기준 알아보기 →</a></div>':id==='1-1'?'<div class="next-action"><p>준비한 자료와 선택 기준을 지침 프롬프트로 정리해 보세요.</p><a class="primary" href="#course/company/2">기업 분석 프롬프트 만들기 →</a></div>':'<div class="next-action"><p>작성한 요청문과 분석 준비 기록은 내 메모에서 함께 확인할 수 있습니다.</p><a class="secondary" href="#notes">내 기록 모아보기 →</a></div>'}`;
    if(prompt)bindPromptEditor(id);
    else{bindWorksheetFields(id);updateCompanyRecord(id);document.querySelector('#copy-company-record').onclick=()=>copyText(Workbook.exportText(id,worksheetData(id)),document.querySelector('#company-record'));}
    document.querySelector('#previous-note').oninput=event=>{state.notes[id]=event.target.value;save();};
  }
  bindLessonButtons();if(id==='1-0'&&selectedTab==='guide')document.querySelector('#copy-company-accuracy').onclick=()=>copyText(CompanyLessons.accuracyPrompt,document.querySelector('#company-accuracy-prompt'));return true;
}
