# 파일·폴더 정리

2026-10-18. 웹 코드·참고 자료·작업 문서·임시 파일을 용도별로 정리했다.

| 이전 위치 | 현재 위치 |
| --- | --- |
| `dist/*.js` | `dist/assets/js/` |
| `dist/style.css`, `dist/theme.css` | `dist/assets/css/` |
| `dist/output/md_file/` | `resources/md/`의 주제별 폴더 |
| `dist/output/pdf/` | `resources/pdf/` |
| `dist/pdf.zip` | `resources/archives/pdf.zip` |
| 초기 검토 HTML·CSS | `resources/archives/review/` |
| `dist/tmp/` | `.local/checks/` |
| `dist/.playwright-mcp/` | `.local/browser-logs/` |

기존 `output`은 원문·작업 문서가 들어 있는 참고 자료 폴더여서 `resources`로 변경했다. Markdown은 AI·기업·자소서·포트폴리오·면접·화면·통합 검토·과거 기록으로 분류했다. 원문 PDF의 사용자 지정 번호순 파일명은 유지했다.

파일은 이동 직후 해시로 보존을 확인했고, HTML 자산 경로·테스트 참조·문서 상대 링크·이전 PDF 이름을 수정했다. 실행 진입점 `dist/index.html`, 저장 키, 배포 디렉터리 설정은 유지했다. 원문 PDF·ZIP과 `.local`은 Git 제외 경로를 갱신했다.

정리 중 기존 자동 검사 462개는 통과했다. 사용자의 지적에 따라 이후 전체 기능 검사는 다시 실행하지 않으며, 경로·누락 확인으로 범위를 제한한다. 전체 화면 점검에서 화면 오류는 없었지만, 검사 스크립트의 로컬 파일 요청 판정 오류와 재실행 중 중단이 있어 해당 실행을 완전 통과로 기록하지 않는다.

현재 문서 위치와 링크는 [문서 목차](../README.md), 실행 방법과 폴더 구성은 [프로젝트 README](../../../README.md)를 참고한다. 앞선 PDF 대조 보완과 사용성 검토 문서도 이번 정리에서 보존했다.
