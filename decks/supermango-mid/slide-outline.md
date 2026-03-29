# Supermango — 랄프톤 서울 중간발표 Slide Outline

## Slide 1: 표지
- **프로젝트명:** Supermango
- **부제:** Slack 링크 자동 요약 & 카드뉴스
- **팀:** Supermango
- **팀원:** 이용현 (@YPD-ism) · 한대환 (@dhan-iscream)
- **GitHub:** github.com/ProudBiz/supermango

## Slide 2: 문제 정의
- **누구?** Slack에서 매일 대량의 링크를 공유받는 팀원
- **무엇이 아픈가?**
  - 하루 15개 이상의 링크가 쌓임
  - 건당 3분 이상 → 하루 45분+ 소요
  - 읽긴 읽지만 집중해서 읽지 못함
- **왜 중요한가?**
  - 의사결정자, 멀티 프로젝트 참여자일수록 심각
  - 서로 다른 관심사의 링크 → 컨텍스트 스위칭 비용
  - 실제 동료들의 고통 호소

## Slide 3: 솔루션 — LinkDigest
- **한 문장:** "Slack 링크 자동 요약 & 카드뉴스"
- **핵심 흐름:**
  1. Slack 채널에 링크 공유
  2. 봇이 👀 리액션 → Jina Reader로 콘텐츠 추출
  3. Gemini로 3줄 요약 + 태그 자동 생성 → ✅ + 스레드 응답
  4. 카드뉴스 3장 이미지 생성 → 🖼️ + 스레드 게시
  5. 웹앱 피드에서 통합 조회 · 태그 검색 · 공유

## Slide 4: 나의 랄프 세팅
- **AI 에이전트/모델:**
  - Claude Code (Opus 4.6 + Sonnet 4.6)
- **워크플로우 툴:**
  - Superpowers, gstack, Context7, frontend-skills
- **자체 Ralph 루프 엔진:**
  - `pnpm loop` → headless 자율 반복
  - Planner → Coder → Reviewer → QA 자동 순환
  - 5회 실패 시 known_issue 분류 → 다음 태스크로 전진
  - 모든 변경마다 자동 커밋

## Slide 5: 현재 진행 상황
- **전체 기능 구현 완료**
- 9개 스토리 · 18개 태스크 모두 완성
- Slack Bot: 링크 감지 → 요약 → 카드뉴스 파이프라인 동작
- 웹앱: OAuth 로그인, 피드, 필터, 공유 페이지, 랜딩페이지 완성
- e2e 테스트까지 작성 완료
