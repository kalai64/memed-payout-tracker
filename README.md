# Meme’d Campaign Payout Tracker

An app where brands create campaigns and creators submit posts and track their earnings.

## Setup

You need Node.js 22 LTS and MongoDB Atlas or a MongoDB replica set.

Install the packages from the main project folder:

```bash
npm install
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`. Update the values as shown below.

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Open another terminal in the main project folder and start the frontend:

```bash
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser. The backend runs on http://localhost:4000.

## Environment variables

Add these values to `backend/.env`:

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_at_least_32_characters_long
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

- `PORT`: The backend port.
- `MONGO_URI`: Your MongoDB connection string. A standalone MongoDB server will not work because payouts use transactions.
- `JWT_SECRET`: A secret used to sign login tokens.
- `FRONTEND_URL`: The frontend address allowed to send requests.
- `NODE_ENV`: Use `development` locally and `production` when deploying.

Add this value to `frontend/.env.local`:

```env
BACKEND_URL=http://localhost:8000
```

`BACKEND_URL` tells Next.js where the backend runs. Restart the frontend after changing it locally, or rebuild it for production. Keep your actual `.env` files out of Git.

## Assumptions

- A post earns the highest milestone it reaches. Milestone amounts are not added together.
- Later updates only pay the difference. If a creator has earned ₹500 and reaches a ₹2,000 milestone, another ₹1,500 is added.
- Repeating the same update does not pay again. Simultaneous updates cannot overspend the campaign budget.
- If the budget is too low, the creator receives the remaining amount. The unpaid balance is shown in the dashboard.
- Lowering the view count does not remove earnings already recorded.
- Campaigns are live while they have money left.
- Creators can submit multiple posts, but the same post cannot be submitted twice to one campaign.
- View counts are updated manually for this assessment. Either logged-in role can use the simulator; real platform analytics are not fetched.
- Amounts are entered and displayed in rupees, but stored and returned by the API in paise.
- Earnings are recorded in the app; no actual bank payment is made.
