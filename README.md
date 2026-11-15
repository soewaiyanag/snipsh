# snipsh

A URL shortener: a NestJS API and a React web app in one repository.

| App | Folder | Live |
| --- | --- | --- |
| API | [`apps/api`](apps/api) | https://snipsh-api.onrender.com |
| Web | [`apps/web`](apps/web) | https://snipsh-swya.vercel.app |

Each app has its own `package.json` and is installed and run from its own folder:

```bash
cd apps/api && yarn && yarn start:dev
cd apps/web && yarn && yarn dev
```
