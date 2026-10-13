# Verification notes

Verified during source preparation:

- `npm run build`: Express TypeScript compilation and Next.js optimized production build passed.
- `npm run typecheck`: backend and frontend strict TypeScript checks passed.
- `npm test`: 22 Jest unit tests passed.
- `npm run test:integration`: 2 integration tests passed against a real temporary MongoDB replica set. These cover concurrent updates to different posts and the same post, partial payouts, budget caps, repeated updates, decreased views, auth and role restrictions.

- Production HTTP smoke test passed: all five frontend routes, cookie forwarding through the Next.js proxy, signup, campaigns, submissions, payouts, repeat updates, earnings, foreign-origin rejection and logout. Reproduce it with `npm run test:smoke`.
- `npm run format:check`: Prettier formatting passed.

The temporary MongoDB test server uses `--nounixsocket` so it can run in environments that permit TCP but restrict Unix sockets.

A graphical browser was unavailable in the preparation environment, so interactive browser clicks and visual layout have not been verified. Docker and external deployment have not been run here. Before submission, run the walkthrough in README.md in a browser and test the deployed URLs.
