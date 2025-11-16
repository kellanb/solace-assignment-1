# Discussion Topics / Follow-ups

## Questions
1. Should we enable full-text search (tsvector) to handle fuzzy matching beyond substring `ILIKE`? If so, we’ll need product guidance on ranking vs. deterministic filters.
2. Do we want to expose additional filters (e.g., telehealth availability, insurance) in the API contract? Planning ahead will keep query params stable.

## Future Improvements
- Add integration tests around `/api/advocates` to verify pagination/meta fields (using Playwright or Next’s test runner).
- Introduce skeleton loaders for the virtualized table and card grid to improve perceived latency.
- Layer in React Query devtools + logging in dev mode to monitor cache hits/misses.
- Consider server-driven streaming (e.g., incremental static regeneration or SSE) if datasets grow beyond simple pagination needs.
- Additional UI/UX optimizations, particularly on mobile

## Risks / Watchouts
- The seed fallback still returns HTTP 200 with limited data; when integrating with a real DB we should alarm on missing env vars to avoid silent degradation.
- Large specialty filters (`@>` on JSONB) benefit from the GIN index, but we should monitor query plans once real data volumes exist.
