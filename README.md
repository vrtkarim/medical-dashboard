# Medical Analytics Dashboard

Node.js + React (CDN) dashboard for ready-to-use SPARQL clinical analytics on AllegroGraph.

## 1) Install

```bash
cd medical-dashboard
npm install
cp .env.example .env
```

## 2) Run

```bash
npm run dev
```

Open http://localhost:3000

## Notes

- Queries are whitelisted on the backend in `src/queries.js`.
- Browser never sees SPARQL credentials.
- Default endpoint targets AllegroGraph Cloud breastcancer repository.
- Set credentials in `.env` (`SPARQL_USER`, `SPARQL_PASS`).
