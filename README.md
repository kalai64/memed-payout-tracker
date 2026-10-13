# Meme’d Campaign Payout Tracker

This app lets brands create campaigns and creators submit their Instagram or YouTube posts. Creators earn money when their posts reach the campaign’s view milestones. Brands can see how much of their budget has been spent and how much is left.

## Tech stack

- Backend: Node.js, TypeScript, Express and MongoDB with Mongoose
- Frontend: Next.js, TypeScript and Tailwind CSS
- Testing: Jest
- Formatting: Prettier

The backend and frontend are in separate folders. The project uses npm workspaces, so you can install all packages from the main folder.

## Run the project locally

You’ll need Node.js 22 LTS, npm and MongoDB Atlas or a local MongoDB replica set. A standalone MongoDB server won’t work because the payout updates use transactions.

### 1. Install the packages

Open a terminal in the main project folder and run:

```bash
npm install
```

### 2. Set up the environment files

Copy `backend/.env.example` to `backend/.env` and update the values:

```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_random_secret_at_least_32_characters_long
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

If you’re using Atlas, create a database user, allow your IP address in Network Access and copy the connection string into `MONGO_URI`. Use `memed` as the database name. Special characters in the database password need to be URL-encoded.

Copy `frontend/.env.example` to `frontend/.env.local`:

```env
BACKEND_URL=http://localhost:4000
```

### 3. Start the backend

In the first terminal, from the main project folder:

```bash
cd backend
npm run dev
```

The backend runs at http://localhost:4000. You can check it at http://localhost:4000/api/health.

### 4. Start the frontend

Open another terminal in the main project folder:

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

You can also start both apps from the main folder with:

```bash
npm run dev
```

## What you can do

**As a brand:** create a campaign, choose Instagram or YouTube, set a budget and add view milestones with their payouts. The dashboard shows the amount spent, the remaining budget and creator submissions.

**As a creator:** browse campaigns that still have funds, submit post links and see your total earnings. You can submit more than one post to a campaign, but the same post cannot be submitted twice to that campaign.

Both roles can use the view-count simulator. The app does not fetch real view counts from Instagram or YouTube.

## How payouts work

Each post earns the amount of the highest milestone it has reached. For example:

| Views | Total payout |
| --- | --- |
| 10,000 | ₹500 |
| 50,000 | ₹2,000 |
| 100,000 | ₹5,000 |

If a post reaches 10,000 views, it earns ₹500. When it reaches 50,000 views, another ₹1,500 is added, bringing the total to ₹2,000. Updating the same view count again does not pay anything extra.

If a post jumps straight to 100,000 views, its total payout is ₹5,000. The milestone amounts are not added together.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check the API |
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get the current user |
| GET | `/api/campaigns` | List campaigns for the logged-in role |
| POST | `/api/campaigns` | Create a campaign as a brand |
| GET | `/api/submissions` | Get submissions and creator earnings |
| POST | `/api/submissions` | Submit a post as a creator |
| PATCH | `/api/submissions/:id/views` | Update the simulated view count |

Requests use JSON. Protected routes accept the session cookie or a bearer token. Errors return a `message` field with the appropriate HTTP status.

## Try it out

1. Sign up as a brand and create a campaign with a ₹7,500 budget and the milestones shown above.
2. Log out, then sign up as a creator.
3. Submit a post URL that matches the campaign platform.
4. Update its views to 10,000, then 50,000. Your total earnings should go from ₹500 to ₹2,000.
5. Repeat the 50,000-view update. Your earnings should stay the same.
6. Update to 100,000 views. Your earnings should become ₹5,000.
7. Log in as the brand. The campaign should show ₹5,000 spent and ₹2,500 remaining.
8. Log back in as the creator and submit another post. If it reaches 100,000 views, it gets the remaining ₹2,500, with the rest shown as unpaid.

## Tests and formatting

Run these commands from the main project folder:

```bash
npm run typecheck
npm test
npm run test:integration
npm run test:smoke
npm run format:check
```

Unit tests cover milestone calculations, budget caps, repeated payouts, validation and view spikes. Integration tests use a temporary MongoDB replica set to check authentication and concurrent payouts. The smoke test checks the frontend routes and API flow through the Next.js proxy.

The MongoDB test binary is downloaded on the first run, so internet access is needed.

To format the code:

```bash
npm run format
```

Use this connection string in `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/memed?replicaSet=rs0&directConnection=true
```

The Docker settings use development cookies for local HTTP. Production needs HTTPS, `NODE_ENV=production` and a new JWT secret.

## Production and deployment

To build locally:

```bash
npm run build
```

Then start each app in its own terminal from the main folder:

```bash
npm start -w backend
```

```bash
npm start -w frontend
```

The backend can be hosted on Render and the frontend on Vercel, with MongoDB Atlas for the database.

For the backend, keep the deployment root at the main project folder:

```bash
# Build
npm ci && npm run build -w backend

# Start
npm start -w backend
```

Set `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production` and `FRONTEND_URL` in the backend host. Use `/api/health` for its health check.

For the frontend, use `frontend` as the root directory and enable access to workspace files outside that folder. Set `BACKEND_URL` to the backend’s HTTPS URL before building. Browser requests go through the Next.js `/api` proxy, so this URL should not include `/api`.

Set the backend’s `FRONTEND_URL` to the exact frontend origin, without a trailing slash. Restart the backend after changing it. Changing `BACKEND_URL` requires a frontend rebuild.

The assignment requires a public GitHub repository and a working live link. Neither is included in the source package. Add both before submitting, and keep `.env` files out of Git.

## Optional features

The app flags unusually fast view growth: at least 50,000 new views and a fivefold increase within 60 seconds of the previous update. The first update is not flagged because there is no earlier reading to compare. Flags stay visible and do not block payouts.

Docker support and concurrent payout protection are included. Redis caching is not included.

## Scaling to 10,000 creators

I would add cursor pagination for campaigns and submissions, and calculate earnings with a database aggregation instead of loading every post. Platform updates would go through a queue, with duplicate events filtered out before processing.

A busy campaign would need updates processed in order because all its payouts share one budget. MongoDB transactions would remain the final check. I would also add a payout ledger for reconciliation, shared rate limiting and monitoring for failed updates and transaction retries. Redis could cache campaign details, while payout decisions would still use the current database budget. The frontend, API and workers could then scale separately.
