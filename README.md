# notibot

인스타그램 게시물 댓글에 특정 키워드(예: "오이")가 달리면 자동으로 DM(private reply)을 발송하는
백오피스 서비스입니다. 쿠팡파트너스 공동구매 게시물처럼 "댓글 달면 링크 DM으로 보내드려요" 방식의
운영을 자동화하기 위한 용도로 만들었습니다.

## 동작 방식

1. Meta(Instagram) 웹훅이 게시물 댓글 이벤트를 `POST /webhook`으로 전달합니다.
2. 서명(`X-Hub-Signature-256`)을 검증한 뒤, 댓글이 달린 인스타그램 계정을 찾습니다.
3. 해당 게시물(media) 또는 계정 전체에 등록된 트리거 규칙(키워드) 중 매칭되는 것을 찾습니다.
4. 매칭되면 연결된 DM 템플릿을 렌더링해서 [private reply API](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/private-replies)로 발송합니다.
5. 결과(성공/실패/매칭없음)를 `CommentEvent` 로그로 남겨 백오피스 API에서 조회할 수 있습니다.

## 요구 사항 (Meta 측 준비물)

이 서버는 Instagram Graph API 웹훅을 받는 쪽만 구현합니다. 아래는 별도로 준비해야 합니다.

- Meta for Developers 앱 생성, Instagram 비즈니스/크리에이터 계정 연결
- Webhook 구독: `instagram` object, `comments` field, 콜백 URL = `https://<host>/webhook`
- `IG_VERIFY_TOKEN`: 웹훅 구독 시 사용할 임의의 검증 토큰
- `IG_APP_SECRET`: 앱 시크릿 (서명 검증용)
- 각 인스타그램 계정의 Page Access Token (private reply 발송용, `/api/accounts`로 등록)

## 시작하기

```bash
cp .env.example .env   # 값 채우기
npm install
npm run prisma:push    # SQLite dev.db 생성
npm run dev             # http://localhost:3000
```

## 스크립트

- `npm run dev` — tsx watch로 개발 서버 실행
- `npm run build` / `npm start` — 빌드 후 실행
- `npm test` — 테스트 DB(prisma/test.db)에 스키마를 push한 뒤 vitest 실행
- `npm run typecheck` — 타입 검사만 수행

## 백오피스 API

| Method | Path | 설명 |
| --- | --- | --- |
| GET/POST | `/api/accounts` | 인스타그램 계정 등록/조회 (`pageAccessToken`은 응답에서 숨김) |
| GET/PATCH/DELETE | `/api/accounts/:id` | 계정 단건 조회/수정/삭제 |
| GET/POST | `/api/dm-templates` | DM 템플릿. 본문에 `{{username}}` 변수 사용 가능 |
| GET/POST | `/api/trigger-rules` | 트리거 규칙. `mediaId`를 비우면 계정 전체(글로벌) 규칙 |
| GET/POST | `/api/events` | 댓글 처리 로그 (`dmStatus`: SENT/FAILED/SKIPPED/NO_MATCH) |

트리거 규칙은 `matchType`으로 `CONTAINS`(기본) / `EXACT` / `REGEX`를 지원하고, 같은 게시물에
여러 규칙이 매칭되면 `priority`가 높은 쪽, 게시물 전용 규칙이 계정 전체 규칙보다 우선합니다.

## 아직 안 한 것

- 프론트엔드 관리 화면 (현재는 REST API만 제공)
- 쿠팡파트너스 링크 생성 자체는 포함하지 않음 — DM 템플릿에 미리 만든 링크를 넣어 사용
- 실제 Meta 웹훅 구독/토큰 발급은 사용자가 Meta for Developers에서 직접 진행 필요
