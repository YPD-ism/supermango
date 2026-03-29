# slides-grab 설치 가이드 (KO)

`slides-grab`이 없는 경우 이 절차를 안내합니다.

## npm 설치
```bash
npm install slides-grab
npx playwright install chromium
```

설치 후 `npx slides-grab --help`로 확인합니다.

## 메모
- 덱은 `decks/<deck-name>/` 아래에서 작업합니다.
- `slides-grab edit`, `build-viewer`, `validate`, `pdf`, `convert`는 모두 `slide-*.html`이 있는 덱 디렉터리가 필요합니다.
