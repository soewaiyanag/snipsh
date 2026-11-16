# snipsh

**snipsh** is a URL shortener. The name is short for **snip short**: it snips a long link down to a short one, and the name itself is snipped short too.

This repository holds both halves: the NestJS API and the React web app.

| App | Folder | Live |
| --- | --- | --- |
| API | [`apps/api`](apps/api) | https://snipsh-api.onrender.com |
| Web | [`apps/web`](apps/web) | https://snipsh-swya.vercel.app |

## Screenshots

The landing page, the links page and a link's details page. The links and click figures come from the sample data in the web app's mock API, not from real traffic.

![The snipsh landing page: a dark page with the headline "Long links, cut short.", a paste bar, and a glowing blue arc like a horizon](apps/web/docs/landing.png)

![The links page: a paste bar to shorten a URL, then a list of short links with copy and delete actions](apps/web/docs/links.png)

![A link's details page: its destination, three click figures and a clicks-per-day chart](apps/web/docs/link-details.png)

## Running it

Each app has its own `package.json` and is installed and run from its own folder:

```bash
cd apps/api && yarn && yarn start:dev
cd apps/web && yarn && yarn dev
```
