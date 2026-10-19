# 작업 문서 목차

2026-10-20 기준. **5개 가이드·45개 목차의 로컬 구현과 기업 분석 첫 3단계 원문 대조까지 완료**했습니다. PDF 5종·128쪽과 전체 45개 목차의 내용 대조를 수행하고 안내 2곳을 보완했습니다. 현재 자동 검사 501개·JavaScript 23개 문법 검사 통과. AI 활용법 제외 4개 가이드·39개 단계의 PDF 2차 검토와 예시·작성칸·완성 요청문 일치 검증도 반영했습니다. 이후 화면 조정으로 본문·보조 설명 확대와 화이트/다크 모드 선택을 지원합니다.

## 현재 상태를 확인할 보고서

| 주제 | 보고서 |
| --- | --- |
| 최신 화면 단순화 | [홈 모달·작성 흐름·보관함 정리](modifications/simplification-implementation.md) — 기본 정보 선택, 작성/결과 보기, 관리 기능 정리 |
| 공통 정보·프롬프트 관리 | [프로필·AI 설정·편집·폴더 보관함](modifications/prompt-studio-implementation.md) — 선택적 재사용, 독립 저장본, 구·신규 백업 지원 |
| 최신 구조·입력 개선 | [선택형 입력과 목차 이동](modifications/structure-and-select-inputs.md) — 선택·직접 입력·다중 기술, 항상 열린 목차, 본문과 겹치지 않는 이동 메뉴 |
| 최신 PDF 2차 검토 | [39개 항목 정밀 대조](modifications/non-ai-pdf-second-pass.md) — 항목별 예시·출력/검토 기준·문장 보완·기록 보존 |
| PDF 1차 수정 | [AI 활용법 제외 39개 단계 수정](modifications/non-ai-pdf-first-pass.md) — 출처·주소 요구 및 외부 링크 제거, 설명·요청문·사례 재작성 |
| AI 활용법 수정 요청 | [modify.md 12개 항목 반영](modifications/implemented.md) — PDF 작업 흐름·예시·Claude 입력 항목·이동·저장 동작 |
| 파일·폴더 정리 | [구조 변경과 경로 검증](reviews/file-organization.md) — `output` → `resources`, 문서·자산·임시 파일 분류 |
| 전체 PDF 내용 대조 | [128쪽·45개 목차 대조 및 할루시네이션 점검](reviews/full-pdf-content-audit.md) — 보완 2곳, 원문과 의도적으로 다른 부분·미확인 범위 포함 |
| 사용성 추가 검증 | [터치·화면 전환·로컬 파일·백업 검증](reviews/final-usability-review.md) — Chromium 4개 환경 통과, Safari·실제 기기·OS 입력기 미검증 |
| 전체 통합 검토 | [전체 워크북 최종 검토](reviews/workbook-final-review.md) — 당시 451개 검사와 전체 화면 검증 범위 |
| 기업 분석 원문 대조 | [기업 분석 1–3단계](company/company-first-three-source-review.md) — 현재 462개 검사 |
| AI 활용법 외부 안내 | [Claude·Canva·뷰인터](ai/ai-external-implementation.md) |
| IT 포트폴리오 전체 | [전체 구현·검증](portfolio/portfolio-all-implementation.md) |
| 면접 전체 | [전체 구현·검증](interview/interview-all-implementation.md) |
| 글자 크기 | [확대 및 후속 부분 되돌리기](ui/typography-size-update.md) — 본문·보조 설명만 확대 유지 |
| 화면 모드 | [화이트·다크 선택](ui/theme-selection.md) |

## 남은 작업과 범위

- Chromium의 터치·가로/세로·로컬 파일 추가 사용성 검증은 통과했습니다. [남은 직접 확인 항목](reviews/final-usability-review.md)의 실제 기기·OS 입력기·Safari·사용자 최종 검토는 남아 있습니다.
- 외부 도구의 실제 계정 실습·산출물 제작·업로드·촬영·피드백 수신. 준비/기록 양식은 구현되어 있습니다.
- 표절·AI 검사 사이트 작업은 보류되어 있습니다.
- 요청 시 배포 대상 정리와 기존 사이트 반영·공개 주소 검증.
- AI API 연동·로그인·서버 저장·기기 간 동기화는 선택 기능이며 현재 범위에 포함되지 않습니다.

## 단계별 구현 이력

- AI 활용법: [1단계](ai/ai-step1-recheck.md), [2단계](ai/ai-step2-recheck.md), [3단계](ai/ai-step3-recheck.md), [4–6단계](ai/ai-external-implementation.md).
- 기업 분석: [1–3단계](company/company-first-three-source-review.md), [4단계](company/company-step4-implementation.md), [5단계](company/company-step5-implementation.md), [6단계](company/company-step6-implementation.md), [7단계](company/company-step7-implementation.md), [8단계](company/company-step8-implementation.md), [9단계](company/company-step9-implementation.md), [10단계](company/company-step10-implementation.md), [4–6단계 비교](company/company-analysis-4-6-comparison.md).
- 자기소개서: [1단계](essay/essay-step1-implementation.md), [2단계](essay/essay-step2-implementation.md), [3단계](essay/essay-step3-implementation.md), [4단계](essay/essay-step4-implementation.md), [5단계](essay/essay-step5-implementation.md), [6단계](essay/essay-step6-implementation.md), [7단계](essay/essay-step7-implementation.md), [8단계](essay/essay-step8-implementation.md), [9단계](essay/essay-step9-implementation.md), [10단계](essay/essay-step10-implementation.md).
- IT 포트폴리오: [1단계](portfolio/portfolio-step1-implementation.md), [2단계](portfolio/portfolio-step2-implementation.md), [3단계](portfolio/portfolio-step3-implementation.md), [전체](portfolio/portfolio-all-implementation.md).
- 면접: [전체 9개 단계](interview/interview-all-implementation.md).

## 과거 검토안

아래 문서는 초기 대체안과 당시 검토 이력입니다. 현재의 구현 범위나 도구 선택으로 해석하지 마세요.

- [AI 활용법 초기 검토안](archive/CONTENT-REVIEW.md)
- [기업 분석 첫 3단계 초기 보완안](archive/COMPANY-CONTENT-REVIEW.md)
- [기업 분석 4–6단계 초기 보완안](archive/COMPANY-RESEARCH-REVIEW.md) · [당시 검토 화면](../archives/review/company-research-review.html)
- [미채택 외부 도구 대체안](archive/EXTERNAL-LESSONS-REVIEW.md)
- [문서 정리 전 README](archive/project-history.md)

새 Markdown 문서는 이 폴더의 `ai`·`company`·`essay`·`portfolio`·`interview`·`ui`·`reviews` 중 해당 주제 폴더에 저장합니다. 초기 검토안은 `archive`에 보관합니다. 프로젝트 실행·현재 기능은 [프로젝트 README](../../README.md)를 확인하세요. 이전 보고서의 숫자·사용자 검토 대기·보류·다음 단계 표현은 해당 시점의 기록이며, 사용자 승인을 소급해 받았다는 뜻이 아닙니다.

원문 PDF와 임시 검증 파일은 Git에서 제외합니다. 과거 보고서의 PDF·임시 경로는 해당 파일이 있는 로컬 환경에서만 열립니다. 복제한 저장소의 자동 검사는 PDF 없이 실행할 수 있습니다.

- [AI 활용법 후속 수정 6개 반영](modifications/ai-follow-up-implemented.md)
- [AI 입력 항목·예시 통일](modifications/ai-field-alignment.md)
