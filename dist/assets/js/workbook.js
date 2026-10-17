'use strict';
// Approved original lesson material; this is not a transcription of the Notion images.
window.Workbook = (() => {
  const promptFields = [
    ['target','목표 직무와 준비 단계','지원 기업·직무·채용 수준과 현재 상황을 적으세요. 자기소개서·포트폴리오·면접 등 이번 준비 단계도 정합니다.','다온테크 신입 백엔드 / 자기소개서 지원 동기 준비'],
    ['background','나의 배경','재사용할 나의 정보를 정리하세요. 학력·교육, 기술·어학 자격, 주요(Main)·보조(Sub) 기술과 실제 사용 범위를 구분합니다. 없는 항목은 없음 또는 미취득으로 적으세요.','학력·교육: 컴퓨터공학 전공, 웹 개발 교육 수료 / 자격: 기술·어학 미취득 / Main: Java·Spring API 구현 / Sub: Git 공동 작업'],
    ['task','이번에 도움받을 작업','해결할 문제, 구체적으로 필요한 도움과 제약 조건을 적으세요. 새 작업을 할 때 이 항목을 바꿉니다.','지원 동기 문항의 개요를 만들고, 프로젝트 경험과 공고 업무를 연결할 근거를 찾아주세요. 회사에 관한 판단은 제공한 자료로 한정하세요.'],
    ['evidence','사용할 자료와 실제 경험','프로젝트 2~3개를 고를 수 있다면 이름·내 담당·핵심 기술·문제와 해결 행동·결과·확인 자료로 정리하세요. 하나뿐이면 그 경험으로 시작합니다. 재사용할 경험 기록과 이번 문항·공고 자료를 구분하고, 측정하지 않은 결과는 미측정으로 남기세요.','[프로젝트] 주문 조회 서비스 / 담당: API·SQL / 문제: 조회 조건 누락 / 행동: 재현·조건 수정 / 결과: 테스트 통과 / 근거: 코드·테스트 기록\n[이번 자료] 지원 문항·분량, 공고 발췌·출처·확인일'],
    ['format','원하는 결과 형식','완성 문단·개요·비교표 중 필요한 형식과 구성 순서, 분량·공백 포함 여부, 언어·문체를 정하세요.','지원 계기 → 내 경험 → 기여 방향의 3단 개요 / 공백 포함 700자 이내 / 간결하고 정중한 문체'],
    ['rules','지켜야 할 기준','마무리 지침으로 어조·금지 사항·검증 방법을 적으세요. 회사명·직무명·기술명과 내 역할·성과를 어떤 자료와 대조할지 정하고, 부족한 정보는 질문하도록 요청합니다.','제공하지 않은 경력·기술·수치를 만들지 마세요. 회사명·직무명은 공고와, 내 역할·결과는 프로젝트 기록과 대조하세요. 과한 수식어를 줄이고 자료가 부족하면 질문하세요.']
  ];
  const promptGroups=[
    {title:'나의 정보',help:'배경과 프로젝트 경험은 다음 작업에서도 재사용합니다. 경험 기록과 이번에 제공할 문항·공고 자료를 구분하세요.',keys:['background','evidence']},
    {title:'해결하고자 하는 문제',help:'이번 지원 대상과 필요한 작업·제약 조건을 정합니다.',keys:['target','task']},
    {title:'출력 방법',help:'받고 싶은 결과의 형식·구조·분량·문체를 정합니다.',keys:['format']},
    {title:'마무리',help:'어조와 금지 사항, 답변을 검증할 기준을 정합니다.',keys:['rules']}
  ];
  const revisionFields = [
    ['original','AI가 작성한 원문','검토할 AI 답변의 문장이나 문단을 그대로 붙여 넣으세요. 원문은 이 칸에 남기고, 수정은 마지막 칸에서 합니다.','수정할 AI 초안을 여기에 붙여 넣으세요.'],
    ['issues','사실과 다르거나 막연한 표현','문제 표현 → 고칠 이유 → 수정 방향 순서로 적으세요. 경험·수치·회사 정보와 내 역할을 대조하고, 반복 연결어·획일적인 문장 길이·나열식 구성을 살핍니다. 문체만으로 AI 작성 여부를 판정하지 않으며, 고칠 점이 없다면 확인한 이유를 적으세요.','어떤 행동인지 설명 없이 “탁월한 협업 능력”이라고 적혀 있어요.'],
    ['facts','내가 실제로 한 행동과 확인 가능한 결과','문제 상황 → 내가 맡은 범위와 행동 → 확인 가능한 결과를 적고, 대조한 기록도 남기세요. 함께 한 일은 구분하고, 확인하지 못한 수치나 효과는 미확인으로 표시합니다.','제가 직접 한 행동: …\n확인할 수 있는 결과: …'],
    ['revised','나의 말로 수정한 문장','평소 어조·자주 쓰는 말·피할 표현을 정해 확인한 사실로 다시 쓰세요. 직접 쓴 글이 있으면 개인정보를 뺀 짧은 문체 예시를 선택적으로 참고하되 그 글의 경험·수치를 가져오지 않습니다. 문제·내 행동·결과가 드러나는 수정본을 소리 내어 읽고 문항·분량을 확인하세요.','내가 한 일과 확인한 결과가 드러나도록 작성해 보세요.']
  ];
  const checks = [
    ['truth','경험과 수치가 실제 사실인지 확인했어요.'],
    ['role','내가 직접 한 역할과 행동이 구체적으로 드러나요.'],
    ['voice','면접에서도 내 말로 설명할 수 있어요.']
  ];
  const companyFields = {
    '1-0':[
      ['target','목표 기업과 직무','기업명, 모집 직무, 신입·경력 등 이번 지원 범위를 적어주세요.','다온테크 / 신입 백엔드 개발자'],
      ['question','분석으로 답할 질문','회사에 대해 많이 아는 것보다, 이번 분석으로 알아낼 질문 하나를 정하세요.','공고의 어떤 요구 사항에 내 API 개발 경험을 연결할 수 있을까?'],
      ['sources','현재 가진 자료','자료명, 출처나 URL, 작성일·확인일을 적으세요. 자료가 없다면 아직 없다고 적고 찾을 자료를 정하세요.','공식 채용 공고 / 출처 URL / 확인일 / 담당 업무 원문 발췌'],
      ['facts','사실과 미확인 내용','자료에서 확인한 사실과 추측을 나누세요. 미확인 내용이 없다면 없다고 표시하세요.','확인: 공고에 주문 API 개발·SQL 활용 명시\n미확인: 주문 시스템 전면 개편 여부\n다음 확인: 공식 발표나 공고 추가 설명']
    ],
    '1-1':[
      ['task','이번에 할 작업','검색, 자료 요약, 공고와 경험 비교 중 지금 필요한 작업과 범위를 적으세요.','확보한 채용 공고와 내 프로젝트 경험을 항목별로 비교하기'],
      ['tool','사용할 도구와 선택 이유','직접 선택한 도구 이름과 확인한 기능을 적으세요. 아직 선택하지 않았다면 필요한 기능을 적어도 좋아요.','선택 전 / 원문 입력과 항목별 비교가 가능하고 자료 밖의 주장을 구분할 수 있는지 확인'],
      ['materials','제공할 자료','어떤 자료를 어떤 범위로 제공할지 적으세요. 개인정보와 비공개 자료는 제외하세요.','공개 채용 공고의 담당 업무·자격 요건 / 내 실제 역할과 프로젝트 기록'],
      ['verification','결과를 확인할 기준','답변을 받은 뒤 원문과 대조할 항목을 구체적으로 정하세요.','공고 문구와 내 역할을 바꾸지 않았는지, 없는 수치나 기업 정보를 추가했는지 확인']
    ],
    '1-2':[
      ['target','목표 기업·직무','이번에 지원할 기업과 모집 직무를 구체적으로 적으세요.','다온테크 / 신입 백엔드 개발'],
      ['question','분석 목적·질문','현재 상황, 구체적으로 필요한 도움, 분량·기한 등 이번 작업의 제약 조건과 분석 후 내릴 결정을 적으세요.','공고의 주요 요구와 내 경험을 연결하고 추가 준비할 근거 찾기'],
      ['sources','기업·공고 자료','원문 발췌, 자료명, 출처와 기준일을 적으세요. 링크만으로 내용을 읽었다고 가정하지 않습니다.','자료명: 채용 공고\n출처·기준일: 직접 확인한 정보\n원문: 담당 업무와 자격 요건 발췌'],
      ['experience','나의 배경·실제 경험과 근거','학력·교육, 기술·어학 자격, Main·Sub 기술과 실제 사용 범위를 나눠 적으세요. 주요 프로젝트 2~3개가 있다면 이름·내 담당·핵심 기술·문제와 해결 행동·결과·확인 자료로 정리합니다. 하나뿐이면 하나로 시작하고 없는 자격은 없음, 성과 수치는 미측정으로 남기세요.','학력·교육: 컴퓨터공학 전공 / 기술·어학 자격: 미취득 / Main: SQL 조회 구현 / Sub: Git 공동 작업. 프로젝트: 주문 조회 서비스 / 담당: API·SQL / 문제: 조건 누락 / 행동: 재현·수정 / 결과: 테스트 통과 / 근거: 코드·명세. 운영 성과 미측정.'],
      ['format','원하는 결과 형식','표·개요·문단 등 형식, 구성 순서, 분량·공백 포함 여부, 언어·문체를 정하세요.','공고 요구 / 내 경험과 연결점 / 부족한 근거 / 추가 질문 순서의 표'],
      ['rules','지켜야 할 기준','어조·금지 사항·검증 기준을 정하세요. 회사명·직무명·기술 용어와 내 역할·성과를 대조할 자료, 불확실성 표시와 정보가 부족할 때의 질문 방식을 적습니다.','제공 자료만 사용하고 사실과 해석을 구분하세요. 없는 기업 정보·기술·성과 수치는 만들지 말고, 근거가 없으면 미확인으로 표시하세요.']
    ]
  };
  const companyPromptGroups=[
    {title:'나의 정보 · 재사용할 배경과 경험',help:'학력·교육, 기술·어학 자격, Main·Sub 기술과 실제 프로젝트를 정리합니다.',keys:['experience']},
    {title:'해결하고자 하는 문제 · 이번 작업',help:'기업·직무와 현재 상황, 구체적인 도움, 제약 조건과 제공할 공고 자료를 바꿔 적습니다.',keys:['target','question','sources']},
    {title:'출력 방법',help:'형식·구조·분량·공백 기준·언어와 문체를 정합니다.',keys:['format']},
    {title:'마무리',help:'어조·금지 사항과 회사명·직무명·기술 용어를 대조할 자료를 정합니다.',keys:['rules']}
  ];
  const analysisId='1-4';
  const analysisAreas=[
    ['overview','기업 개요·실적','주력 수익 구조와 매출·영업이익 흐름. 비교 기간·단위·연결/별도 범위를 맞추세요.'],
    ['market','시장 분석','점유율, 주요 경쟁사, 차별점과 경쟁 우위의 근거. 비교 대상과 기간을 명시하세요.'],
    ['business','사업 동향','주력 사업, 신사업, 투자·연구개발 방향. 계획과 실제 성과를 구분하세요.'],
    ['culture','기업 문화','일하는 방식, 인재상, 복지. 회사의 소개 문구와 실제 근무 환경에 대한 판단을 구분하세요.'],
    ['swot','종합 SWOT','강점·약점(내부), 기회·위협(외부)을 나누고 각 판단의 자료 근거를 적으세요.']
  ];
  companyFields[analysisId]=[
    ['target','기업·직무·분석 목적·기준일','어느 기업을 언제 기준으로 분석하고, 자소서·면접 준비에서 무엇을 알아낼지 적으세요.','다온테크 / 백엔드 / 수익 구조와 지원 직무 이해 / 기준일: …'],
    ['sources','제공할 자료·근거 위치','4단계 기록에서 실제 제공할 자료를 골라 식별자, 문서명, 작성자, 발행일·대상 기간, 위치와 필요한 원문을 적으세요.','자료 A / 사업보고서 / 작성 주체 / 발행일·대상 기간 / 파일·URL / 12쪽 원문: …'],
    ['original','AI가 작성한 분석 원문','외부 AI에서 받은 답변을 그대로 보관하세요. 아래 분석 메모를 수정해도 이 원문은 유지됩니다.','실제로 받은 답변을 붙여 넣으세요.'],
    ...analysisAreas.map(([key,label,help])=>[key,label,help+' 사실·출처 위치 / 내 해석 / 미확인·다음 질문을 나누세요. 자료가 없으면 미확인과 필요한 자료를 적으세요.','사실·출처 위치: …\n내 해석: …\n미확인·다음 질문: …']),
    ['application','직무·경험 연결 메모','선택 항목입니다. 기업 전체 분석을 마친 뒤 내 실제 경험과 연결할 점을 적으세요.','공고의 API 업무와 내가 직접 구현한 기능의 연결점: …']
  ];
  const postingId='1-6';
  companyFields[postingId]=[
    ['target','지원 기업·공고명·직무·채용 수준','지원할 법인명, 정확한 공고명·직무명과 신입/경력 구분을 적으세요. 직무명이 같아도 업무가 같다고 가정하지 않습니다.','다온테크 / 2026년 신입 백엔드 개발자 채용 / 서비스개발팀 / 신입'],
    ['source','지원 공고 출처·날짜·모집 상태','공식 공고 URL 또는 보관 파일, 게시일·수정일·확인일과 모집 상태를 기록하세요. 채용 사이트에서 발견했다면 공식 공고와 대조한 결과를 적으세요.','공식 채용 페이지 URL / 보관 파일 / 게시·수정일: … / 확인일: … / 모집 중·마감·미확인: …'],
    ['original','지원 공고 원문 보관','직접 읽은 공고의 필요한 원문을 그대로 보관하세요. 아래 분류를 수정해도 이 원문은 바뀌지 않습니다. 읽지 못했다면 그 이유를 남기고 미확인으로 표시하세요.','[담당 업무 원문] …\n[자격 요건 원문] …\n[우대 사항·기술·지원 안내 원문] …'],
    ['duties','담당 업무','지원 공고에 명시된 업무와 원문 위치를 적으세요. 회사의 사업 소개를 이 직무의 업무로 단정하지 마세요.','주문 API 개발·운영 / 지원 공고의 담당 업무 1항'],
    ['qualifications','필수 자격·필요 역량','공고의 필수·지원 자격 표현을 유지하세요. 필수인지 구분되지 않으면 원문을 남기고 미확인으로 적으세요.','Java 개발 및 SQL 활용 가능 / 지원 공고 자격 요건 1항'],
    ['preferred','우대 사항','우대 조건은 필수 자격과 나누어 기록하세요. 미기재라면 없음으로 단정하지 말고 미기재라고 적으세요.','API 문서화 경험 우대 / 지원 공고 우대 사항 1항'],
    ['technologies','사용 기술·명시된 맥락','기술명과 그 기술이 업무·필수·우대 중 어디에 적혀 있는지 남기세요. 공고에 없는 실제 운영 기술은 미확인입니다.','Java·SQL: 자격 요건 / Kubernetes: 미기재, 실제 사용 여부 미확인'],
    ['application','지원 조건·일정·절차','고용 형태·근무지, 접수 기간·마감 시각(시간대), 지원 경로·제출 서류·전형을 적으세요. 해당 항목이 공고에 없으면 미확인으로 남기세요.','정규직 / 서울 / 접수: … / 마감: … (시간대) / 공식 지원 페이지 / 이력서·포트폴리오 / 전형: …'],
    ['questions','미확인 내용·다음 확인','불명확한 요건이나 빠진 내용, 공식 공고·채용 문의 등 다음 확인 경로를 적으세요. 추가 질문이 없으면 없다고 적으세요.','운영 기술과 배치 팀은 미확인. 공식 공고의 상세 설명과 채용 문의에서 확인한다.'],
    ['references','참고 공고 · 선택','지원 공고가 부족할 때만 경쟁사의 동일 직무 또는 지원 기업의 경력직 공고를 참고하세요. 기업·직무·채용 수준·출처·확인일·원문 위치와 참고 내용을 따로 적으세요.','참고 R / 모아서비스 / 백엔드 경력 3년 / URL·확인일 / 담당 업무: API 운영 모니터링'],
    ['referenceLimits','참고 공고의 차이·적용 한계','참고 공고를 적었다면 필수입니다. 법인·직무·조직·채용 수준 차이와 추가 확인할 질문을 남기세요. 참고 요건을 지원 기업의 필수 조건으로 옮기지 마세요.','다른 법인·경력직 공고다. 모니터링은 조사 질문으로만 활용하며 다온테크 신입의 필수 요건으로 간주하지 않는다.']
  ];
  const roleId='1-7';
  companyFields[roleId]=[
    ['target','선택한 기업·직무·채용 수준·선택 이유','이번에 분석할 직무 하나를 정하세요. 기업·공고명·신입/경력 구분과 공고의 어떤 업무 때문에 선택했는지 적으세요.','다온테크 / 신입 백엔드 / 공고 A / 주문 API 개발 업무를 이해하려고 선택'],
    ['posting','지원 공고 원문·출처','7단계에서 실제 분석할 공고를 골라 출처·확인일·원문 위치와 필요한 업무·자격·우대 문구를 직접 옮기세요. 미기재 내용은 만들지 않습니다.','지원 공고 A / 공식 URL·확인일 / 담당 업무 1항: 주문 API 개발·운영 / 자격: Java·SQL / 우대: API 문서화 경험'],
    ['experience','제공할 나의 실제 경험 · 선택','연결을 검토할 실제 경험이 있다면 직접 한 역할·행동·확인 가능한 결과를 적으세요. 아직 정리 전이면 비워 두거나 미제공이라고 적으세요.','팀 프로젝트에서 주문 API 구현과 SQL 쿼리 작성 담당. API 명세 작성. 운영 성과 지표는 측정하지 않음.'],
    ['comparison','유사·경력직 참고 공고 · 선택','비교할 공고를 제공할 때만 작성하세요. 기업·직무·채용 수준·출처·확인일·원문과 지원 공고와의 차이·적용 한계를 함께 적으세요.','참고 R / 다른 기업의 경력직 / URL·확인일 / 원문: 운영 모니터링 / 다른 법인·경력 수준이므로 지원 공고의 필수 요건으로 옮기지 않음'],
    ['original','외부 AI가 작성한 답변 원문 · 선택','외부 AI를 사용했다면 실제 답변을 그대로 보관하세요. 아래 분석을 수정해도 이 원문은 유지됩니다. 직접 분석했다면 비워 두어도 됩니다.','실제로 받은 직무 분석 답변을 붙여 넣으세요.'],
    ['features','공고 특징·근거','강조한 업무·특이한 문구·조건을 원문 위치와 함께 적으세요. 유사 공고를 제공하지 않았다면 다른 공고와의 차별성은 미확인입니다.','관찰: 주문 API 개발·운영을 담당 업무로 명시(A 1항). 해석: 개발 이후 운영도 살펴볼 필요. 비교 공고 미제공으로 업계 내 차별성은 미확인.'],
    ['keyword1','강점 키워드 1 · 업무와 역량의 연결','키워드 하나와 이를 뒷받침하는 공고 문구·위치, 업무에 필요한 역량으로 해석한 이유를 적으세요. 내 강점이 입증됐다는 뜻은 아닙니다.','키워드: API 구현·데이터 처리 / 근거: A 담당 업무 1항·자격 요건 / 해석: API 기능과 SQL 활용을 설명할 역량이 필요'],
    ['keyword2','강점 키워드 2 · 선택','두 번째 키워드를 뒷받침할 근거가 있을 때만 적으세요. 공고에 없는 도구나 역량을 채우기 위해 만들지 마세요.','키워드: API 문서화 / 근거: A 우대 사항 / 해석: API 사용법·협업 문서를 설명하는 경험이 도움. 필수 조건은 아님'],
    ['experienceTypes','필요한 경험 유형','키워드를 보여주려면 어떤 역할·행동·결과 자료가 필요한지 구체화하세요. 필요한 경험의 예시는 내가 실제로 했다는 진술과 구분합니다.','API 설계·구현에서 맡은 기능, SQL 사용 이유, 테스트·명세 등 확인 가능한 산출물을 설명하는 경험'],
    ['matches','내 경험 연결 후보·부족한 근거','제공한 실제 경험만 직무 요구에 연결하세요. 아직 경험을 제공하지 않았다면 미연결과 다음에 정리할 경험을 적으세요. 강점으로 단정하기 전에 역할·결과 근거를 확인합니다.','후보: 직접 구현한 주문 API와 SQL 쿼리. 근거: 코드·API 명세. 운영 성과는 측정하지 않았으므로 부족한 근거로 남김.'],
    ['questions','미확인·추가 준비','공고에 없거나 답변에서 추정한 주장, 더 확인할 자료와 다음 행동을 남기세요. 없으면 없다고 적으세요.','실제 운영 환경·업무 비중은 미확인. 공식 설명을 확인하고 내 프로젝트의 역할·결과 근거를 다음 자기분석에서 정리한다.']
  ];
  const career=id=>window.CareerLessons?.lessons[id];
  const requiredFields=id=>career(id)?fields(id).filter(f=>!f[4]):fields(id).filter(([key])=>!(id===analysisId&&key==='application')&&!(id===postingId&&['references','referenceLimits'].includes(key))&&!(id===roleId&&['experience','comparison','original','keyword2'].includes(key)));
  function composeAnalysis(data){
    if(!['target','sources'].some(key=>typeof data[key]==='string'&&data[key].trim()))return '';
    return `목적·대상·분석 기준일: ${data.target?.trim()||'[기업·직무·목적·기준일을 작성하세요]'}

제공 자료:
${data.sources?.trim()||'[실제로 제공할 자료와 원문을 작성하세요]'}

사업보고서·증권사 리포트·공식 뉴스룸·대표 신년사·언론 보도 중 실제로 제공한 자료를 사용해 주세요. 파일이나 링크를 읽을 수 없으면 확인하지 못한 내용을 알려 주세요.

다음 순서로 분석해 주세요.
${analysisAreas.map(([,label,help],i)=>`${i+1}. ${label}: ${help}`).join('\n')}

각 영역에서 사실과 출처 위치 / 해석 / 미확인·추가 질문을 구분하세요.
수치·정확한 사업명·기술 키워드를 사용하되 자료에 없는 값은 만들지 마세요.
비교 기간·단위·범위를 맞추고, 회사의 계획과 실제 실적을 구분하세요.
분량 제한 없이 수치·키워드·불릿 포인트로 읽기 쉽게 작성하세요.
자료가 부족하면 '미확인'으로 표시하고 필요한 자료를 제안하세요.

추가 조사는 제가 기간과 조사 질문을 지정해 요청하고 검색 기능을 사용할 수 있을 때만 진행하세요. 공식 뉴스룸·신년사·최근 언론 보도를 추가로 확인했다면 새 자료의 출처·날짜·근거를 제공 자료와 구분해 주세요. 검색하거나 자료를 열 수 없으면 알려 주세요.`;
  }
  function composeRole(data={}){
    if(!['target','posting'].some(key=>typeof data[key]==='string'&&data[key].trim()))return '';
    const supplied=key=>typeof data[key]==='string'&&data[key].trim()?data[key].trim():'';
    return `선택한 기업·직무·채용 수준·선택 이유:
${supplied('target')||'[기업·직무·채용 수준을 작성하세요]'}

[지원 공고 원문·출처]
${supplied('posting')||'[분석할 지원 공고의 실제 원문·출처·확인일을 제공하세요]'}

[나의 실제 경험 · 제공한 정보만]
${supplied('experience')||'미제공. 필요한 경험 유형만 제안하고, 제가 한 경험이나 강점으로 단정하지 마세요.'}

[비교용 참고 공고 · 지원 공고와 구분]
${supplied('comparison')||'미제공. 다른 공고보다 특이하거나 유일하다고 단정하지 마세요.'}

위 지원 공고에 명시된 업무와 자격 요건을 근거로 다음 순서로 직무를 분석해 주세요.
1. 공고 특징: 강조된 업무·문구·조건과 원문 위치. 유사 공고 대비 차이는 실제 비교 자료가 있을 때만 설명하세요.
2. 강점 키워드: 공고 업무에서 필요한 역량을 해석하고 핵심 키워드 1~2개를 제시하세요. 각 키워드에 정확한 공고 문구·위치와 업무-역량 연결 이유를 붙이세요. 지원자 개인의 강점으로 인증하지 마세요.
3. 필요 경험 유형: 위 역량을 보여줄 역할·행동·결과·산출물의 유형을 구체화하세요.
4. 내 경험 연결 후보: 제가 제공한 실제 경험만 연결하고 부족한 근거를 남기세요. 경험을 제공하지 않았다면 미연결로 표시하세요.
5. 미확인·다음 질문: 원문에 없는 주장과 확인할 자료를 정리하세요.

명확한 어조로 작성하되 추측을 사실처럼 쓰지 마세요. 공고의 명시 내용과 역량에 대한 해석을 나누고, 필수·우대 구분을 유지하세요.
참고 공고의 법인·조직·채용 수준 차이를 표시하고 그 조건을 지원 공고의 필수 요건으로 옮기지 마세요.
읽지 못한 링크·파일은 알려 주세요. 공고에 없는 기술·업무 비중·성과 수치와 제가 하지 않은 경험을 만들지 마세요.
답변을 받은 뒤 제가 공고 원문과 실제 경험 기록을 직접 대조하겠습니다.`;
  }
  const collectionId='1-3',maxSourceCards=20;
  const sourceFields=[
    ['target','분석 기업·직무·질문','정확한 법인명, 지원 직무와 이번 자료에서 답을 찾을 질문을 적으세요.','다온테크 / 백엔드 / 주요 서비스와 주문 API 업무는 어떻게 연결될까?'],
    ['source','자료 이름·종류·작성 주체','자료 A처럼 이름을 붙이고 공시·증권사 리포트·기업 소개 등 자료 종류와 작성자를 적으세요.','자료 A / 2025년 가상 사업보고서 / 다온테크'],
    ['location','원문 URL 또는 파일 위치','실제로 확인한 문서 위치를 남기세요. 링크만 적었다고 자료를 읽거나 검증한 것은 아닙니다.','저장한 보고서 파일명과 폴더 또는 직접 확인한 원문 URL'],
    ['dates','발행일·대상 기간·확인일','읽은 날짜와 자료의 대상 기간을 구분하세요. 정정 여부나 모르는 날짜는 미확인으로 적으세요.','발행: … / 대상 기간: … / 확인일: … / 정정 여부: …'],
    ['evidence','확인한 내용·근거 위치','주요 제품·서비스, 매출 구성, 연구개발 등 질문에 필요한 내용과 페이지·항목을 함께 적으세요.','주요 제품 및 서비스 12쪽: 기업 고객용 주문 관리 서비스 제공. 기술 스택은 이 문단에 없음.'],
    ['questions','미확인 내용·다음 조사','자료에 없는 내용과 다음에 볼 자료를 적으세요. 추가 질문이 없다면 없다고 적으세요.','이 서비스의 담당 직무는 미확인. 해당 법인의 현재 채용 공고를 확인한다.']
  ];
  const sourceCards=data=>Array.isArray(data?.cards)?data.cards:[];
  const sourceCardText=card=>sourceFields.filter(([key])=>typeof card?.[key]==='string'&&card[key].trim()).map(([key,label])=>`[${label}]\n${card[key]}`).join('\n\n');
  const verificationId='1-5',maxVerificationCards=20;
  const verdicts=[['confirmed','확인됨'],['corrected','수정 후 확인'],['error','오류 확인·제외'],['unverified','미확인']];
  const verificationFields=[
    ['claim','확인할 주장 하나','기업명과 확인할 문장을 적으세요. 여러 주장은 카드로 나누고 원래 표현을 보관하세요.','다온테크는 Kubernetes로 모든 서비스를 운영한다.'],
    ['source','직접 대조한 원문·근거 위치','자료명·작성 주체·URL 또는 파일·문단/쪽수·발행일·대상 기간·확인일과 원문을 적으세요. 열지 못한 자료는 그대로 표시하세요.','자료 B / 공식 채용 공고 / URL 또는 파일 / 담당 업무 / 발행·확인일: … / 원문: 주문 API 개발, SQL 활용'],
    ['comparison','비교 기준·변경·누락 정보','법인·기간·단위·연결/별도 범위·정정 여부, 계획과 실적을 대조하세요. 공식 홈페이지·최신 기사에서 확인한 후속 발표와 빠진 내용도 기록하세요.','법인 일치 / 수치·단위 해당 없음 / 기술 이름과 모든 서비스라는 범위는 원문에 없음 / 후속 자료 미확인'],
    ['reason','판단 이유','근거가 주장을 뒷받침하거나 반박하는 이유를 적으세요. 확인 불가를 오류로 단정하지 마세요.','이 공고만으로 기술 사용 여부를 알 수 없다. 사용하지 않는다는 뜻도 아니다.'],
    ['final','사용할 최종 문장','확인됨·수정 후 확인일 때 필수입니다. 출처 위치와 기준일을 붙이세요. 다른 상태의 문장은 참고용으로 보관하며 사용할 문장 목록에 포함하지 않습니다.','직접 대조한 원문으로 뒷받침할 수 있는 문장과 출처: …'],
    ['next','제외 이유·다음 확인','제외할 표현과 다음에 확인할 자료·질문을 적으세요. 남은 질문이 없다면 없다고 적으세요.','Kubernetes와 모든 서비스 운영 주장은 제외. 회사 공개 기술 자료에서 추가 확인.'],
    ['verdict','내 판단','원문을 직접 대조한 뒤 마지막에 선택하세요. 카드 내용을 수정하면 판단이 해제됩니다.','']
  ];
  const verificationCards=data=>Array.isArray(data?.cards)?data.cards:[];
  const verdictLabel=value=>verdicts.find(([key])=>key===value)?.[1]||'판단 전';
  const verificationCardText=card=>verificationFields.filter(([key])=>typeof card?.[key]==='string'&&card[key].trim()).map(([key,label])=>`[${label}]\n${key==='verdict'?verdictLabel(card[key]):card[key]}`).join('\n\n');
  const missingSummary=labels=>labels[0]+(labels.length>1?` 외 ${labels.length-1}개 항목`:'');
  function validateVerificationCard(card={}){
    const required=verificationFields.filter(([key])=>key!=='verdict'&&(key!=='final'||['confirmed','corrected'].includes(card.verdict)));
    const missing=required.filter(([key])=>typeof card[key]!=='string'||!card[key].trim()).map(([,label])=>label);
    if(missing.length)return '먼저 작성해 주세요: '+missingSummary(missing);
    if(!verdicts.some(([key])=>key===card.verdict))return '원문을 대조한 뒤 내 판단을 선택해 주세요.';
    return '';
  }
  function verifiedSentences(data={}){
    return verificationCards(data).flatMap((card,i)=>['confirmed','corrected'].includes(card?.verdict)&&!validateVerificationCard(card)?[`[주장 ${i+1} · ${verdictLabel(card.verdict)} · 사용자 판단]\n${card.final}\n[근거]\n${card.source}`]:[]).join('\n\n');
  }
  function composeVerification(data={}){
    const inputs=verificationCards(data).map((card,i)=>{
      const parts=verificationFields.filter(([key])=>['claim','source','comparison'].includes(key)&&typeof card?.[key]==='string'&&card[key].trim()).map(([key,label])=>`[${label}]\n${card[key]}`);
      return parts.length?`[검토 대상 ${i+1}]\n${parts.join('\n\n')}`:'';
    }).filter(Boolean).join('\n\n');
    return `[대상 기업 / 분석 기준일 / 추가 검색할 기간을 직접 작성하세요]
앞선 분석의 정확하지 않거나 빠진 내용을 점검해 주세요.

${inputs||'[확인할 주장과 실제 제공할 원문·출처를 작성하거나 첨부하세요]'}

제가 제공한 원문과, 검색 가능한 경우 직접 열어 확인한 공식 홈페이지·최신 기사를 근거로 삼아 주세요. 링크만으로 자료를 읽었다고 가정하지 마세요. 카드에 적은 비교 메모는 제 검토 의견이며 원문과 다시 대조해 주세요.
주장별로 원래 주장 / 자료의 제목·URL 또는 파일·발행일·근거 위치 / 뒷받침하거나 충돌하는 근거 / 변경·누락 정보 / 확인 가능·오류 확인·미확인과 이유 / 수정 제안·추가 자료를 정리해 주세요.
법인·기간·단위·연결/별도 범위·정정 여부를 맞추고 계획과 실제 실적을 구분하세요.
확인하지 못한 것을 틀렸다고 단정하지 마세요. 접근하지 못한 자료는 읽었다고 하지 말고, 검색 기능이 없으면 알려 주세요.
이 답변은 검토 보조 자료입니다. 최종 판단과 사용할 문장은 제가 원문과 직접 대조하겠습니다.`;
  }
  const worksheetIds=['0-1','0-2',...Object.keys(companyFields),collectionId,verificationId,...Object.keys(window.CareerLessons?.lessons||{})];
  const isPrompt=id=>Boolean(career(id))||['0-1','1-2',analysisId,verificationId,roleId].includes(id);
  function fields(id){if(career(id))return career(id).fields;return id==='0-1'?promptFields:id==='0-2'?revisionFields:id===collectionId?sourceFields:id===verificationId?verificationFields:companyFields[id]||[];}
  function has(id){return career(id)?window.CareerLessons.activeIds.includes(id):id==='0-0'||worksheetIds.includes(id);}
  function clean(raw){const result={};for(const id of worksheetIds){const obj=raw?.[id];if(!obj||typeof obj!=='object'||Array.isArray(obj))continue;result[id]={};if(id===verificationId){if(Array.isArray(obj.cards))result[id].cards=obj.cards.filter(card=>card&&typeof card==='object'&&!Array.isArray(card)).slice(0,maxVerificationCards).map(card=>Object.fromEntries(verificationFields.filter(([key])=>typeof card[key]==='string'&&(key!=='verdict'||card[key]===''||verdicts.some(([value])=>value===card[key]))).map(([key])=>[key,card[key]])));if(typeof obj.custom==='string')result[id].custom=obj.custom;continue;}if(id===collectionId){if(Array.isArray(obj.cards))result[id].cards=obj.cards.filter(card=>card&&typeof card==='object'&&!Array.isArray(card)).slice(0,maxSourceCards).map(card=>Object.fromEntries(sourceFields.filter(([key])=>typeof card[key]==='string').map(([key])=>[key,card[key]])));continue;}for(const [key] of fields(id))if(typeof obj[key]==='string')result[id][key]=obj[key];if(isPrompt(id)&&typeof obj.custom==='string')result[id].custom=obj.custom;if(id==='0-2')for(const [key] of checks)result[id][key]=obj[key]===true;}return result;}
  function compose(data={},id='0-1'){if(career(id)){const lesson=career(id);const parts=lesson.inputs.flatMap(key=>{const value=data[key];return typeof value==='string'&&value.trim()?[`[${fields(id).find(f=>f[0]===key)[1]}]\n${value.trim()}`]:[];});return parts.length?lesson.task+'\n\n'+parts.join('\n\n')+'\n\n제공한 자료와 실제 경험만 사용하세요. 사실·해석·미확인을 구분하고, 없는 기술·역할·성과 수치는 만들지 마세요. 읽지 못한 링크나 파일은 알려 주세요. 정보가 부족하면 필요한 질문을 남기세요. 답변은 제가 원문과 직접 대조합니다.':'';}if(id==='0-1'){const blocks=promptGroups.flatMap(group=>{const entries=group.keys.flatMap(key=>typeof data[key]==='string'&&data[key].trim()?[`[${promptFields.find(f=>f[0]===key)[1]}]\n${data[key].trim()}`]:[]);return entries.length?['#'+group.title+'\n'+entries.join('\n\n')]:[];});return blocks.length?'아래 정보를 바탕으로 요청한 작업을 도와주세요.\n\n'+blocks.join('\n\n'):'';}if(id==='1-2'){const blocks=companyPromptGroups.flatMap(group=>{const rows=group.keys.flatMap(key=>typeof data[key]==='string'&&data[key].trim()?[`[${fields(id).find(f=>f[0]===key)[1]}]\n${data[key].trim()}`]:[]);return rows.length?['#'+group.title+'\n'+rows.join('\n\n')]:[];});return blocks.length?'아래 제공한 기업·공고 자료와 실제 경험을 바탕으로 분석을 도와주세요.\n\n'+blocks.join('\n\n'):'';}if(id===roleId)return composeRole(data);if(id===verificationId)return composeVerification(data);if(id===analysisId)return composeAnalysis(data);if(!isPrompt(id))return '';const parts=fields(id).filter(([key])=>typeof data[key]==='string'&&data[key].trim()).map(([key,label])=>`[${label}]\n${data[key].trim()}`);const intro=id==='1-2'?'아래 제공한 기업·공고 자료와 실제 경험을 바탕으로 분석을 도와주세요.':'아래 정보를 바탕으로 요청한 작업을 도와주세요.';return parts.length?intro+'\n\n'+parts.join('\n\n'):'';}
  function output(data={},id='0-1'){return typeof data.custom==='string'?data.custom:compose(data,id);}
  function validate(id,data={}){if(career(id)){const missing=requiredFields(id).filter(([key])=>key!=='review'&&!career(id).checklist?.some(([check])=>check===key)&&(typeof data[key]!=='string'||!data[key].trim())).map(f=>f[1]);if(missing.length)return '먼저 작성해 주세요: '+missingSummary(missing);if(career(id).checklist?.some(([key])=>data[key]!=='confirmed'))return '체크리스트의 모든 항목을 확인한 뒤 완료해 주세요.';return data.review==='confirmed'?'':'최종 확인을 마친 뒤 완료해 주세요.';}if(id===verificationId){const cards=verificationCards(data);if(!cards.length)return '검증 카드 한 개 이상을 작성해 주세요.';if(cards.length>maxVerificationCards)return `검증 카드는 ${maxVerificationCards}개까지 작성할 수 있어요.`;for(let i=0;i<cards.length;i++){const error=validateVerificationCard(cards[i]);if(error)return `주장 ${i+1}: ${error}`;}return '';}if(id===collectionId){const cards=sourceCards(data);if(!cards.length)return '자료 카드 한 개 이상을 작성해 주세요.';for(let i=0;i<cards.length;i++){const missing=sourceFields.filter(([key])=>typeof cards[i]?.[key]!=='string'||!cards[i][key].trim()).map(([,label])=>label);if(missing.length)return `자료 ${i+1}: 먼저 작성해 주세요: ${missingSummary(missing)}. 사용하지 않는 빈 카드는 삭제할 수 있어요.`;}return '';}const missing=requiredFields(id).filter(([key])=>typeof data[key]!=='string'||!data[key].trim()).map(([,label])=>label);if(missing.length)return `먼저 작성해 주세요: ${missingSummary(missing)}`;if(id===postingId&&typeof data.references==='string'&&data.references.trim()&&!(typeof data.referenceLimits==='string'&&data.referenceLimits.trim()))return '참고 공고의 차이·적용 한계를 작성해 주세요.';if(id===postingId&&typeof data.referenceLimits==='string'&&data.referenceLimits.trim()&&!(typeof data.references==='string'&&data.references.trim()))return '참고 공고의 출처와 내용을 함께 작성해 주세요.';if(isPrompt(id)&&id!==roleId&&!output(data,id).trim())return '완성 프롬프트가 비어 있어요. 내용을 작성해 주세요.';if(id==='0-2'&&checks.some(([key])=>data[key]!==true))return '마지막 점검 3개를 확인한 뒤 완료해 주세요.';return '';}
  function exportText(id,data={}){if(id===verificationId){const blocks=verificationCards(data).map((card,i)=>{const text=verificationCardText(card);return text?`[주장 ${i+1}]\n${text}`:'';}).filter(Boolean);if(typeof data.custom==='string'&&data.custom.trim())blocks.push('[직접 수정한 검증 요청문]\n'+data.custom);const confirmed=verifiedSentences(data);if(confirmed)blocks.push('[사용자가 원문 대조 후 선택한 문장 · 자동 사실 인증 아님]\n'+confirmed);return blocks.join('\n\n');}if(id===collectionId)return sourceCards(data).map((card,i)=>{const text=sourceCardText(card);return text?`[자료 ${i+1}]\n${text}`:'';}).filter(Boolean).join('\n\n');const checklist=career(id)?.checklist;const blocks=fields(id).filter(([key])=>!checklist?.some(([check])=>check===key)&&typeof data[key]==='string'&&data[key].trim()).map(([key,label])=>`[${label}]\n${career(id)&&(key==='review'||career(id).checklist?.some(([check])=>check===key))?(data[key]==='confirmed'?'확인 완료':'확인 전'):data[key]}`);if(isPrompt(id)&&output(data,id).trim())blocks.push('[완성 프롬프트]\n'+output(data,id));if(!blocks.length)return '';if(checklist)blocks.push('[최종 체크리스트]\n'+checklist.map(([key,label])=>`${data[key]==='confirmed'?'[x]':'[ ]'} ${label}`).join('\n'));if(id==='0-2')blocks.push('[최종 점검]\n'+checks.map(([key,label])=>`${data[key]?'[x]':'[ ]'} ${label}`).join('\n'));return blocks.join('\n\n');}
  const examplePrompt='저는 신입 백엔드 개발자 직무의 자기소개서를 준비하고 있습니다. 아래에 제공하는 문항과 실제 프로젝트 경험만 사용해 문제 해결 경험의 글 구성을 제안해 주세요. 상황, 제가 직접 한 행동, 결과 순서로 정리해 주세요. 제공하지 않은 기술·성과 수치는 만들지 말고, 작성에 꼭 필요한 정보가 부족하면 먼저 질문해 주세요.\n\n[자기소개서 문항]\n[내가 실제로 겪은 상황과 맡은 역할]\n[직접 한 행동과 확인할 수 있는 결과]';
  return {roleId,postingId,verificationId,maxVerificationCards,verificationFields,verificationCards,verdicts,verdictLabel,verificationCardText,validateVerificationCard,verifiedSentences,analysisId,analysisAreas,requiredFields,promptFields,promptGroups,revisionFields,companyPromptGroups,companyFields,collectionId,maxSourceCards,sourceFields,sourceCards,sourceCardText,worksheetIds,isPrompt,checks,fields,has,clean,compose,output,validate,exportText,examplePrompt};
})();
