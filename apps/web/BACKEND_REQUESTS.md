# Backend requests

Things the web app still needs from the API in [`apps/api`](../api). The web app adapts to the API as it is and does not hide a gap.

## 1. The signed-in user's email and plan

`GET /auth/me` returns only the token's contents (`sub`, `iat`, `exp`), so the header cannot show who is logged in. Today the web app keeps the email typed at login in `localStorage`.

**Ask:** return `{ id, email, plan, createdAt }` from `/auth/me`. With the plan, the UI could explain the free limits (custom slugs, number of links) before the user hits a `403`.

## 2. Editing a link

There is no `PATCH /links/:id`, so the web app shows Edit only against the mocks.

## Noted, no action needed

- Another user's link answers `403` ("belongs to another user"), which confirms the id exists. The web app shows it as "does not exist"; a `404` would reveal less.
- A wrong password on `DELETE /auth/me` is a `401`, the same status as an expired token. The web app does not sign out on that one request, so a typo keeps the session.

## Done

- CORS allows the deployed web app.
- `GET /links/:id/stats` (total, clicks per day, top referrers).
- `GET /links?page=&limit=` is paginated on the server.
- `DELETE /auth/me` with the password, and the public `POST /links/report`.
- Disabled links: `isActive` on every link, and the redirect answers `410`.
